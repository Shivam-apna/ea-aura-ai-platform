// backend/routes/index.js
import express from 'express';
import esClient from '../elasticsearch.js';

const router = express.Router();

// POST /api/index — Insert data into Elasticsearch
router.post('/index', async (req, res) => {
  const { index, data } = req.body;

  try {
    const response = await esClient.index({
      index,
      document: data
    });

    res.json({ success: true, result: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
