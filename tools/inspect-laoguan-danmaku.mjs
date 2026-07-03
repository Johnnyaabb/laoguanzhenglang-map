import fs from "node:fs";
import zlib from "node:zlib";

const groups = [
  "xingfu",
  "sanbuzhan",
  "zhongshi",
  "wuxi_mianjin",
  "wuxi_culiuyu",
  "wuxi_danjiao",
  "crab",
  "50years"
];

const keywords =
  /店|地址|在哪|哪里|哪儿|城市|无锡|安阳|幸福|餐厅|饭铺|饭店|酒馆|中式|三不沾|盛德利|聚宾楼|面筋|蛋饺|醋溜鱼|螃蟹|王大黑|苗大厨|老炒肉|烧饼|天津|上海|哈尔滨|都匀|库车|合肥|开封|邢台|任泽/;

for (const group of groups) {
  const path = `/tmp/dm_${group}.xml`;
  const raw = readDanmaku(path);
  const messages = [...raw.matchAll(/<d [^>]*>([\s\S]*?)<\/d>/g)].map((match) =>
    decodeHtml(match[1])
  );
  const hits = messages.filter((message) => keywords.test(message));

  console.log(`\n## ${group} count=${messages.length} bytes=${raw.length}`);
  if (!hits.length) {
    console.log("no keyword hits");
    continue;
  }

  for (const message of hits.slice(0, 80)) {
    console.log(`- ${message}`);
  }
}

function readDanmaku(path) {
  const buffer = fs.readFileSync(path);
  try {
    return zlib.inflateRawSync(buffer).toString("utf8");
  } catch {
    return buffer.toString("utf8");
  }
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
