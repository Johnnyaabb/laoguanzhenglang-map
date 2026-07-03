import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const configPath = new URL("config.local.js", root);
const apiKey = await readAmapKey();
const city = valueArg("--city") || "";
const queries = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"))
  .map((arg) => arg.trim())
  .filter(Boolean);

if (!apiKey) {
  console.error("Missing AMAP_KEY or AMAP_SERVICE_KEY in config.local.js.");
  process.exit(1);
}

if (!queries.length) {
  console.error("Usage: node tools/probe-amap-poi.mjs --city=开封 关键词...");
  process.exit(1);
}

for (const query of queries) {
  const result = await searchPoi(query, city, apiKey);
  const pois = Array.isArray(result.pois) ? result.pois.slice(0, 10) : [];
  console.log(`\n## ${query} city=${city || "不限"} status=${result.status} count=${result.count || 0}`);
  for (const poi of pois) {
    console.log(
      [
        poi.name,
        poi.type,
        poi.address,
        poi.adname,
        poi.location,
        poi.tel || ""
      ]
        .filter(Boolean)
        .join(" | ")
    );
  }
  await delay(180);
}

async function readAmapKey() {
  const source = await fs.readFile(configPath, "utf8").catch(() => "");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return (
    context.window.LAOGUAN_CONFIG?.AMAP_SERVICE_KEY ||
    context.window.LAOGUAN_CONFIG?.AMAP_KEY ||
    ""
  );
}

async function searchPoi(keywords, cityName, key) {
  const url = new URL("https://restapi.amap.com/v3/place/text");
  url.searchParams.set("keywords", keywords);
  url.searchParams.set("key", key);
  url.searchParams.set("offset", "10");
  url.searchParams.set("page", "1");
  url.searchParams.set("extensions", "base");
  url.searchParams.set("output", "JSON");
  if (cityName) {
    url.searchParams.set("city", cityName);
    url.searchParams.set("citylimit", "true");
  }

  const response = await fetch(url);
  if (!response.ok) {
    return { status: String(response.status), count: 0, pois: [] };
  }
  return response.json();
}

function valueArg(name) {
  const arg = process.argv.find((entry) => entry.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
