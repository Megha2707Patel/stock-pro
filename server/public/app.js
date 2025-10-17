// Shared helpers for all pages

const API_BASE = ""; // same-origin (server serves /public and /api)
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

async function apiGet(path) {
  const r = await fetch(API_BASE + path, { credentials: "include" });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) {
    let msg = `${path} -> ${r.status}`;
    try { const j = await r.json(); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

function setStatus(msg) {
  const el = $("#status");
  if (el) el.textContent = msg;
}

async function paintAuthArea() {
  const wrap = $("#authArea");
  if (!wrap) return;

  try {
    const me = await apiGet("/api/auth/me");
    wrap.innerHTML = `<span class="muted">Hi, ${me.name || "user"}</span> <a href="/auth.html">Account</a>`;
  } catch {
    wrap.innerHTML = `<a href="/auth.html">Login / Sign up</a>`;
  }
}

async function ping() {
  try {
    const h = await apiGet("/api/health");
    setStatus(h?.ok ? "API: OK" : "API: ?")
  } catch {
    setStatus("API: OFF");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  paintAuthArea();
  ping();
});
