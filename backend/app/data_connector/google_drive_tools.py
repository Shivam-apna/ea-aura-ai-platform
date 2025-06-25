from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import json

def google_drive_tool(service_account_info: dict, query: str = None) -> str:
    try:
        creds = Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )
        service = build('drive', 'v3', credentials=creds)

        results = service.files().list(
            q=query or "",
            pageSize=100,
            fields="files(id,name)"
        ).execute()

        files = results.get('files', [])
        compact = json.dumps(files, separators=(',', ':'))
        return f"SUCCESS:{compact}" if files else "SUCCESS:[]"
    except Exception as e:
        return f"ERROR: {str(e)}"
