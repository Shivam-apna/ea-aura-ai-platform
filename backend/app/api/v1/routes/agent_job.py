# backend/app/api/v1/routes/agent_job.py
from app.services.dispatcher import dispatch_agent_job
from fastapi import Body
from fastapi import APIRouter
from app.models.agent_job import AgentJob
from app.services.orchestrator_agent import run_autogen_agent, run_individual_agent
from app.dao import agent_job_dao
from app.core.core_log import logger
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import UploadFile, File, Form, APIRouter
import pandas as pd
from elasticsearch import Elasticsearch, helpers
import os
from app.services.excel_to_elasticsearch import ExcelToElasticsearch
import tempfile
from app.services.avatar import generate_speech
from fastapi.responses import JSONResponse, FileResponse
import requests
import tempfile
from app.services.predictive_analysis import  get_predictive_analysis,generate_predictive_report
from app.services.next_step_agent import  next_step_analyser





router = APIRouter()

@router.post("/agent-job")
def create_job(job: AgentJob):
    return agent_job_dao.insert_doc(job.dict())

@router.get("/agent-job/{job_id}")
def get_job(job_id: str):
    return agent_job_dao.get_by_id(job_id)

@router.get("/agent-jobs/status/{status}")
def get_jobs_by_status(status: str):
    return agent_job_dao.search_jobs_by_status(status)


@router.post("/run")
def run_agent_job(payload: dict = Body(...)):
    input_text = payload["input"]
    tenant_id = payload["tenant_id"]
    chain = payload["agent_chain"]  # List of agent names
    return dispatch_agent_job(input_text, tenant_id, chain)


@router.post("/run-autogen")
def run_with_autogen(payload: dict = Body(...), request: Request = None):
    """
    Automatic Flow - System automatically chooses the best agent
    Input: input + tenant_id
    Flow: User → Orchestrator → Auto-detect Parent Agent → Auto-select Sub-agent → Response
    """
    input_text = payload.get("input")
    tenant_id = payload.get("tenant_id")

    if not input_text or not tenant_id:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing required fields",
                "details": "Both 'input' and 'tenant_id' are required"
            }
        )

    try:
        logger.info("📥 Received /run-autogen request", extra={
            "endpoint": "/api/v1/run-autogen",
            "method": "POST",
            "tenant_id": tenant_id,
            "input_text": input_text
        })

        result = run_autogen_agent(input_text, tenant_id)

        logger.info("✅ /run-autogen completed", extra={
            "tenant_id": tenant_id,
            "job_id": result.get("job_id"),
            "parent_agent": result.get("parent_agent"),
            "sub_agent": result.get("sub_agent"),
            "status": "success"
        })

        return result

    except Exception as e:
        logger.exception("❌ /run-autogen failed", extra={
            "tenant_id": tenant_id,
            "input_text": input_text,
            "error": str(e),
            "status": "failed"
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error during agent execution.",
                "details": str(e)
            }
        )


@router.post("/run-individual-agent")
def run_individual_agent_endpoint(payload: dict = Body(...), request: Request = None):
    """
    Manual Flow - User targets a specific agent directly
    Input: input + tenant_id + agent_name + agent_type (optional)
    Flow: User → Specific Agent → Response
    """
    input_text = payload.get("input")
    tenant_id = payload.get("tenant_id")
    agent_name = payload.get("agent_name")
    agent_type = payload.get("agent_type")  # Optional: "main" or "sub"

    if not input_text or not tenant_id or not agent_name:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing required fields",
                "details": "Fields 'input', 'tenant_id', and 'agent_name' are required"
            }
        )

    try:
        logger.info("📥 Received /run-individual-agent request", extra={
            "endpoint": "/api/v1/run-individual-agent",
            "method": "POST",
            "tenant_id": tenant_id,
            "agent_name": agent_name,
            "agent_type": agent_type,
            "input_text": input_text
        })

        result = run_individual_agent(input_text, tenant_id, agent_name, agent_type)

        logger.info("✅ /run-individual-agent completed", extra={
            "tenant_id": tenant_id,
            "job_id": result.get("job_id"),
            "agent_name": agent_name,
            "agent_type": result.get("agent_type"),
            "status": "success" if "error" not in result else "failed"
        })

        return result

    except Exception as e:
        logger.exception("❌ /run-individual-agent failed", extra={
            "tenant_id": tenant_id,
            "agent_name": agent_name,
            "input_text": input_text,
            "error": str(e),
            "status": "failed"
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error during individual agent execution.",
                "details": str(e)
            }
        )
    


@router.post("/uploadfile")
async def upload_file(
    file: UploadFile = File(...),
    sub_index: str = Form(...),
    index_name: str = Form(...),
    tenant_id: str = Form(...)
):
    temp_path = None
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            return JSONResponse(
                status_code=400,
                content={"error": "Only Excel files (.xlsx, .xls) are supported"}
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        logger.info(f"Processing file: {file.filename}, size: {len(content)} bytes")

        # Initialize and validate Elasticsearch connection
        pipeline = ExcelToElasticsearch(index_name=index_name, sub_index=sub_index,tenant_id=tenant_id)
        
        if not pipeline.validate_elasticsearch_connection():
            return JSONResponse(
                status_code=503,
                content={"error": "Elasticsearch connection failed"}
            )

        # Process the Excel file
        pipeline.process_excel(temp_path)

        return {
            "message": f"File '{file.filename}' processed and indexed successfully.",
            "index_name": index_name,
            "sub_index": sub_index,
            "tenant_id": pipeline.tenant_id
        }

    except Exception as e:
        logger.exception(f"Error processing file {file.filename}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to process file: {str(e)}",
                "file": file.filename
            }
        )
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Temporary file {temp_path} cleaned up")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {str(e)}")


@router.post("/text-to-speech")

def convert_text_to_speech(payload: dict = Body(...), request: Request = None):
    text = payload.get("text")
    tenant_id = payload.get("tenant_id")
    voice = payload.get("voice", "alloy")  # Default OpenAI voice

    if not text or not tenant_id:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing required fields",
                "details": "Both 'text' and 'tenant_id' are required"
            }
        )

    try:
        logger.info("📥 Received /text-to-speech request", extra={
            "endpoint": "/api/v1/text-to-speech",
            "method": "POST",
            "tenant_id": tenant_id,
            "text_length": len(text),
            "voice": voice
        })

        # Generate audio with OpenAI TTS
        audio_path = generate_speech(text=text, tenant_id=tenant_id, voice=voice)

        logger.info("✅ /text-to-speech completed", extra={
            "tenant_id": tenant_id,
            "audio_file": os.path.basename(audio_path),
            "file_size": os.path.getsize(audio_path),
            "status": "success"
        })

        return FileResponse(
            path=str(audio_path),
            media_type="audio/mpeg",
            filename=os.path.basename(audio_path),
            headers={
                "Content-Disposition": f"attachment; filename={os.path.basename(audio_path)}",
                "X-Tenant-ID": tenant_id
            }
        )

    except Exception as e:
        logger.exception("❌ /text-to-speech failed", extra={
            "tenant_id": tenant_id,
            "text": text[:100] + "..." if len(text) > 100 else text,
            "voice": voice,
            "error": str(e),
            "status": "failed"
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error during text-to-speech conversion.",
                "details": str(e)
            }
        )
    


import requests
import time
import os
import tempfile
import logging
from fastapi import File, UploadFile, Form
from fastapi.responses import JSONResponse
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)

class NiFiUploader:
    def __init__(self, nifi_url: str, username: str = None, password: str = None):
        # Properly format the NiFi URL for internal Docker communication
        if nifi_url.startswith('http://') or nifi_url.startswith('https://'):
            # Handle external URLs - convert to internal Docker service URL if needed
            if 'staging.ea-aura.ai' in nifi_url:
                # Convert external URL to internal Docker service URL
                self.nifi_url = "http://nifi:8082"
                self.api_base_url = f"{self.nifi_url}/nifi-api"
            else:
                self.nifi_url = nifi_url
                if not nifi_url.endswith('/nifi-api'):
                    self.api_base_url = f"{nifi_url}/nifi-api"
                else:
                    self.api_base_url = nifi_url
        else:
            # Assume it's already formatted correctly
            self.nifi_url = nifi_url
            self.api_base_url = f"{nifi_url}/nifi-api"
        
        self.username = username
        self.password = password
        self.session = requests.Session()
        
        # Set up authentication if provided
        if username and password:
            self.session.auth = HTTPBasicAuth(username, password)
            
        logger.info(f"NiFi URL set to: {self.nifi_url}")
        logger.info(f"NiFi API base URL: {self.api_base_url}")
    
    def validate_nifi_connection(self) -> bool:
        """Validate connection to NiFi"""
        try:
            # Test connection by hitting NiFi system diagnostics endpoint
            test_url = f"{self.api_base_url}/system-diagnostics"
            logger.info(f"Testing NiFi connection to: {test_url}")
            
            response = self.session.get(test_url, timeout=10)
            logger.info(f"NiFi connection test - Status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"NiFi connection test failed - Response: {response.text[:500]}")
                
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"NiFi connection validation failed: {str(e)}")
            return False
    
    def get_listen_http_processors(self) -> list:
        """Get all ListenHTTP processors"""
        try:
            processors_url = f"{self.api_base_url}/flow/processors"
            response = self.session.get(processors_url, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to get processors: {response.text}")
                return []
                
            processors_data = response.json()
            listen_http_processors = []
            
            for processor in processors_data.get('processors', []):
                if processor.get('component', {}).get('type') == 'org.apache.nifi.processors.standard.ListenHTTP':
                    listen_http_processors.append(processor)
                    
            return listen_http_processors
            
        except Exception as e:
            logger.error(f"Failed to get ListenHTTP processors: {str(e)}")
            return []
    
    def upload_file_to_nifi(self, file_path: str, filename: str, 
                           content_type: str = 'application/octet-stream',
                           additional_attributes: dict = None) -> dict:
        """Upload file to NiFi ListenHTTP processor"""
        try:
            # For ListenHTTP processor, we typically upload to a specific endpoint
            # You may need to adjust this URL based on your NiFi processor configuration
            upload_url = f"{self.nifi_url}/contentListener"
            
            logger.info(f"Uploading file to NiFi endpoint: {upload_url}")
            
            headers = {
                'Accept': 'application/json',
            }
            
            # Add any additional attributes as headers (NiFi ListenHTTP can read these)
            if additional_attributes:
                for key, value in additional_attributes.items():
                    # NiFi ListenHTTP processor can read custom headers
                    headers[f'X-{key}'] = str(value)
            
            with open(file_path, 'rb') as file:
                files = {
                    'file': (filename, file, content_type)
                }
                
                # For ListenHTTP, we typically use POST without authentication
                response = requests.post(
                    upload_url,
                    files=files,
                    headers=headers,
                    timeout=300  # 5 minutes timeout for large files
                )
                
                logger.info(f"NiFi upload response - Status: {response.status_code}")
                logger.info(f"NiFi upload response - Text: {response.text[:200]}")
                
                return {
                    'status_code': response.status_code,
                    'response_text': response.text,
                    'success': 200 <= response.status_code < 300
                }
                
        except requests.exceptions.Timeout:
            raise Exception("Upload to NiFi timed out")
        except requests.exceptions.ConnectionError as e:
            raise Exception(f"Failed to connect to NiFi: {str(e)}")
        except Exception as e:
            raise Exception(f"NiFi upload failed: {str(e)}")



@router.post("/upload-to-nifi")
async def upload_to_nifi(
    file: UploadFile = File(...),
    nifi_url: str = Form(...),
    tenant_id: str = Form(...),
    process_name: str = Form(default="file_processing"),
    nifi_username: str = Form(default="admin"),
    nifi_password: str = Form(default="admin123456789"),
    allowed_extensions: str = Form(default=".xlsx,.xls,.csv,.txt,.json,.xml")
):
    """
    Upload file to NiFi for processing
    """
    temp_path = None
    try:
        # Parse allowed extensions
        allowed_exts = [ext.strip() for ext in allowed_extensions.split(',')]
        
        # Validate file type
        if not any(file.filename.lower().endswith(ext.lower()) for ext in allowed_exts):
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"File type not supported. Allowed extensions: {', '.join(allowed_exts)}",
                    "filename": file.filename
                }
            )

        # Validate file size (optional - set your own limits)
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=413,
                content={
                    "error": f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f}MB",
                    "file_size_mb": len(content) / (1024*1024)
                }
            )

        # Save uploaded file temporarily
        file_extension = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        logger.info(f"Processing file: {file.filename}, size: {len(content)} bytes")

        # Initialize NiFi uploader
        uploader = NiFiUploader(
            nifi_url=nifi_url,
            username=nifi_username,
            password=nifi_password
        )
        
        # Validate NiFi connection
        if not uploader.validate_nifi_connection():
            return JSONResponse(
                status_code=503,
                content={"error": "NiFi connection failed. Please check the NiFi URL and credentials."}
            )

        # Determine content type based on file extension
        content_type_mapping = {
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.csv': 'text/csv',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.pdf': 'application/pdf'
        }
        
        content_type = content_type_mapping.get(
            file_extension.lower(), 
            'application/octet-stream'
        )

        # Prepare additional attributes to send to NiFi
        additional_attributes = {
            'tenant-id': tenant_id,
            'process-name': process_name,
            'original-filename': file.filename,
            'file-size': len(content),
            'upload-timestamp': str(int(time.time()))  # Fixed: use time.time() instead of os.time.time()
        }

        # Upload file to NiFi
        upload_result = uploader.upload_file_to_nifi(
            file_path=temp_path,
            filename=file.filename,
            content_type=content_type,
            additional_attributes=additional_attributes
        )

        if not upload_result['success']:
            return JSONResponse(
                status_code=upload_result['status_code'],
                content={
                    "error": f"NiFi upload failed with status {upload_result['status_code']}",
                    "nifi_response": upload_result['response_text'],
                    "filename": file.filename
                }
            )

        return {
            "message": f"File '{file.filename}' uploaded to NiFi successfully.",
            "filename": file.filename,
            "tenant_id": tenant_id,
            "process_name": process_name,
            "file_size_bytes": len(content),
            "nifi_url": nifi_url,
            "upload_status": "success",
            "nifi_response": upload_result['response_text']
        }

    except Exception as e:
        logger.exception(f"Error uploading file {file.filename} to NiFi: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to upload file to NiFi: {str(e)}",
                "filename": file.filename
            }
        )
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Temporary file {temp_path} cleaned up")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {str(e)}")

@router.post("/predictive-analysis")
def run_predictive_analysis(payload: dict = Body(...), request: Request = None):
    """
    Accept chart_data and analysis_type ('quick' or 'full').
    Returns chart_data with predictions, optionally saves a full report.
    """
    try:
        chart_data = payload.get("chart_data")
        tenant_id = payload.get("tenant_id", "default_tenant")
        metric_key = payload.get("metric_key", chart_data.get("title", "metric"))
        chart_type = chart_data.get("plotType", "line")
        analysis_type = payload.get("analysis_type", "quick")  # "quick" or "full"

        if not chart_data:
            return {"status": "error", "message": "chart_data is required"}

        if analysis_type == "quick":
            # Quick predictive summary (returns chart with predictions)
            predicted_chart = get_predictive_analysis(chart_data)
            return {"status": "success", "chart_data": predicted_chart}

        elif analysis_type == "full":
            # Full report: save to file and return chart + report path
            predicted_chart = get_predictive_analysis(chart_data)
            report_path = generate_predictive_report(
                chart_data=predicted_chart,
                tenant_id=tenant_id,
                metric_key=metric_key,
                chart_type=chart_type
            )
            return {"status": "success", "chart_data": predicted_chart, "report_path": report_path}

        else:
            return {"status": "error", "message": f"Unknown analysis_type: {analysis_type}"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/next-step-analysis")
def run_next_step_analysis(payload: dict = Body(...), request: Request = None):
    """
    Accept chart_data and return actionable next steps based on NextStepAnalyser.
    
    """
    try:
        chart_data = payload.get("chart_data")
        tenant_id = payload.get("tenant_id", "default_tenant")
        metric_key = payload.get("metric_key", chart_data.get("title", "metric") if chart_data else "unknown")

        if not chart_data:
            return {"status": "error", "message": "chart_data is required"}

        # Prepare data for NextStepAnalyser
        analysis_input = {
            "title": chart_data.get("title", "Unknown Chart"),
            "plot_type": chart_data.get("plotType", "line"),
            "x_label": chart_data.get("xLabel", "X-axis"),
            "y_label": chart_data.get("yLabel", "Y-axis"),
            "x_values": [],
            "y_values": []
        }

        # Extract data points from chart_data
        chart_data_points = chart_data.get("data", [])
        if isinstance(chart_data_points, list) and len(chart_data_points) > 0:
            # Handle different data formats
            if isinstance(chart_data_points[0], dict):
                # Format: [{"x": "Jan", "y": 100}, {"x": "Feb", "y": 150}]
                analysis_input["x_values"] = [point.get("x") for point in chart_data_points]
                analysis_input["y_values"] = [point.get("y") for point in chart_data_points]
            elif isinstance(chart_data_points[0], (list, tuple)) and len(chart_data_points[0]) >= 2:
                # Format: [["Jan", 100], ["Feb", 150]]
                analysis_input["x_values"] = [point[0] for point in chart_data_points]
                analysis_input["y_values"] = [point[1] for point in chart_data_points]
            else:
                # Fallback: assume it's just y-values
                analysis_input["x_values"] = list(range(len(chart_data_points)))
                analysis_input["y_values"] = chart_data_points
                
        # Handle direct x,y arrays format
        elif chart_data.get("x") and chart_data.get("y"):
            x_values = chart_data.get("x", [])
            y_values = chart_data.get("y", [])
            
            analysis_input["x_values"] = x_values
            # Clean y_values - remove $ and commas if present
            cleaned_y_values = []
            for y_val in y_values:
                if isinstance(y_val, str):
                    # Remove $ and commas, convert to float
                    cleaned_val = y_val.replace('$', '').replace(',', '')
                    try:
                        cleaned_y_values.append(float(cleaned_val))
                    except ValueError:
                        cleaned_y_values.append(0)  # fallback for invalid values
                else:
                    cleaned_y_values.append(y_val)
            
            analysis_input["y_values"] = cleaned_y_values

        logger.info(f"Next-step analysis request: tenant={tenant_id}, metric={metric_key}")

        # Run analysis using NextStepAnalyser
        result = next_step_analyser.analyze(analysis_input)


        # Handle analysis errors/blocks
        if result.get('status') == 'error':
            logger.error(f"Analysis failed: {result.get('error')}")
            return {"status": "error", "message": result.get('error')}
        elif result.get('status') == 'blocked':
            logger.warning("Analysis blocked by LLM guard")
            return {"status": "error", "message": "Analysis request was blocked for safety reasons"}

        # Add metadata to the response
        result["tenant_id"] = tenant_id
        result["metric_key"] = metric_key
        result["chart_title"] = chart_data.get("title", "Unknown Chart")
        
        # Return the complete JSON response from the agent
        return result

    except Exception as e:
        logger.error(f"Next-step analysis error: {str(e)}")
        return {"status": "error", "message": str(e)}
