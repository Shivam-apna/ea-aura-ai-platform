from kafka import KafkaProducer, KafkaConsumer
import json
import logging
from typing import Generator

logger = logging.getLogger("ea-aura")

KAFKA_BROKER = "kafka:9092"


def get_kafka_producer() -> KafkaProducer:
    """Create a Kafka producer with JSON serializer."""
    return KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        retries=3,
    )


def send_event(topic: str, payload: dict) -> None:
    """Send a JSON payload to the given Kafka topic."""
    try:
        producer = get_kafka_producer()
        producer.send(topic, value=payload)
        producer.flush()
        logger.info(f"[Kafka] Sent to topic '{topic}': {payload}")
    except Exception as e:
        logger.error(f"[Kafka] Failed to send event to '{topic}': {e}")


def get_kafka_consumer(topic: str, group_id="ea-aura-group") -> KafkaConsumer:
    """Create a Kafka consumer subscribed to a topic."""
    return KafkaConsumer(
        topic,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id=group_id,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )


def consume_forever(topic: str, group_id="ea-aura-group") -> Generator[dict, None, None]:
    """Yield messages from a Kafka topic forever (generator)."""
    consumer = get_kafka_consumer(topic, group_id)
    logger.info(f"[Kafka] Listening to topic: {topic}")
    for msg in consumer:
        yield msg.value
