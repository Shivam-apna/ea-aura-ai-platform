# core/core_log.py

import os
import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger

# ✅ Step 1: Get absolute path to /app folder
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOG_DIR = os.path.join(APP_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# ✅ Step 2: Log file in /app/logs/
LOG_FILE = os.path.join(LOG_DIR, "ea_aura_backend.log")

# ✅ Step 3: Configure logger
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

file_handler = RotatingFileHandler(
    LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5
)
# Use JSON formatter
json_formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
file_handler.setFormatter(json_formatter)

console_handler = logging.StreamHandler()
console_handler.setFormatter(json_formatter)

logger = logging.getLogger("ea-aura")
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)
logger.propagate = False
