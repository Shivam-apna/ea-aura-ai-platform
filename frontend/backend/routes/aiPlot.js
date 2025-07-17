// backend/routes/aiPlot.js
import express from 'express';

const router = express.Router();

// Mock data for AI generated plot
const mockAiPlotData = {
  "response": "The net sales of Pilkhan Tree at 1st July 2025 is ₹133000.0 and the COGS is ₹92500.0",
  "task": "plot",
  "plot_type": "bar", // or "line"
  "columns": ["Date", "Net Sales (₹)", "COGS (₹)"],
  "filters": {"Date": "1st July 2025"},
  "title": "Net Sales and COGS of Pilkhan Tree on 1st July 2025",
  "data": [
    {"Date": "14th June 2025", "Net Sales (₹)": 125000.0, "COGS (₹)": 85000.0},
    {"Date": "15th June 2025", "Net Sales (₹)": 125000.0, "COGS (₹)": 85000.0},
    {"Date": "16th June 2025", "Net Sales (₹)": 125000.0, "COGS (₹)": 85000.0},
    {"Date": "17th June 2025", "Net Sales (₹)": 126000.0, "COGS (₹)": 85500.0},
    {"Date": "18th June 2025", "Net Sales (₹)": 126500.0, "COGS (₹)": 86000.0},
    {"Date": "1st July 2025", "Net Sales (₹)": 133000.0, "COGS (₹)": 92500.0},
    {"Date": "2nd July 2025", "Net Sales (₹)": 133500.0, "COGS (₹)": 93000.0},
    {"Date": "3rd July 2025", "Net Sales (₹)": 134000.0, "COGS (₹)": 93500.0},
    {"Date": "4th July 2025", "Net Sales (₹)": 134500.0, "COGS (₹)": 94000.0}
  ]
};

router.get('/ai-plot-data', (req, res) => {
  // In a real app, you'd parse req.query to generate dynamic data
  res.json(mockAiPlotData);
});

export default router;