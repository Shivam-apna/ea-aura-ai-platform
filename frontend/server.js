// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // allow all frontend origins
app.use(express.json());

// Keycloak host (no realm here)
const KEYCLOAK_BASE = "http://localhost:8080/admin";

// Proxy route: React → backend → Keycloak
app.use("/api/keycloak", async (req, res) => {
  const token = req.headers.authorization; // forward token from frontend

  try {
    // Forward request to Keycloak
    const response = await fetch(`${KEYCLOAK_BASE}${req.url}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      // Only include body for methods other than GET/HEAD
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const text = await response.text();
    // Return Keycloak response as-is
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`✅ Proxy running on http://localhost:${PORT}`));
