from fastapi import APIRouter
from typing import Dict, Any, List
from app.utils.agent_config_loader import get_all_agent_configs




router = APIRouter(prefix="/agents", tags=["Agents"])




def _flatten_agents() -> List[Dict[str, Any]]:
  configs = get_all_agent_configs()
  rows: List[Dict[str, Any]] = []
  for parent_name, parent_data in configs.items():
    if parent_data.get("type") == "main":
      llm_cfg = parent_data.get("llm_config") or {}
      rows.append({
        "agent_id": parent_name,
        "type": "main",
        "parent_agent": None,
        "enabled": bool(parent_data.get("enabled", True)),
        "model": llm_cfg.get("model"),
        "temperature": llm_cfg.get("temperature"),
        "max_tokens": llm_cfg.get("max_tokens"),
        "input_type": parent_data.get("input_type"),
        "output_type": parent_data.get("output_type"),
        "goal": parent_data.get("goal"),
        "success_criteria": parent_data.get("success_criteria", []),
        "token_budget": parent_data.get("token_budget"),
        "retry_policy": parent_data.get("retry_policy", {}),
        "critical": parent_data.get("critical", False),
      })
      for sub in parent_data.get("sub_agents", []):
        llm_cfg_sub = sub.get("llm_config") or {}
        rows.append({
          "agent_id": sub.get("agent_id"),
          "type": "sub",
          "parent_agent": parent_name,
          "enabled": bool(sub.get("enabled", True)),
          "model": llm_cfg_sub.get("model"),
          "temperature": llm_cfg_sub.get("temperature"),
          "max_tokens": llm_cfg_sub.get("max_tokens"),
          "input_type": sub.get("input_type"),
          "output_type": sub.get("output_type"),
          "goal": sub.get("goal"),
          "success_criteria": sub.get("success_criteria", []),
          "token_budget": sub.get("token_budget"),
          "retry_policy": sub.get("retry_policy", {}),
          "critical": sub.get("critical", False),
        })
  return rows




@router.get("/summary")
def list_agents_summary() -> Dict[str, Any]:
  rows = _flatten_agents()
  # Provide a compact mapping for quick display
  mapping = {row["agent_id"]: {"model": row["model"], "output_type": row["output_type"], "type": row["type"], "parent_agent": row["parent_agent"]} for row in rows}
  return {"agents": rows, "mapping": mapping}




@router.get("/{agent_id}")
def get_agent_details(agent_id: str) -> Dict[str, Any]:
  for row in _flatten_agents():
    if row["agent_id"] == agent_id:
      return row
  return {"error": f"Agent '{agent_id}' not found"}


