// backend/routes/businessVitality.js
import express from 'express';

const router = express.Router();

// Mock data for Business Vitality charts
const mockBusinessVitalityData = {
  grossProfitMargin: [
    { name: 'Darbar Craft', margin: 50 },
    { name: 'Shield Industries', margin: 45 },
    { name: 'Horticulture Mall', margin: 42 },
  ],
  netProfitMargin: [
    { name: 'Horticulture Mall', margin: 18 },
    { name: 'Shield Industries', margin: 15 },
    { name: 'Darbar Craft', margin: 12 },
  ],
  quickRatio: [
    { name: 'Shield Industries', ratio: 2.0 },
    { name: 'Horticulture Mall', ratio: 1.3 },
    { name: 'Darbar Craft', ratio: 1.1 },
  ],
  gmroi: [
    { name: 'Shield Industries', gmroi: 2.5 },
    { name: 'Horticulture Mall', gmroi: 2.0 },
    { name: 'Darbar Craft', gmroi: 1.5 },
  ],
};

router.get('/business-vitality', (req, res) => {
  res.json(mockBusinessVitalityData);
});

export default router;