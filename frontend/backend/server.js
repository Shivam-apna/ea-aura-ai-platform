// backend/server.js
import express from 'express';
import cors from 'cors';
import indexRoutes from './routes/index.js';
import businessVitalityRoutes from './routes/businessVitality.js';
import aiPlotRoutes from './routes/aiPlot.js';
import authMiddleware from './middleware/authMiddleware.js'; // Import the new middleware

const app = express();

app.use(cors());
app.use(express.json());

// Apply the authentication middleware to all /api routes
app.use('/api', authMiddleware);

// Mount the routes at /api
app.use('/api', indexRoutes);
app.use('/api', businessVitalityRoutes);
app.use('/api', aiPlotRoutes);

// Start the server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});