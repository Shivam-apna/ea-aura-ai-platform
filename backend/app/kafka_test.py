# test_kafka.py
from app.core.kafka import send_event, consume_forever
import threading
import time

TOPIC = "ea-aura-test"

def consume_thread():
    for msg in consume_forever(TOPIC):
        print("[✅ Kafka Received]", msg)

# Start consumer in background
threading.Thread(target=consume_thread, daemon=True).start()

# Send a test message
test_payload = {
    "event": "smoke_test",
    "origin": "ea-aura-backend",
    "timestamp": time.time()
}
print("[📤 Kafka Send]", test_payload)
send_event(TOPIC, test_payload)

time.sleep(5)
