from app.core.base_dao import BaseDAO
from pydantic import BaseModel
from datetime import datetime
import uuid

class DummyDoc(BaseModel):
    id: str
    message: str
    created_at: datetime

def test_dao_crud():
    dao = BaseDAO(index="test_index", model=DummyDoc)

    # Create Index (optional)
    dao.client.indices.create(index="test_index", ignore=400)

    # Save a doc
    doc = DummyDoc(id=str(uuid.uuid4()), message="hello", created_at=datetime.utcnow())
    dao.save(doc)

    # Fetch with search
    results = dao.search(filters={"message": "hello"})
    assert len(results) >= 1
    assert results[0]["message"] == "hello"
