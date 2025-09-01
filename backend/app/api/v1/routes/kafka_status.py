from fastapi import APIRouter, HTTPException
from app.services.kafka_event_monitor import start_kafka_monitoring, get_monitor_status, event_monitor
from app.core.core_log import agent_logger as logger
from typing import Dict, Any


router = APIRouter()




@router.post("/start")
def start_monitoring() -> Dict[str, Any]:
    """Start Kafka event monitoring"""
    try:
        start_kafka_monitoring()
        return {
            "status": "success",
            "message": "Kafka event monitoring started",
            "monitor_status": get_monitor_status()
        }
    except Exception as e:
        logger.error(f"❌ Failed to start Kafka monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")




@router.post("/stop")
def stop_monitoring() -> Dict[str, Any]:
    """Stop Kafka event monitoring"""
    try:
        event_monitor.stop_monitoring()
        return {
            "status": "success",
            "message": "Kafka event monitoring stopped",
            "monitor_status": get_monitor_status()
        }
    except Exception as e:
        logger.error(f"❌ Failed to stop Kafka monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop monitoring: {str(e)}")




@router.get("/status")
def get_monitoring_status() -> Dict[str, Any]:
    """Get current Kafka monitoring status"""
    try:
        return {
            "status": "success",
            "monitor_status": get_monitor_status()
        }
    except Exception as e:
        logger.error(f"❌ Failed to get monitoring status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")




@router.get("/topics")
def get_monitored_topics() -> Dict[str, Any]:
    """Get list of monitored Kafka topics"""
    try:
        topics = list(event_monitor.event_handlers.keys())
        return {
            "status": "success",
            "topics": topics,
            "total_topics": len(topics)
        }
    except Exception as e:
        logger.error(f"❌ Failed to get monitored topics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get topics: {str(e)}")


