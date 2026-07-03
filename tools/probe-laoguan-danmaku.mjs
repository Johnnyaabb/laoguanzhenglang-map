import zlib from "node:zlib";

const targets = [
  { key: "ep4-xingfu-canting", title: "番外16 幸福餐厅", cid: "33068417983" },
  { key: "ep5-jiaozhi-zhayu", title: "浇汁炸鱼", cid: "33269812188" },
  { key: "ep5-sanbuzhan", title: "三不沾", cid: "33269157725" },
  { key: "ep5-zhongshi-jiuguan", title: "中式酒馆主理人", cid: "33270139700" },
  { key: "ep7-wuxi-mianjin", title: "无锡特色面筋塞肉", cid: "33691731561" },
  { key: "ep7-danjiao", title: "老外超爱的蛋饺", cid: "33691929497" },
  { key: "ep8-50years", title: "是什么 让大爷吃了50年都不腻", cid: "33921108098" },
  { key: "ep8-crab", title: "番外18 痛风大爷早中晚都吃螃蟹", cid: "33921500982" },
  { key: "main-ep5", title: "第5集正片", cid: "33237960545" },
  { key: "main-ep7", title: "第7集正片", cid: "33658244978" },
  { key: "main-ep8", title: "第8集正片", cid: "33885717301" }
];

const keywords =
  /店|地址|在哪|哪里|哪儿|城市|饭店|饭铺|餐厅|酒馆|馆子|名字|搜|幸福|三不沾|安阳|开封|绍酒|浇汁|炸鱼|无锡|面筋|肉酿|蛋饺|醋溜鱼|绍兴|螃蟹|50年|五十年|朴实无华|老炒肉|苗大厨|王大黑|万宝楼|肥肠|雷氏/;

const keyFilter = new Set(
  (process.argv.find((arg) => arg.startsWith("--keys="))?.split("=")[1] || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
);

for (const target of targets.filter((entry) => !keyFilter.size || keyFilter.has(entry.key))) {
  try {
    const xml = await fetchDanmaku(target.cid);
    const messages = [...xml.matchAll(/<d [^>]*>([\s\S]*?)<\/d>/g)].map((match) =>
      decodeHtml(match[1]).replace(/\s+/g, " ").trim()
    );
    const hits = [...new Set(messages.filter((message) => keywords.test(message)))];
    console.log(`\n## ${target.key} ${target.title} cid=${target.cid} count=${messages.length} hits=${hits.length}`);
    if (!hits.length) {
      console.log("no keyword hits");
      continue;
    }
    for (const hit of hits.slice(0, 120)) {
      console.log(`- ${hit}`);
    }
  } catch (error) {
    console.log(`\n## ${target.key} ${target.title} cid=${target.cid}`);
    console.log(`ERROR: ${error.message}`);
  }
}

async function fetchDanmaku(cid) {
  const url = `https://api.bilibili.com/x/v1/dm/list.so?oid=${encodeURIComponent(cid)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      referer: "https://www.bilibili.com/"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const raw = Buffer.from(await response.arrayBuffer());
  for (const inflate of [zlib.inflateRawSync, zlib.gunzipSync, zlib.inflateSync]) {
    try {
      return inflate(raw).toString("utf8");
    } catch {
      // Try the next compression wrapper.
    }
  }
  return raw.toString("utf8");
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
