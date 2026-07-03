import fs from "node:fs";
import vm from "node:vm";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  toggle(value, active) {
    if (active) this.add(value);
    else this.remove(value);
  }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.dataset = {};
    this.listeners = {};
    this.options = [];
    this.value = "";
    this.textContent = "";
    this.classList = new FakeClassList();
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.options = Array.from(
      this._innerHTML.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)
    ).map((match) => ({
      value: decodeHtml(match[1]),
      textContent: decodeHtml(match[2])
    }));
  }

  get innerHTML() {
    return this._innerHTML;
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
  }

  dispatch(type, event = {}) {
    if (this.listeners[type]) this.listeners[type]({ target: this, ...event });
  }

  querySelectorAll() {
    return [];
  }

  closest() {
    return null;
  }

  setAttribute() {}
}

const ids = [
  "map",
  "mapStatus",
  "restaurantList",
  "episodeFilters",
  "seriesSelect",
  "seasonSelect",
  "cuisineSelect",
  "searchInput",
  "brandTitle",
  "brandCopy",
  "totalCount",
  "episodeCount",
  "visibleCount",
  "listSummary",
  "mapKicker",
  "mapSummary",
  "detailPanel",
  "dataNotice",
  "researchAudit"
];

const elements = new Map(ids.map((id) => [id, new FakeElement(id)]));
elements.get("searchInput").value = "";

const document = {
  body: new FakeElement("body"),
  addEventListener(type, callback) {
    if (type === "DOMContentLoaded") callback();
  },
  createElement() {
    return new FakeElement();
  },
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelector() {
    return null;
  },
  head: {
    appendChild() {}
  }
};

const context = {
  console,
  document,
  window: {}
};
vm.createContext(context);

for (const file of [
  "data/restaurants.js",
  "data/laoguan-details.js",
  "data/rensheng-yichuan.js",
  "data/rensheng-yichuan-details.js",
  "app.js"
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const initial = snapshot();
const renshengRows = context.window.LAOGUAN_RESTAURANTS.filter(
  (row) => row.seriesId === "rensheng-yichuan"
);
const renshengOfficialCheck = {
  seasons: [...new Set(renshengRows.map((row) => row.season))].sort(),
  seasonThreeEpisodeOneTitle: renshengRows.find(
    (row) => row.season === 3 && row.episode === 1
  )?.episodeTitle,
  sourceLinks: renshengRows.find((row) => row.id === "ryc-s3e1-liuji-shaokao")?.sourceLinks || []
};
const laoguanSample = context.window.LAOGUAN_RESTAURANTS.find(
  (row) => row.id === "ep1-yuquan-fanzhuang"
);
const laoguanCompleteness = context.window.LAOGUAN_RESTAURANTS
  .filter((row) => !row.seriesId || row.seriesId === "laoguan-zhenglang")
  .reduce(
    (summary, row) => {
      summary.count += 1;
      if (!Array.isArray(row.mainDishes) || row.mainDishes.length === 0) {
        summary.missingDishes.push(row.id);
      }
      if (!Array.isArray(row.people) || row.people.length === 0) {
        summary.missingPeople.push(row.id);
      }
      if (!row.story) {
        summary.missingStory.push(row.id);
      }
      if (!Array.isArray(row.recipeNotes) || row.recipeNotes.length === 0) {
        summary.missingRecipeNotes.push(row.id);
      }
      return summary;
    },
    {
      count: 0,
      missingDishes: [],
      missingPeople: [],
      missingStory: [],
      missingRecipeNotes: []
    }
  );
const laoguanNames = context.window.LAOGUAN_RESTAURANTS
  .filter((row) => !row.seriesId || row.seriesId === "laoguan-zhenglang")
  .map((row) => row.name);
const indexHtml = fs.readFileSync("index.html", "utf8");
const stylesheet = fs.readFileSync("styles.css", "utf8");
const appSource = fs.readFileSync("app.js", "utf8");
elements.get("seriesSelect").value = "rensheng-yichuan";
elements.get("seriesSelect").dispatch("change");
const rensheng = snapshot();
elements.get("seasonSelect").value = "rensheng-yichuan:s3";
elements.get("seasonSelect").dispatch("change");
const renshengSeasonThree = snapshot();

assertEqual(initial.total, "24", "total count");
assertEqual(initial.episodes, "8", "episode count");
assertEqual(initial.visible, "24", "initial visible count");
assertIncludes(indexHtml, "<title>美食地理</title>", "site title");
assertIncludes(indexHtml, ">美食地理</p>", "site eyebrow");
assertEqual(laoguanCompleteness.count, "24", "laoguan count");
assertIncludes(indexHtml, "data/laoguan-details.js", "laoguan details script loaded");
assertIncludes(laoguanSample.mainDishes.join(" / "), "赛螃蟹", "laoguan details loaded");
assertEqual(laoguanSample.sourceLinks.length, "2", "laoguan source links");
assertIncludes(laoguanNames.join(" / "), "无名馆子", "laoguan base unnamed points restored");
assertIncludes(laoguanNames.join(" / "), "孟记石头老炒肉饭店", "laoguan base mengji restored");
assertEqual(laoguanNames.includes("王大黑饭铺"), "false", "laoguan wangdahei removed from restored page");
assertEqual(laoguanNames.includes("苗大厨饭店（石头老炒肉）"), "false", "laoguan miaodachu removed from restored page");
assertEqual(laoguanNames.includes("老徐干锅蚂拐"), "false", "laoguan laoxu removed from restored page");
assertEqual(initial.dataNoticeHidden, "true", "laoguan notice hidden");
assertNoIncludes(indexHtml, "laoguan-research-audit", "index audit data script removed");
assertNoIncludes(indexHtml, "researchAudit", "index audit panel removed");
assertIncludes(indexHtml, "config.local.js", "amap config script loaded");
assertNoIncludes(indexHtml, "globe-map.js", "3d globe script removed");
assertIncludes(indexHtml, "data/rensheng-yichuan.js", "rensheng data script loaded");
assertIncludes(indexHtml, "data/rensheng-yichuan-details.js", "rensheng official details loaded");
assertIncludes(indexHtml, "food-geography-20260703", "food geography cache key");
assertNoIncludes(indexHtml, "leaflet@1.9.4", "leaflet cdn absent after amap restore");
assertIncludes(stylesheet, "--primary: #c2410c", "shadcn primary token present");
assertNoIncludes(stylesheet, "#0a8ff0", "blue screenshot accent removed");
assertIncludes(appSource, "amap-marker-card-title", "marker card title slot");
assertIncludes(appSource, "amap-marker-card-description", "marker card description slot");
assertIncludes(appSource, "amap-marker-badge-outline", "marker outline badge");
assertIncludes(appSource, "updateMarkerSelection(previousId, restaurant.id)", "selection updates marker content only");
assertIncludes(appSource, 'viewMode: "2D"', "amap 2d mode enabled");
assertIncludes(appSource, "flyFlatTo(position, token)", "flat map roam");
assertIncludes(appSource, "cameraStage(", "camera stage choreography");
assertIncludes(appSource, "supportsFlatCamera()", "flat camera guard");
assertNoIncludes(appSource, "setPitch", "pitch removed for flat map");
assertNoIncludes(appSource, "setRotation", "rotation removed for flat map");
assertIncludes(stylesheet, ".amap-marker-card", "marker card styles");
assertIncludes(stylesheet, ".is-map-roaming .amap-marker-card", "roaming marker labels collapse");
assertNoIncludes(stylesheet, ".amap-marker-label", "old marker label styles removed");
assertNoIncludes(stylesheet, ".globe-marker-card", "globe marker styles removed");
assertIncludes(initial.seriesOptions.join(" / "), "老馆正浪", "series option laoguan");
assertIncludes(initial.seriesOptions.join(" / "), "人生一串", "series option rensheng");
assertEqual(rensheng.visible, "91", "rensheng visible count");
assertEqual(renshengOfficialCheck.seasonThreeEpisodeOneTitle, "地不地道", "rensheng s3e1 title");
assertEqual(renshengOfficialCheck.seasons.includes(4), "false", "rensheng season 4 absent");
assertEqual(renshengOfficialCheck.sourceLinks.length, "2", "rensheng source links");
assertIncludes(renshengOfficialCheck.sourceLinks.map((link) => link.url).join(" / "), "bilibili.com", "rensheng bilibili links");
assertIncludes(rensheng.listHtml, "小二自助烧烤", "rensheng list item");
assertIncludes(rensheng.listHtml, "人生一串", "rensheng series label");
assertIncludes(rensheng.dataNotice, "第1-3季", "rensheng data notice");
assertEqual(rensheng.dataNoticeHidden, "false", "rensheng notice visible");
assertEqual(rensheng.brandTitle, "人生一串", "rensheng brand title");
assertIncludes(rensheng.brandCopy, "91 家馆子，18 集路线", "rensheng brand copy");
assertEqual(renshengSeasonThree.brandTitle, "人生一串 第3季", "rensheng season brand title");
assertIncludes(renshengSeasonThree.brandCopy, "26 家馆子，6 集路线", "rensheng season brand copy");
assertEqual(renshengSeasonThree.mapKicker, "人生一串地图", "rensheng map kicker");
assertEqual(renshengSeasonThree.visible, "26", "rensheng season 3 visible");

console.log(JSON.stringify({ initial, laoguanCompleteness, renshengOfficialCheck, rensheng, renshengSeasonThree }, null, 2));

function snapshot() {
  return {
    brandTitle: elements.get("brandTitle").textContent,
    brandCopy: elements.get("brandCopy").textContent,
    total: elements.get("totalCount").textContent,
    episodes: elements.get("episodeCount").textContent,
    visible: elements.get("visibleCount").textContent,
    listSummary: elements.get("listSummary").textContent,
    mapKicker: elements.get("mapKicker").textContent,
    mapSummary: elements.get("mapSummary").textContent,
    dataNotice: elements.get("dataNotice").textContent,
    dataNoticeHidden: String(Boolean(elements.get("dataNotice").hidden)),
    seriesOptions: elements.get("seriesSelect").options.map((option) => option.textContent),
    seasonOptions: elements.get("seasonSelect").options.map((option) => option.textContent),
    listHtml: elements.get("restaurantList").innerHTML.slice(0, 2000)
  };
}

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertIncludes(value, expected, label) {
  if (!String(value).includes(expected)) {
    throw new Error(`${label}: missing ${expected}`);
  }
}

function assertNoIncludes(value, expected, label) {
  if (String(value).includes(expected)) {
    throw new Error(`${label}: unexpected ${expected}`);
  }
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
