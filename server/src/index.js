// server/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import stocksRoutes from "./routes/stocks.js";
import watchlistRoutes from "./routes/watchlist.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CORS =====
// On Vercel, your frontend and API share the same origin, so CORS isn't needed.
// For local dev (or if you still open a separate frontend), keep it permissive.
if (!process.env.VERCEL) {
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    })
  );
}

// Core middleware
app.use(express.json());
app.use(cookieParser());

// ===== Health check =====
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== Mongo connection (safe, once) =====
let mongoInitPromise = null;
async function ensureMongo() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.warn("MONGO_URL is not set. Mongo features will be disabled.");
    return;
  }
  if (mongoose.connection.readyState === 1) return; // already connected
  if (!mongoInitPromise) {
    mongoInitPromise = mongoose
      .connect(mongoUrl)
      .then(() => console.log("MongoDB connected"))
      .catch((err) => {
        console.warn("MongoDB connect failed:", err.message);
        // don't throw here to keep stateless routes alive
      });
  }
  return mongoInitPromise;
}

// Eager-connect once at cold start (works locally & on Vercel cold start)
await ensureMongo();

// ===== API routes =====
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/ai", aiRoutes);

// ===== Static frontend (server/public) =====
app.use(express.static(path.resolve(__dirname, "..", "public")));
app.get("/", (_req, res) =>
  res.sendFile(path.resolve(__dirname, "..", "public", "index.html"))
);

// ===== Local-only server =====
// Vercel sets VERCEL=1. Only call listen() when running locally.
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Local dev → http://localhost:${PORT}`)
  );
}

export default app;
