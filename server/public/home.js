let chart;

function makeCard(item, onClick) {
  const div = document.createElement("div");
  div.className = "card row hover";
  div.innerHTML = `
    <div class="grow">
      <div class="title">${item.symbol}</div>
      <div class="muted">${item.name}</div>
    </div>
    <div class="meta">
      <div>${item.region || ""}</div>
      <div>${item.currency || ""}</div>
    </div>`;
  div.addEventListener("click", () => onClick(item.symbol));
  return div;
}

function drawChart(symbol, series) {
  $("#chartTitle").textContent = symbol ? symbol : "Select a symbol to load chart";
  const ctx = $("#stockChart").getContext("2d");
  const labels = series.map(p => p.t);
  const data = series.map(p => p.close);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${symbol} Close`,
        data,
        borderWidth: 2,
        tension: 0.2,
      }]
    },
    options: {
      scales: { x: { ticks: { maxRotation: 0, autoSkip: true } } },
      plugins: { legend: { display: true } },
    }
  });
}

async function runSearch() {
  const q = $("#query").value.trim();
  const box = $("#results");
  box.innerHTML = "";
  if (!q) return;

  try {
    const matches = await apiGet(`/api/stocks/search?q=${encodeURIComponent(q)}`);
    if (!matches.length) {
      box.innerHTML = `<div class="muted">No matches.</div>`;
      return;
    }
    matches.forEach(m => box.appendChild(makeCard(m, loadChart)));
  } catch (e) {
    box.innerHTML = `<div class="muted">Search failed: ${e.message}</div>`;
  }
}

async function loadChart(symbol) {
  try {
    const r = await apiGet(`/api/stocks/daily?symbol=${encodeURIComponent(symbol)}`);
    drawChart(r.symbol, r.series || []);
  } catch (e) {
    drawChart("", []);
    alert("Chart error: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#btnSearch").addEventListener("click", runSearch);
  $("#query").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });
  // optional: auto-search AAPL
  // $("#query").value = "AAPL"; runSearch();
});
