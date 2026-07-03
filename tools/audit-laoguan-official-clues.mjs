import fs from "node:fs";
import vm from "node:vm";

const season = JSON.parse(fs.readFileSync("/tmp/laoguan-season.json", "utf8")).result;
const context = { window: {} };
vm.createContext(context);

for (const file of ["data/restaurants.js", "data/laoguan-details.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const restaurants = context.window.LAOGUAN_RESTAURANTS.filter(
  (row) => !row.seriesId || row.seriesId === "laoguan-zhenglang"
);
const mainEpisodes = season.episodes.map((episode, index) => ({
  n: index + 1,
  id: episode.id,
  title: episode.long_title,
  pub_time: episode.pub_time,
  next_pub_time: season.episodes[index + 1]?.pub_time || Number.POSITIVE_INFINITY
}));

const sourceSections = ["美食纯享", "老馆故事", "番外"];
const importantShortTokens = new Set([
  "干锅",
  "艾糕",
  "鳝丝",
  "鱼饭",
  "生腌",
  "鸡嗉",
  "沙嗲",
  "蛋饺",
  "肥肠",
  "腰花",
  "脆肝"
]);
const genericTokens = new Set([
  "特色",
  "香嫩",
  "这一口",
  "下饭",
  "做法",
  "正宗",
  "老板",
  "餐厅",
  "小馆",
  "家常",
  "地方",
  "朴素",
  "老馆"
]);
const manualClueText = new Map([
  [2233440, "溜肝尖 老万饭馆 下水菜 哈尔滨"],
  [2254228, "牛肉干锅 何记老牌牛肉火锅 都匀 贵州"],
  [2309476, "茶馆面 龙宝茶馆 一茶三点一面 兴化早茶"],
  [2309475, "茶馆面 龙宝茶馆 茶水 早茶 先开水再开饭"],
  [2363682, "老炒肉 石头老炒肉 苗大厨饭店 任泽"]
]);
const materials = [];
for (const section of season.section || []) {
  if (!sourceSections.includes(section.title)) continue;
  for (const item of section.episodes || []) {
    const episode = mainEpisodes.find(
      (entry) => item.pub_time >= entry.pub_time && item.pub_time < entry.next_pub_time
    );
    materials.push({
      section: section.title,
      id: item.id,
      title: compact(`${item.title} ${item.long_title}`),
      matchText: compact(`${item.title} ${item.long_title} ${manualClueText.get(item.id) || ""}`),
      url: item.link,
      pub_time: item.pub_time,
      episode: episode?.n || null
    });
  }
}

const report = mainEpisodes.map((episode) => {
  const rows = restaurants.filter((restaurant) => restaurant.episode === episode.n);
  const items = materials.filter((item) => item.episode === episode.n);
  const dishTitles = items
    .filter((item) => item.section === "美食纯享")
    .map((item) => item.title);
  const storyTitles = items
    .filter((item) => item.section !== "美食纯享")
    .map((item) => `${item.section}:${item.title}`);
  const dishMatches = items
    .filter((item) => item.section === "美食纯享")
    .map((item) => classifyMaterial(item, rows));

  return {
    episode: episode.n,
    title: episode.title,
    restaurants: rows.map((row) => row.name),
    restaurantCount: rows.length,
    clueCount: items.length,
    dishTitles,
    storyTitles,
    matchedDishTitles: dishMatches
      .filter((item) => item.status === "matched_in_episode")
      .map((item) => `${item.title} -> ${item.match.name}`),
    crossEpisodeMatches: dishMatches
      .filter((item) => item.status === "matched_other_episode")
      .map((item) => `${item.title} -> 第${item.match.episode}集 ${item.match.name}`),
    possibleGaps: dishMatches
      .filter((item) => item.status === "unmatched")
      .map((item) => item.title)
  };
});

console.log(JSON.stringify(report, null, 2));

function classifyMaterial(item, episodeRows) {
  const sameEpisodeMatch = bestMatch(item.matchText || item.title, episodeRows);
  if (sameEpisodeMatch) {
    return {
      ...item,
      status: "matched_in_episode",
      match: summarizeRestaurant(sameEpisodeMatch)
    };
  }

  const otherEpisodeMatch = bestMatch(
    item.matchText || item.title,
    restaurants.filter((restaurant) => !episodeRows.includes(restaurant))
  );
  if (otherEpisodeMatch) {
    return {
      ...item,
      status: "matched_other_episode",
      match: summarizeRestaurant(otherEpisodeMatch)
    };
  }

  return {
    ...item,
    status: "unmatched",
    match: null
  };
}

function bestMatch(title, rows) {
  const matches = rows
    .map((row) => ({
      row,
      score: scoreRestaurant(title, row)
    }))
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => b.score - a.score);

  return matches[0]?.row || null;
}

function scoreRestaurant(title, row) {
  const normalizedTitle = normalize(title);
  let score = 0;

  for (const dish of row.mainDishes || []) {
    const value = normalize(dish);
    if (!value || value.length < 2) continue;
    if (normalizedTitle.includes(value) || value.includes(normalizedTitle)) {
      score += 20;
      continue;
    }
    const dishTokens = tokenParts(value).filter(isUsefulToken);
    const dishToken = dishTokens.find((part) => normalizedTitle.includes(part));
    if (dishToken) {
      score += importantShortTokens.has(dishToken) ? 12 : 8;
    }
  }

  for (const field of [row.name, row.cuisine, row.story, ...(row.recipeNotes || [])].filter(Boolean)) {
    const value = normalize(field);
    if (!value || value.length < 2) continue;
    if (normalizedTitle.includes(value) || value.includes(normalizedTitle)) {
      score += 12;
      continue;
    }
    const fieldTokens = tokenParts(value).filter((part) => part.length >= 3);
    if (fieldTokens.some((part) => normalizedTitle.includes(part))) {
      score += 4;
    }
  }

  return score;
}

function summarizeRestaurant(row) {
  return {
    id: row.id,
    name: row.name,
    episode: row.episode,
    mainDishes: row.mainDishes || []
  };
}

function normalize(value) {
  return String(value).replace(/[（）()·\s、，。！!？?：:；;~～"“”]/g, "");
}

function tokenParts(value) {
  const parts = [];
  for (let length = Math.min(5, value.length); length >= 2; length -= 1) {
    for (let index = 0; index <= value.length - length; index += 1) {
      parts.push(value.slice(index, index + length));
    }
  }
  return [...new Set(parts)];
}

function isUsefulToken(part) {
  if (genericTokens.has(part)) return false;
  return part.length >= 3 || importantShortTokens.has(part);
}

function compact(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
