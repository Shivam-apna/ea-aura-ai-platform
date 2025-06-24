import requests
import json

def http_request_tool(url: str, method: str = "GET", headers: dict = None, body: any = None) -> str:
    """
    A tool to perform HTTP GET/POST/PUT/DELETE requests and return the full response safely.
    """
    try:
        headers = headers or {}
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        else:
            response = requests.request(method, url, headers=headers, json=body, timeout=5)

        response.raise_for_status()

        # Detect JSON response and return compact
        try:
            json_data = response.json()
            compact_json = json.dumps(json_data, separators=(',', ':'))
            return f"SUCCESS:{compact_json}"
        except Exception:
            # If not JSON, return text (could limit if text type is huge)
            return f"SUCCESS:{response.text}"

    except Exception as e:
        return f"ERROR: {str(e)}"
