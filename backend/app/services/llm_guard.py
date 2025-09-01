import re
from typing import Tuple
import httpx
from app.groq_config import get_groq_config
from app.core.core_log import agent_logger as logger

SAFE_FALLBACK_MESSAGE = "Your request cannot be processed as written. Please rephrase or provide more context."


def _contains_prompt_injection(text: str) -> bool:
    patterns = [
        r"ignore (all|any) (previous|prior) (instructions|rules)",
        r"disregard (the )?(system|previous) (prompt|message)",
        r"reveal (your )?(instructions|system prompt)",
        r"act as (an?|the) (exploiter|hacker|malicious)",
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def _contains_pii(text: str) -> bool:
    patterns = [
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN-like
        r"\b\d{16}\b",               # 16-digit card (very naive)
        r"\b\d{3}[- ]?\d{3}[- ]?\d{4}\b",  # phone
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",  # email
    ]
    return any(re.search(p, text) for p in patterns)


def _contains_toxicity(text: str) -> bool:
    patterns = [
        r"\bkill\b",
        r"\bviolent\b",
        r"\bhate\b",
        r"\bterror\w*\b", 
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)
 

def _groq_llama_guard_check(text: str, content_type: str) -> Tuple[bool, str]:
    """Use Groq llama-guard-4-12b to check text. Returns (ok, reason)."""
    try:
        cfg = get_groq_config()
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {cfg['api_key']}",
            "Content-Type": "application/json"
        }
        logger.debug(f"[LLM-GUARD] Sending {content_type} to Llama Guard: {text[:100]}...")

        system_prompt = (
            "You are Llama Guard. Classify the following {ctype} as SAFE or UNSAFE. "
            "Reply strictly in JSON with fields: safe (true/false), reason (string)."
        ).format(ctype=content_type)

        payload = {
            "model": "meta-llama/Llama-Guard-4-12B",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "temperature": 0.0,
            "max_tokens": 256
        }
        resp = httpx.post(api_url, headers=headers, json=payload, timeout=20.0)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        logger.debug(f"[LLM-GUARD] Raw response: {content}")

        try:
            parsed = json.loads(content)
            safe = bool(parsed.get("safe", False))
            reason = parsed.get("reason", "")
        except Exception:
            upper = content.upper()
            safe = "SAFE" in upper and "UNSAFE" not in upper
            reason = content

        return (True, "ok") if safe else (False, reason or "Policy violation")
    except Exception as e:
        logger.error(f"[LLM-GUARD] Error calling Llama Guard: {e}")
        return True, f"guard_unavailable:{e}"

def validate_prompt(prompt: str) -> Tuple[bool, str]:
    ok, reason = _groq_llama_guard_check(prompt, "prompt")
    if ok:
        # lightweight local checks as additional safety
        if _contains_prompt_injection(prompt):
            return False, "Prompt injection detected"
        if _contains_pii(prompt):
            return False, "Potential PII detected in prompt"
        if _contains_toxicity(prompt):
            return False, "Toxic or harmful content in prompt"
        return True, "ok"
    return False, reason


def validate_response(response: str) -> Tuple[bool, str]:
    ok, reason = _groq_llama_guard_check(response, "response")
    if ok:
        if _contains_pii(response):
            return False, "Potential PII detected in response"
        if _contains_toxicity(response):
            return False, "Toxic or harmful content in response"
        return True, "ok"
    return False, reason


