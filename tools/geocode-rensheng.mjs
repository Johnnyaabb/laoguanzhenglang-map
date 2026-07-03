import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const sourcePath = new URL("data/rensheng-yichuan.js", root);
const oldDataPath = new URL("data/restaurants.js", root);

const args = new Set(process.argv.slice(2));
const write = args.has("--write");

const rows = await readRenshengRows();
let updated = 0;
let failed = 0;

for (const row of rows) {
  if (Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng))) continue;

  const query = row.fullAddress || [row.city, row.district, row.address, row.name].filter(Boolean).join("");
  const result = await geocode(query);
  const topMatch = result.results?.[0] || null;
  const lat = Number(topMatch?.lat);
  const lng = Number(topMatch?.lon);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    row.lat = lat;
    row.lng = lng;
    row.geocodeStatus = "address_geocoded";
    row.geocodeReliability = geocodeReliability(topMatch);
    row.needsReview = true;
    row.sourceNote = `${row.sourceNote || ""} 2026-06-28 Nominatim 地理编码：${topMatch?.display_name || query}。`.trim();
    updated += 1;
  } else {
    row.geocodeStatus = "geocode_failed";
    row.geocodeReliability = "low";
    row.needsReview = true;
    failed += 1;
  }

  console.log(`${row.lat ? "OK " : "CHK"} ${row.id} ${row.name}`);
  await delay(1100);
}

if (write) {
  await fs.writeFile(sourcePath, renderDataFile(rows), "utf8");
  console.log(`Wrote ${sourcePath.pathname}`);
}

console.log(JSON.stringify({ count: rows.length, updated, failed, write }, null, 2));

async function readRenshengRows() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await fs.readFile(oldDataPath, "utf8"), context);
  vm.runInContext(await fs.readFile(sourcePath, "utf8"), context);
  const rows = context.window.LAOGUAN_RESTAURANTS;
  if (!Array.isArray(rows)) throw new Error("Could not read restaurant rows.");
  return rows.filter((row) => row.seriesId === "rensheng-yichuan");
}

async function geocode(address) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "zh-CN,en");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "laoguanzhenglang-static-map/1.0",
      Referer: "https://github.com/"
    }
  });
  if (!response.ok) {
    return {
      status: String(response.status),
      info: `HTTP ${response.status}`,
      results: []
    };
  }
  return {
    status: "1",
    info: "OK",
    results: await response.json()
  };
}

function geocodeReliability(result) {
  if (["amenity", "shop", "tourism"].includes(result?.class)) return "medium";
  if (["restaurant", "fast_food", "bar", "cafe"].includes(result?.type)) return "medium";
  if (["city", "town", "village", "suburb"].includes(result?.type)) return "low";
  return "low";
}

function renderDataFile(rows) {
  return `window.LAOGUAN_RESTAURANTS = window.LAOGUAN_RESTAURANTS || [];\nwindow.LAOGUAN_RESTAURANTS.push(\n  ...${JSON.stringify(
    rows,
    null,
    2
  )}\n);\n`;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
