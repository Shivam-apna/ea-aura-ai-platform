"""
Response parsing and data restructuring utilities
"""
import json
import re


def parse_json_response(raw_response: str):
    """Parse JSON response from agent output, including double-encoded JSON."""
    # Try to extract JSON from code blocks
    code_block_match = re.search(r"```(?:json|python)?\s*(\{.*?\})\s*```", raw_response, re.DOTALL)
    if code_block_match:
        json_str = code_block_match.group(1)
    else:
        # Try to find any JSON-like string
        loose_json_match = re.search(r"(\{.*\})", raw_response, re.DOTALL)
        if loose_json_match:
            json_str = loose_json_match.group(1)
        else:
            return {"response": raw_response, "error": "No JSON found"}

    # Attempt to load it
    try:
        parsed = json.loads(json_str)
        # If response itself is a JSON string, parse again
        if isinstance(parsed, dict) and "response" in parsed and isinstance(parsed["response"], str):
            try:
                nested = json.loads(parsed["response"])
                return nested
            except json.JSONDecodeError:
                return parsed  # outer JSON is still useful
        return parsed
    except json.JSONDecodeError:
        return {"response": raw_response, "error": "Could not parse JSON"}


def restructure_multimetric_data(response_json: dict) -> dict:
    """
    Dynamically splits the 'data' array into separate arrays,
    one for each metric, while preserving the 'Date'.
    Adds them as data, data2, data3... etc.
    """
    original_data = response_json.get("data", [])
    if not original_data:
        return response_json

    # Collect all unique metric names (excluding 'Date')
    all_keys = set()
    for row in original_data:
        all_keys.update(row.keys())
    metric_keys = [key for key in all_keys if key != "Date"]

    # Build separate data lists per metric
    metric_data_map = {}
    for metric in metric_keys:
        metric_data_map[metric] = []

    for row in original_data:
        date = row.get("Date")
        for metric in metric_keys:
            if metric in row:
                metric_data_map[metric].append({
                    "Date": date,
                    metric: row[metric]
                })

    # Reassign original 'data' and add dynamic 'data2', 'data3', ...
    response_json["data"] = metric_data_map[metric_keys[0]]  # first metric
    for i, metric in enumerate(metric_keys[1:], start=2):
        response_json[f"data{i}"] = metric_data_map[metric]

    return response_json