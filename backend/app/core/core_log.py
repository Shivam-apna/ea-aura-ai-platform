# core/core_log.py

import os
import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger

APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOG_DIR = os.path.join(APP_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# General app logger
app_log_file = os.path.join(LOG_DIR, "ea_aura_backend.log")
app_file_handler = RotatingFileHandler(app_log_file, maxBytes=10 * 1024 * 1024, backupCount=5)
json_formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
app_file_handler.setFormatter(json_formatter)

app_console_handler = logging.StreamHandler()
app_console_handler.setFormatter(json_formatter)

logger = logging.getLogger("ea-aura")
logger.setLevel(logging.INFO)
logger.addHandler(app_file_handler)
logger.addHandler(app_console_handler)
logger.propagate = False

# Agent-specific logger
agent_log_file = os.path.join(LOG_DIR, "ea_aura_backend_agent.log")
agent_file_handler = RotatingFileHandler(agent_log_file, maxBytes=10 * 1024 * 1024, backupCount=5)
agent_file_handler.setFormatter(json_formatter)

agent_logger = logging.getLogger("agent-logger")
agent_logger.setLevel(logging.INFO)
agent_logger.addHandler(agent_file_handler)
agent_logger.addHandler(app_console_handler)
agent_logger.propagate = False
