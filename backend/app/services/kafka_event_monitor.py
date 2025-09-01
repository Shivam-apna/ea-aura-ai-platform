from app.core.kafka import consume_forever, get_kafka_consumer
from app.core.core_log import agent_logger as logger
import json
import threading
import time
from typing import Dict, List, Callable
from datetime import datetime




class KafkaEventMonitor:
    """Monitor Kafka events for real-time agent status tracking"""
   
    def __init__(self):
        self.event_handlers: Dict[str, List[Callable]] = {
            "agent.status": [],
            "agent.execution": [],
            "job.progress": [],
            "orchestrator.events": []
        }
        self.is_running = False
        self.monitor_thread = None
       
    def add_event_handler(self, topic: str, handler: Callable):
        """Add an event handler for a specific topic"""
        if topic in self.event_handlers:
            self.event_handlers[topic].append(handler)
            logger.info(f"📡 Added event handler for topic: {topic}")
        else:
            logger.warning(f"⚠️ Unknown topic: {topic}")
   
    def remove_event_handler(self, topic: str, handler: Callable):
        """Remove an event handler"""
        if topic in self.event_handlers and handler in self.event_handlers[topic]:
            self.event_handlers[topic].remove(handler)
            logger.info(f"📡 Removed event handler for topic: {topic}")
   
    def _process_event(self, topic: str, event: dict):
        """Process an incoming event and call registered handlers"""
        try:
            if topic in self.event_handlers:
                for handler in self.event_handlers[topic]:
                    try:
                        handler(event)
                    except Exception as e:
                        logger.error(f"❌ Event handler error for topic {topic}: {e}", extra={
                            "event": event,
                            "handler": handler.__name__
                        })
        except Exception as e:
            logger.error(f"❌ Event processing error: {e}", extra={"event": event})
   
    def _monitor_topic(self, topic: str):
        """Monitor a specific Kafka topic"""
        logger.info(f"📡 Starting monitor for topic: {topic}")
        try:
            for event in consume_forever(topic, group_id=f"ea-aura-monitor-{topic}"):
                self._process_event(topic, event)
        except Exception as e:
            logger.error(f"❌ Topic monitor error for {topic}: {e}")
   
    def start_monitoring(self):
        """Start monitoring all configured topics"""
        if self.is_running:
            logger.warning("⚠️ Monitor is already running")
            return
       
        self.is_running = True
        logger.info("🚀 Starting Kafka event monitoring")
       
        # Start monitoring threads for each topic
        for topic in self.event_handlers.keys():
            thread = threading.Thread(
                target=self._monitor_topic,
                args=(topic,),
                daemon=True,
                name=f"kafka-monitor-{topic}"
            )
            thread.start()
            logger.info(f"📡 Started monitor thread for topic: {topic}")
       
        logger.info("✅ Kafka event monitoring started successfully")
   
    def stop_monitoring(self):
        """Stop monitoring"""
        self.is_running = False
        logger.info("🛑 Stopping Kafka event monitoring")
   
    def get_event_summary(self) -> Dict[str, int]:
        """Get a summary of events processed by topic"""
        # This would typically track metrics in a real implementation
        return {topic: len(handlers) for topic, handlers in self.event_handlers.items()}




# Global event monitor instance
event_monitor = KafkaEventMonitor()




# Example event handlers
def log_agent_status_event(event: dict):
    """Log agent status changes"""
    logger.info(f"📊 Agent Status Event: {event['agent_id']} → {event['status']}", extra={
        "job_id": event.get("job_id"),
        "tenant_id": event.get("tenant_id"),
        "step": event.get("step"),
        "event_type": "agent_status"
    })




def log_agent_execution_event(event: dict):
    """Log agent execution events"""
    logger.info(f"⚡ Agent Execution Event: {event['agent_id']} - {event['status']}", extra={
        "job_id": event.get("job_id"),
        "tenant_id": event.get("tenant_id"),
        "tokens_used": event.get("tokens_used", 0),
        "event_type": "agent_execution"
    })




def log_job_progress_event(event: dict):
    """Log job progress events"""
    logger.info(f"📈 Job Progress Event: {event['status']} - Step {event['step']}", extra={
        "job_id": event.get("job_id"),
        "tenant_id": event.get("tenant_id"),
        "total_agents": event.get("total_agents"),
        "event_type": "job_progress"
    })




def log_orchestrator_event(event: dict):
    """Log orchestrator events"""
    logger.info(f"🎭 Orchestrator Event: {event['event_type']} - {event['status']}", extra={
        "job_id": event.get("job_id"),
        "tenant_id": event.get("tenant_id"),
        "workflow_type": event.get("workflow_type"),
        "event_type": "orchestrator"
    })




# Register default event handlers
def setup_default_handlers():
    """Setup default event handlers for monitoring"""
    event_monitor.add_event_handler("agent.status", log_agent_status_event)
    event_monitor.add_event_handler("agent.execution", log_agent_execution_event)
    event_monitor.add_event_handler("job.progress", log_job_progress_event)
    event_monitor.add_event_handler("orchestrator.events", log_orchestrator_event)
    logger.info("✅ Default event handlers registered")




# Function to start the monitor (can be called from main.py)
def start_kafka_monitoring():
    """Start Kafka event monitoring with default handlers"""
    setup_default_handlers()
    event_monitor.start_monitoring()
    return event_monitor




# Function to get current monitor status
def get_monitor_status() -> Dict[str, any]:
    """Get current monitoring status"""
    return {
        "is_running": event_monitor.is_running,
        "topics": list(event_monitor.event_handlers.keys()),
        "event_summary": event_monitor.get_event_summary()
    }
