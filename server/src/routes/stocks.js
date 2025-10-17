// server/src/routes/stocks.js
import { Router } from "express";

const router = Router();

// Reusable headers so Yahoo doesn't block us
const Y_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Accept": "application/json",
};

/**
 * GET /api/stocks/search?q=AAPL
 * Step 1: yahoo search to get symbols
 * Step 2: yahoo quote to enrich currency (and be more consistent)
 */
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  try {
    // 1) Search
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const s = await fetch(searchUrl, { headers: Y_HEADERS });
    if (!s.ok) return res.status(502).json({ error: "Yahoo search failed", status: s.status });

    const sJson = await s.json();
    const raw = Array.isArray(sJson.quotes) ? sJson.quotes : [];

    const trimmed = raw
      .filter(r => r.symbol && r.shortname)   // only keep legit symbols with a short name
      .slice(0, 10);

    if (trimmed.length === 0) return res.json([]);

    // 2) Enrich with quote API — gives reliable currency
    const symbols = trimmed.map(r => r.symbol).join(",");
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const qres = await fetch(quoteUrl, { headers: Y_HEADERS });

    let currencyBySymbol = {};
    if (qres.ok) {
      const qjson = await qres.json();
      const list = qjson?.quoteResponse?.result || [];
      for (const row of list) {
        if (row?.symbol) currencyBySymbol[row.symbol] = row.currency || "";
      }
    }

    const out = trimmed.map(r => ({
      symbol: r.symbol,
      name: r.shortname,
      region: r.exchange || "",
      currency: currencyBySymbol[r.symbol] || "",
    }));

    // small cache (optional)
    res.set("Cache-Control", "public, max-age=60");
    res.json(out);
  } catch (e) {
    console.error("stocks/search error:", e);
    res.status(500).json({ error: "Search error", details: e.message });
  }
});

/**
 * GET /api/stocks/daily?symbol=AAPL
 * Last ~6 months of daily candles
 */
router.get("/daily", async (req, res) => {
  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  try {
    const chartUrl =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`;
    const r = await fetch(chartUrl, { headers: Y_HEADERS });
    if (!r.ok) return res.status(502).json({ error: "Yahoo chart failed", status: r.status });

    const data = await r.json();
    const result = data?.chart?.result?.[0];

    const timestamps = result?.timestamp || [];
    const quote = result?.indicators?.quote?.[0] || {};
    const series = timestamps.map((t, i) => ({
      t: new Date(t * 1000).toISOString().slice(0, 10),
      open: quote.open?.[i] ?? null,
      high: quote.high?.[i] ?? null,
      low: quote.low?.[i] ?? null,
      close: quote.close?.[i] ?? null,
      volume: quote.volume?.[i] ?? null,
    })).filter(p => p.close != null);

    res.set("Cache-Control", "public, max-age=120");
    res.json({ symbol, series });
  } catch (e) {
    console.error("stocks/daily error:", e);
    res.status(500).json({ error: "Daily error", details: e.message });
  }
});

export default router;
