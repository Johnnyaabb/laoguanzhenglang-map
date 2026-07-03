(() => {
  const restaurants = window.LAOGUAN_RESTAURANTS || [];
  const coverageNote =
    "B站官方《人生一串》系列页截至2026-06-28仅列出第一季、第二季、第三季，每季6集；未核到第四季正片，因此地图不填充猜测数据。";

  const officialEpisodes = {
    "1:1": {
      title: "无肉不欢",
      airDate: "2018-06-20",
      url: "https://www.bilibili.com/bangumi/play/ep216794",
      bvid: "BV16s411j727"
    },
    "1:2": {
      title: "比夜更黑",
      airDate: "2018-06-20",
      url: "https://www.bilibili.com/bangumi/play/ep218752",
      bvid: "BV1Ss411j7Qd"
    },
    "1:3": {
      title: "来点解药",
      airDate: "2018-06-27",
      url: "https://www.bilibili.com/bangumi/play/ep231153",
      bvid: "BV13s411j7sB"
    },
    "1:4": {
      title: "牙的抗议",
      airDate: "2018-07-04",
      url: "https://www.bilibili.com/bangumi/play/ep232818",
      bvid: "BV1Ls411V7Bz"
    },
    "1:5": {
      title: "骨头骨头",
      airDate: "2018-07-11",
      url: "https://www.bilibili.com/bangumi/play/ep233324",
      bvid: "BV1Ps411H72m"
    },
    "1:6": {
      title: "朝圣之地",
      airDate: "2018-07-18",
      url: "https://www.bilibili.com/bangumi/play/ep234533",
      bvid: "BV1Ws411E7X6"
    },
    "2:1": {
      title: "您几位啊",
      airDate: "2019-07-10",
      url: "https://www.bilibili.com/bangumi/play/ep277172",
      bvid: "BV1Fx411f738"
    },
    "2:2": {
      title: "咱家特色",
      airDate: "2019-07-10",
      url: "https://www.bilibili.com/bangumi/play/ep277173",
      bvid: "BV1Fx411f7ys"
    },
    "2:3": {
      title: "吃不吃辣",
      airDate: "2019-07-17",
      url: "https://www.bilibili.com/bangumi/play/ep278577",
      bvid: "BV1ht411g7DW"
    },
    "2:4": {
      title: "来点主食",
      airDate: "2019-07-24",
      url: "https://www.bilibili.com/bangumi/play/ep279539",
      bvid: "BV1Et411E7Xz"
    },
    "2:5": {
      title: "不够再点",
      airDate: "2019-07-31",
      url: "https://www.bilibili.com/bangumi/play/ep280019",
      bvid: "BV1At411w7L8"
    },
    "2:6": {
      title: "回头再来",
      airDate: "2019-08-07",
      url: "https://www.bilibili.com/bangumi/play/ep280823",
      bvid: "BV1Ht411T7SC"
    },
    "3:1": {
      title: "地不地道",
      airDate: "2021-11-17",
      url: "https://www.bilibili.com/bangumi/play/ep429796",
      bvid: "BV1kL4y1v7xN"
    },
    "3:2": {
      title: "吃个新鲜",
      airDate: "2021-11-24",
      url: "https://www.bilibili.com/bangumi/play/ep429797",
      bvid: "BV18g411N7LT"
    },
    "3:3": {
      title: "透明包间",
      airDate: "2021-12-01",
      url: "https://www.bilibili.com/bangumi/play/ep429798",
      bvid: "BV14M4y1w7Pk"
    },
    "3:4": {
      title: "当心火候",
      airDate: "2021-12-08",
      url: "https://www.bilibili.com/bangumi/play/ep429799",
      bvid: "BV1sa411r7Su"
    },
    "3:5": {
      title: "风情调味",
      airDate: "2021-12-15",
      url: "https://www.bilibili.com/bangumi/play/ep429800",
      bvid: "BV1K3411t7HZ"
    },
    "3:6": {
      title: "摊上交情",
      airDate: "2021-12-22",
      url: "https://www.bilibili.com/bangumi/play/ep429801",
      bvid: "BV1VS4y1M77p"
    }
  };

  const seasonPages = {
    1: "https://www.bilibili.com/bangumi/play/ss24439",
    2: "https://www.bilibili.com/bangumi/play/ss27759",
    3: "https://www.bilibili.com/bangumi/play/ss39188"
  };

  restaurants.forEach((restaurant) => {
    if (restaurant.seriesId !== "rensheng-yichuan") return;

    const episode = officialEpisodes[`${restaurant.season}:${restaurant.episode}`];
    if (!episode) return;

    restaurant.episodeTitle = episode.title;
    restaurant.airDate = episode.airDate;
    restaurant.episodeUrl = episode.url;
    restaurant.episodeBvid = episode.bvid;
    restaurant.coverageNote = coverageNote;
    restaurant.sourceLinks = [
      ...(Array.isArray(restaurant.sourceLinks) ? restaurant.sourceLinks : []),
      {
        label: `B站第${restaurant.season}季节目页`,
        url: seasonPages[restaurant.season]
      },
      {
        label: `B站第${restaurant.season}季第${restaurant.episode}集`,
        url: episode.url
      }
    ];
    restaurant.sourceNote = `${restaurant.sourceNote || ""} ${coverageNote}`.trim();
  });
})();
