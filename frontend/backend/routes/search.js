// routes/search.js (ES module style)
import express from 'express';
import esClient from '../elasticsearch.js'; // add .js at the end
const router = express.Router();

router.get('/search', async (req, res) => {
  // Log the extracted roles for demonstration
  console.log({ accessRole: req.accessRole, tenantRole: req.tenantRole });

  try {
    const result = await esClient.search({
      index: 'your-index-name',
      query: {
        match_all: {}
      }
    });
    res.json(result.hits.hits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Elasticsearch query failed' });
  }
});

export default router;