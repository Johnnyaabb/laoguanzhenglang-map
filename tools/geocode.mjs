import fs from "node:fs/promises";
import vm from "node:vm";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, true);
  }
}

const apiKey =
  args.get("key") ||
  process.env.AMAP_SERVICE_KEY ||
  process.env.AMAP_KEY;
const outPath = args.get("out");

if (!apiKey) {
  console.error("Missing AMap Web Service key. Use --key, AMAP_SERVICE_KEY, or AMAP_KEY.");
  process.exit(1);
}

const sourcePath = new URL("../data/restaurants.js", import.meta.url);
const source = await fs.readFile(sourcePath, "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const restaurants = context.window.LAOGUAN_RESTAURANTS;
if (!Array.isArray(restaurants)) {
  console.error("Could not read window.LAOGUAN_RESTAURANTS from data/restaurants.js.");
  process.exit(1);
}

const rows = [];
for (const restaurant of restaurants) {
  const baseAddress = restaurant.fullAddress || `${restaurant.city}${restaurant.district}${restaurant.address}`;
  // Strip the trailing restaurant name so the geocoder receives a clean postal address.
  const address = restaurant.name && baseAddress.endsWith(restaurant.name)
    ? baseAddress.slice(0, -restaurant.name.length)
    : baseAddress;
  const result = await geocode(address, apiKey);
  const topMatch = result.geocodes?.[0] || null;
  const [lng, lat] = parseLocation(topMatch?.location);
  const accepted = result.status === "1" && Number.isFinite(lat) && Number.isFinite(lng);

  rows.push({
    id: restaurant.id,
    name: restaurant.name,
    address,
    status: result.status,
    info: result.info,
    infocode: result.infocode,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    level: topMatch?.level ?? null,
    formattedAddress: topMatch?.formatted_address ?? null,
    adcode: topMatch?.adcode ?? null,
    accepted
  });

  console.log(
    `${accepted ? "OK " : "CHK"} ${restaurant.name} ${Number.isFinite(lat) ? `${lat},${lng}` : "NO_POINT"} level=${topMatch?.level ?? "N/A"}`
  );
  await delay(250);
}

const payload = JSON.stringify(
  {
    provider: "amap",
    generatedAt: new Date().toISOString(),
    count: rows.length,
    rows
  },
  null,
  2
);

if (outPath) {
  await fs.writeFile(outPath, `${payload}\n`, "utf8");
  console.log(`Wrote ${outPath}`);
} else {
  console.log(payload);
}

async function geocode(address, key) {
  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);
  url.searchParams.set("output", "JSON");

  const response = await fetch(url);
  if (!response.ok) {
    return {
      status: String(response.status),
      info: `HTTP ${response.status}`,
      infocode: null,
      geocodes: []
    };
  }
  return response.json();
}

function parseLocation(value) {
  if (!value || typeof value !== "string") return [NaN, NaN];
  const [lng, lat] = value.split(",").map(Number);
  return [lng, lat];
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
