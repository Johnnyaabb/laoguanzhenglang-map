import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const defaultTargets = [
  { key: "ep4-xingfu-canting", aid: "115372233591341" },
  { key: "ep5-jiaozhi-zhayu", aid: "115411559384103" },
  { key: "ep5-sanbuzhan", aid: "115411525828853" },
  { key: "ep5-zhongshi-jiuguan", aid: "115411609715229" },
  { key: "ep7-wuxi-mianjin", aid: "115491217671505" },
  { key: "ep7-danjiao", aid: "115491234383537" },
  { key: "ep8-50years", aid: "115531197712892" },
  { key: "ep8-crab", aid: "115531281664270" }
];

const keyFilter = new Set(
  (process.argv.find((arg) => arg.startsWith("--keys="))?.split("=")[1] || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
);
const targets = defaultTargets.filter((target) => !keyFilter.size || keyFilter.has(target.key));

for (const target of targets) {
  try {
    const view = await getJson(`https://api.bilibili.com/x/web-interface/view?aid=${target.aid}`);
    const video = view.data || {};
    const player = video.cid
      ? await getJson(`https://api.bilibili.com/x/player/v2?aid=${target.aid}&cid=${video.cid}`)
      : null;
    const subtitles = player?.data?.subtitle?.subtitles || [];

    console.log(
      JSON.stringify(
        {
          key: target.key,
          aid: target.aid,
          title: video.title || "",
          desc: video.desc || "",
          cid: video.cid || null,
          pic: video.pic || "",
          owner: video.owner?.name || "",
          duration: video.duration || null,
          pages: (video.pages || []).map((page) => ({
            cid: page.cid,
            page: page.page,
            part: page.part,
            duration: page.duration
          })),
          subtitles: subtitles.map((subtitle) => ({
            lan: subtitle.lan,
            lanDoc: subtitle.lan_doc,
            subtitleUrl: subtitle.subtitle_url
          })),
          hasPublicSubtitle: subtitles.length > 0
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        key: target.key,
        aid: target.aid,
        error: error.message,
        cause: error.cause?.code || error.cause?.message || ""
      })
    );
  }
}

async function getJson(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
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
    } catch (error) {
      lastError = error;
      await delay(350 * attempt);
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
