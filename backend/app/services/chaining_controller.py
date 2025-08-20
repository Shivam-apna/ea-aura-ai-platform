from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.utils.agent_config_loader import get_agent_config
from app.services.llm_runner import real_agent_response
from app.services.token_tracker import token_tracker
from app.services.memory_manager import memory_manager
from app.core.core_log import agent_logger as logger
from datetime import datetime
import time
import uuid
 
def execute_chain(job_id: str, job_input: str, agent_chain: list[str], tenant_id: str):
    # Reset token tracking for this job
    try:
        token_tracker.reset_tracking()
    except Exception:
        pass
 
    current_input = job_input
 
    for step_index, agent_name in enumerate(agent_chain):
        agent_config = get_agent_config(agent_name)
 
        if agent_config.get("type") == "agent":
            sub_agents = agent_config.get("sub_agents", [])
            for sub_agent_name in sub_agents:
                # Load per-agent policy
                sub_cfg = get_agent_config(sub_agent_name) or {}
                retry_cfg = sub_cfg.get("retry_policy") or {}
                max_attempts = max(1, int(retry_cfg.get("max_attempts", 1)))
                delay_seconds = max(0, int(retry_cfg.get("delay_seconds", 0)))
                token_budget = sub_cfg.get("token_budget")
                model_name = (sub_cfg.get("llm_config") or {}).get("model", "gemma2-9b-it")
 
                # Mark running
                sub_agent_chain_dao.save({
                    "chain_id": f"{job_id}_{step_index}_{sub_agent_name}",
                    "job_id": job_id,
                    "step": step_index,
                    "agent_name": sub_agent_name,
                    "parent_agent": agent_name,
                    "status": "RUNNING",
                    "log": ""
                })
               
                # Log status change for Kibana
                logger.info(f"🔄 Agent status changed: {sub_agent_name} → RUNNING", extra={
                    "job_id": job_id,
                    "agent_id": sub_agent_name,
                    "step": step_index,
                    "status": "RUNNING",
                    "tenant_id": tenant_id,
                    "event_type": "status_change"
                })
 
                def remaining_budget() -> int | None:
                    if token_budget is None:
                        return None
                    summary = token_tracker.get_agent_token_summary(sub_agent_name)
                    return max(0, int(token_budget) - int(summary.get("total_tokens", 0)))
 
                last_error = None
                sub_output = None
                for attempt in range(1, max_attempts + 1):
                    rem = remaining_budget()
                    if rem is not None and rem <= 0:
                        last_error = f"Token budget exceeded for {sub_agent_name}"
                        break
                    try:
                        sub_output = real_agent_response(sub_agent_name, current_input, model=model_name)
                        # Validate success criteria if present
                        criteria = (sub_cfg.get("success_criteria") or [])
                        if criteria:
                            failures = []
                            lower_resp = (sub_output or "").lower()
                            if any(c.lower() in ("must output json", "output must be json", "return json") for c in criteria):
                                try:
                                    import json as _json
                                    _json.loads(sub_output)
                                except Exception:
                                    failures.append("Output is not valid JSON")
                            if any("include at least 2 charts" in c.lower() or "include at least two charts" in c.lower() for c in criteria):
                                indicators = ["plot_type", "chart", "graph", "figure"]
                                count = sum(lower_resp.count(ind) for ind in indicators)
                                if count < 2:
                                    failures.append("Fewer than 2 chart indicators found in output")
                            if failures:
                                raise ValueError(f"Success criteria failed: {failures}")
                        break
                    except Exception as e:
                        last_error = str(e)
                        if attempt < max_attempts and delay_seconds:
                            time.sleep(delay_seconds)
 
                if sub_output is None:
                    # Save failure record
                    sub_agent_chain_dao.save({
                        "chain_id": f"{job_id}_{step_index}_{sub_agent_name}",
                        "job_id": job_id,
                        "step": step_index,
                        "agent_name": sub_agent_name,
                        "parent_agent": agent_name,
                        "status": "FAILED",
                        "log": last_error or "Execution failed"
                    })
                   
                    # Log failure for Kibana
                    logger.error(f"❌ Agent execution failed: {sub_agent_name}", extra={
                        "job_id": job_id,
                        "agent_id": sub_agent_name,
                        "step": step_index,
                        "status": "FAILED",
                        "error": last_error,
                        "tenant_id": tenant_id,
                        "event_type": "status_change"
                    })
                   
                    # Do not halt chain; proceed with same current_input
                    continue
 
                # Track tokens using transformers and save memory
                token_usage = token_tracker.track_agent_tokens(
                    agent_id=sub_agent_name,
                    input_text=current_input,
                    output_text=sub_output,
                    model_name=model_name,
                    step=step_index,
                )
 
                memory_manager.save_agent_memory(
                    agent_id=sub_agent_name,
                    job_id=job_id,
                    tenant_id=tenant_id,
                    step=step_index,
                    input_text=current_input,
                    output_text=sub_output,
                    token_usage=token_usage,
                    model_name=model_name,
                )
 
                memory_manager.save_sub_agent_chain(
                    job_id=job_id,
                    step=step_index,
                    agent_name=sub_agent_name,
                    parent_agent=agent_name,
                    status="COMPLETED",
                    log=sub_output,
                    token_usage=token_usage,
                    model_name=model_name,
                )
               
                # Log completion for Kibana
                logger.info(f"✅ Agent execution completed: {sub_agent_name}", extra={
                    "job_id": job_id,
                    "agent_id": sub_agent_name,
                    "step": step_index,
                    "status": "COMPLETED",
                    "tokens_used": token_usage.total_tokens,
                    "tenant_id": tenant_id,
                    "event_type": "status_change"
                })
 
                current_input = sub_output
                time.sleep(0.2)
 
        else:
            # Load per-agent policy
            retry_cfg = agent_config.get("retry_policy") or {}
            max_attempts = max(1, int(retry_cfg.get("max_attempts", 1)))
            delay_seconds = max(0, int(retry_cfg.get("delay_seconds", 0)))
            token_budget = agent_config.get("token_budget")
            model_name = (agent_config.get("llm_config") or {}).get("model", "gemma2-9b-it")
 
            # Mark running
            sub_agent_chain_dao.save({
                "chain_id": f"{job_id}_{step_index}",
                "job_id": job_id,
                "step": step_index,
                "agent_name": agent_name,
                "parent_agent": None,
                "status": "RUNNING",
                "log": ""
            })
           
            # Log status change for Kibana
            logger.info(f"🔄 Agent status changed: {agent_name} → RUNNING", extra={
                "job_id": job_id,
                "agent_id": agent_name,
                "step": step_index,
                "status": "RUNNING",
                "tenant_id": tenant_id,
                "event_type": "status_change"
            })
 
            def remaining_budget() -> int | None:
                if token_budget is None:
                    return None
                summary = token_tracker.get_agent_token_summary(agent_name)
                return max(0, int(token_budget) - int(summary.get("total_tokens", 0)))
 
            last_error = None
            output = None
            for attempt in range(1, max_attempts + 1):
                rem = remaining_budget()
                if rem is not None and rem <= 0:
                    last_error = f"Token budget exceeded for {agent_name}"
                    break
                try:
                    output = real_agent_response(agent_name, current_input, model=model_name)
                    # Validate success criteria if present
                    criteria = (agent_config.get("success_criteria") or [])
                    if criteria:
                        failures = []
                        lower_resp = (output or "").lower()
                        if any(c.lower() in ("must output json", "output must be json", "return json") for c in criteria):
                            try:
                                import json as _json
                                _json.loads(output)
                            except Exception:
                                failures.append("Output is not valid JSON")
                        if any("include at least 2 charts" in c.lower() or "include at least two charts" in c.lower() for c in criteria):
                            indicators = ["plot_type", "chart", "graph", "figure"]
                            count = sum(lower_resp.count(ind) for ind in indicators)
                            if count < 2:
                                failures.append("Fewer than 2 chart indicators found in output")
                        if failures:
                            raise ValueError(f"Success criteria failed: {failures}")
                    break
                except Exception as e:
                    last_error = str(e)
                    if attempt < max_attempts and delay_seconds:
                        time.sleep(delay_seconds)
 
            if output is None:
                sub_agent_chain_dao.save({
                    "chain_id": f"{job_id}_{step_index}",
                    "job_id": job_id,
                    "step": step_index,
                    "agent_name": agent_name,
                    "parent_agent": None,
                    "status": "FAILED",
                    "log": last_error or "Execution failed"
                })
               
                # Log failure for Kibana
                logger.error(f"❌ Agent execution failed: {agent_name}", extra={
                    "job_id": job_id,
                    "agent_id": agent_name,
                    "step": step_index,
                    "status": "FAILED",
                    "error": last_error,
                    "tenant_id": tenant_id,
                    "event_type": "status_change"
                })
               
                # Keep current_input unchanged and continue
                continue
 
            token_usage = token_tracker.track_agent_tokens(
                agent_id=agent_name,
                input_text=current_input,
                output_text=output,
                model_name=model_name,
                step=step_index,
            )
 
            memory_manager.save_agent_memory(
                agent_id=agent_name,
                job_id=job_id,
                tenant_id=tenant_id,
                step=step_index,
                input_text=current_input,
                output_text=output,
                token_usage=token_usage,
                model_name=model_name,
            )
 
            memory_manager.save_sub_agent_chain(
                job_id=job_id,
                step=step_index,
                agent_name=agent_name,
                parent_agent=None,
                status="COMPLETED",
                log=output,
                token_usage=token_usage,
                model_name=model_name,
            )
           
            # Log completion for Kibana
            logger.info(f"✅ Agent execution completed: {agent_name}", extra={
                "job_id": job_id,
                "agent_id": agent_name,
                "step": step_index,
                "status": "COMPLETED",
                "tokens_used": token_usage.total_tokens,
                "tenant_id": tenant_id,
                "event_type": "status_change"
            })
 
            current_input = output
            time.sleep(0.2)