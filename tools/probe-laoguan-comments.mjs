const targets = [
  { key: "ep3-haerbin-tiaoshi", title: "在哈尔滨 理解了辛芷蕾的挑食", aid: "115333646063717" },
  { key: "ep4-guizhou-bistro", title: "可能是网红贵州bistro的老祖宗", aid: "115372082597091" },
  { key: "ep4-xingfu-canting", title: "番外16 幸福餐厅", aid: "115372233591341" },
  { key: "ep5-jiaozhi-zhayu", title: "浇汁炸鱼", aid: "115411559384103" },
  { key: "ep5-sanbuzhan", title: "三不沾", aid: "115411525828853" },
  { key: "ep5-zhongshi-jiuguan", title: "中式酒馆主理人", aid: "115411609715229" },
  { key: "ep6-simple-single", title: "最简单也最难的单品", aid: "115450734182992" },
  { key: "ep6-water-rice", title: "先开水再开饭", aid: "115450717406395" },
  { key: "ep6-xingtai-bing", title: "在邢台 一张饼能卷下一头牛", aid: "115450717473334" },
  { key: "ep7-wuxi-mianjin", title: "无锡特色面筋塞肉", aid: "115491217671505" },
  { key: "ep7-danjiao", title: "老外超爱的蛋饺", aid: "115491234383537" },
  { key: "ep8-plain-dish", title: "这道朴实无华的菜", aid: "115531181065944" },
  { key: "ep8-50years", title: "是什么 让大爷吃了50年都不腻", aid: "115531197712892" },
  { key: "ep8-crab", title: "番外18 痛风大爷早中晚都吃螃蟹", aid: "115531281664270" },
  { key: "main-ep4", title: "第4集正片", aid: "115371193533464" },
  { key: "main-ep5", title: "第5集正片", aid: "115405620316898" },
  { key: "main-ep7", title: "第7集正片", aid: "115485295313204" },
  { key: "main-ep8", title: "第8集正片", aid: "115524788816597" }
];

const keywords =
  /店|地址|在哪|哪里|哪儿|城市|饭店|饭铺|餐厅|酒馆|馆子|幸福|三不沾|安阳|开封|绍酒|浇汁|炸鱼|无锡|面筋|蛋饺|螃蟹|50年|五十年|朴实无华|哈尔滨|辛芷蕾|贵州|bistro|都匀|邢台|饼|最简单|开水|开饭|名字|搜/;

const pages = Number.parseInt(process.argv.find((arg) => arg.startsWith("--pages="))?.split("=")[1] || "3", 10);
const delayMs = Number.parseInt(process.argv.find((arg) => arg.startsWith("--delay="))?.split("=")[1] || "350", 10);
const keyFilter = new Set(
  (process.argv.find((arg) => arg.startsWith("--keys="))?.split("=")[1] || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
);

for (const target of targets.filter((entry) => !keyFilter.size || keyFilter.has(entry.key))) {
  const hits = [];
  const seen = new Set();
  for (let page = 1; page <= pages; page += 1) {
    const url = new URL("https://api.bilibili.com/x/v2/reply");
    url.searchParams.set("type", "1");
    url.searchParams.set("oid", target.aid);
    url.searchParams.set("sort", "2");
    url.searchParams.set("pn", String(page));
    url.searchParams.set("ps", "20");
    try {
      const payload = await getJson(url);
      const replies = payload?.data?.replies || [];
      for (const reply of replies) {
        collectHit(hits, seen, reply);
        for (const child of reply.replies || []) {
          collectHit(hits, seen, child, reply.member?.uname);
        }
      }
      if (!replies.length) break;
      await delay(delayMs);
    } catch (error) {
      hits.push({ message: `ERROR: ${error.message}` });
      break;
    }
  }

  console.log(`\n## ${target.key} ${target.title} aid=${target.aid} hits=${hits.length}`);
  for (const hit of hits.slice(0, 80)) {
    console.log(`- ${hit.message}`);
  }
}

async function getJson(url) {
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
  return response.json();
}

function collectHit(hits, seen, reply, parentName = "") {
  const message = String(reply?.content?.message || "").replace(/\s+/g, " ").trim();
  if (!message || !keywords.test(message)) return;
  const prefix = parentName ? `@${parentName} ` : "";
  const rendered = `${prefix}${message}`;
  if (seen.has(rendered)) return;
  seen.add(rendered);
  hits.push({ message: rendered });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
