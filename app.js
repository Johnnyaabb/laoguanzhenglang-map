(() => {
  const rawRestaurants = Array.isArray(window.LAOGUAN_RESTAURANTS)
    ? window.LAOGUAN_RESTAURANTS
    : [];
  const restaurants = rawRestaurants.map(normalizeRestaurant);

  const markerPalette = [
    "#d94a38",
    "#2878b5",
    "#1f8a70",
    "#b36b00",
    "#6f59c5",
    "#c23b72",
    "#238a99",
    "#545b62"
  ];

  const state = {
    series: "laoguan-zhenglang",
    season: "all",
    episode: "all",
    cuisine: "all",
    query: "",
    selectedId: null,
    visible: restaurants
  };

  const els = {};
  let map = null;
  let markers = [];
  let markerById = new Map();
  let infoWindow = null;
  let mapReady = false;
  let pendingInfoTimer = null;
  let selectionMoveToken = 0;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    normalizeConfig();
    bindElements();
    renderStaticControls();
    bindEvents();
    applyFilters();
    setupMap();
  }

  function normalizeConfig() {
    window.LAOGUAN_CONFIG = window.LAOGUAN_CONFIG || {};
    window.LAOGUAN_CONFIG.AMAP_KEY = window.LAOGUAN_CONFIG.AMAP_KEY || "";
    window.LAOGUAN_CONFIG.AMAP_SECURITY_JS_CODE =
      window.LAOGUAN_CONFIG.AMAP_SECURITY_JS_CODE || "";
    window.LAOGUAN_CONFIG.AMAP_SERVICE_KEY =
      window.LAOGUAN_CONFIG.AMAP_SERVICE_KEY || window.LAOGUAN_CONFIG.AMAP_KEY || "";
  }

  function bindElements() {
    els.map = document.getElementById("map");
    els.mapStatus = document.getElementById("mapStatus");
    els.restaurantList = document.getElementById("restaurantList");
    els.episodeFilters = document.getElementById("episodeFilters");
    els.seriesSelect = document.getElementById("seriesSelect");
    els.seasonSelect = document.getElementById("seasonSelect");
    els.cuisineSelect = document.getElementById("cuisineSelect");
    els.searchInput = document.getElementById("searchInput");
    els.brandTitle = document.getElementById("brandTitle");
    els.brandCopy = document.getElementById("brandCopy");
    els.totalCount = document.getElementById("totalCount");
    els.episodeCount = document.getElementById("episodeCount");
    els.visibleCount = document.getElementById("visibleCount");
    els.listSummary = document.getElementById("listSummary");
    els.mapKicker = document.getElementById("mapKicker");
    els.mapSummary = document.getElementById("mapSummary");
    els.dataNotice = document.getElementById("dataNotice");
  }

  function renderStaticControls() {
    renderSeriesOptions();
    renderSeasonOptions();
    renderEpisodeOptions();
    renderCuisineOptions();
    renderScopeIntro();
    renderDataNotice();
  }

  function renderSeriesOptions() {
    const series = uniqueBy(restaurants, (item) => item.seriesId).sort((a, b) =>
      a.seriesName.localeCompare(b.seriesName, "zh-Hans-CN")
    );

    els.seriesSelect.innerHTML = [
      '<option value="all">全部纪录片</option>',
      ...series.map(
        (item) =>
          `<option value="${escapeAttr(item.seriesId)}">${escapeHtml(item.seriesName)}</option>`
      )
    ].join("");
    els.seriesSelect.value = state.series;
  }

  function renderSeasonOptions() {
    const seasons = uniqueBy(
      restaurants.filter(matchesSeries),
      (item) => item.seasonKey
    ).sort(compareSeason);

    if (state.season !== "all" && !seasons.some((item) => item.seasonKey === state.season)) {
      state.season = "all";
    }

    els.seasonSelect.innerHTML = [
      '<option value="all">全部季度</option>',
      ...seasons.map((item) => {
        const label = state.series === "all"
          ? `${item.seriesName} 第${item.season}季`
          : `第${item.season}季`;
        return `<option value="${escapeAttr(item.seasonKey)}">${escapeHtml(label)}</option>`;
      })
    ].join("");
    els.seasonSelect.value = state.season;
  }

  function renderEpisodeOptions() {
    const episodes = uniqueBy(
      restaurants.filter((item) => matchesSeries(item) && matchesSeason(item)),
      (item) => item.episodeKey
    ).sort(compareEpisode);

    if (state.episode !== "all" && !episodes.some((item) => item.episodeKey === state.episode)) {
      state.episode = "all";
    }

    els.episodeFilters.innerHTML = [
      buttonTemplate("all", "全部", state.episode === "all"),
      ...episodes.map((episode) =>
        buttonTemplate(episode.episodeKey, episodeFilterLabel(episode), state.episode === episode.episodeKey)
      )
    ].join("");
  }

  function renderCuisineOptions() {
    const cuisines = unique(
      restaurants
        .filter((item) => matchesSeries(item) && matchesSeason(item))
        .map((item) => item.cuisine)
    ).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

    if (state.cuisine !== "all" && !cuisines.includes(state.cuisine)) {
      state.cuisine = "all";
    }

    els.cuisineSelect.innerHTML = [
      '<option value="all">全部菜系</option>',
      ...cuisines.map((cuisine) => `<option value="${escapeAttr(cuisine)}">${escapeHtml(cuisine)}</option>`)
    ].join("");
    els.cuisineSelect.value = state.cuisine;
  }

  function bindEvents() {
    els.seriesSelect.addEventListener("change", () => {
      state.series = els.seriesSelect.value;
      state.season = "all";
      state.episode = "all";
      renderSeasonOptions();
      renderEpisodeOptions();
      renderCuisineOptions();
      applyFilters();
    });

    els.seasonSelect.addEventListener("change", () => {
      state.season = els.seasonSelect.value;
      state.episode = "all";
      renderEpisodeOptions();
      renderCuisineOptions();
      applyFilters();
    });

    els.episodeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-episode]");
      if (!button) return;
      state.episode = button.dataset.episode;
      renderEpisodeActiveState();
      applyFilters();
    });

    els.cuisineSelect.addEventListener("change", () => {
      state.cuisine = els.cuisineSelect.value;
      applyFilters();
    });

    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      applyFilters();
    });

    els.restaurantList.addEventListener("click", (event) => {
      const item = event.target.closest("button[data-id]");
      if (!item) return;
      const restaurant = restaurants.find((entry) => entry.id === item.dataset.id);
      if (restaurant) selectRestaurant(restaurant, true);
    });
  }

  function buttonTemplate(value, label, active) {
    return `<button class="episode-tab${active ? " is-active" : ""}" type="button" data-episode="${escapeAttr(
      value
    )}" role="tab" aria-selected="${active ? "true" : "false"}">${escapeHtml(label)}</button>`;
  }

  function renderEpisodeActiveState() {
    els.episodeFilters.querySelectorAll("button[data-episode]").forEach((button) => {
      const active = button.dataset.episode === state.episode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function applyFilters() {
    state.query = els.searchInput.value.trim().toLowerCase();
    state.cuisine = els.cuisineSelect.value;

    const query = state.query;
    state.visible = restaurants.filter((restaurant) => {
      const queryText = [
        restaurant.name,
        restaurant.city,
        restaurant.district,
        restaurant.address,
        restaurant.cuisine,
        restaurant.seriesName,
        restaurant.episodeTitle,
        restaurant.mainDishesText,
        restaurant.owner,
        displayEpisode(restaurant, true)
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesSeries(restaurant) &&
        matchesSeason(restaurant) &&
        matchesEpisode(restaurant) &&
        (state.cuisine === "all" || restaurant.cuisine === state.cuisine) &&
        (!query || queryText.includes(query))
      );
    });

    if (!state.visible.some((restaurant) => restaurant.id === state.selectedId)) {
      state.selectedId = null;
    }

    renderList();
    renderMarkers();
    fitVisibleMarkers();
    renderScopeIntro();
    renderDataNotice();
  }

  function renderList() {
    const scoped = scopedRestaurants();
    els.visibleCount.textContent = state.visible.length;
    els.listSummary.textContent =
      state.visible.length === scoped.length
        ? `全部 ${scoped.length} 家`
        : `筛选出 ${state.visible.length} 家`;

    if (state.visible.length === 0) {
      els.restaurantList.innerHTML = '<p class="empty-state">没有匹配的馆子。</p>';
      return;
    }

    els.restaurantList.innerHTML = state.visible
      .map((restaurant) => {
        const active = restaurant.id === state.selectedId;
        const warning = restaurant.needsReview
          ? '<span class="tag tag-warning ui-badge ui-badge-warning">位置需复核</span>'
          : "";
        const dishes = restaurant.mainDishesText
          ? `<span class="ui-badge ui-badge-outline">${escapeHtml(restaurant.mainDishesText)}</span>`
          : "";
        return `
          <button class="restaurant-card ui-card${active ? " is-active" : ""}" type="button" data-id="${escapeAttr(
            restaurant.id
          )}">
            <span class="episode-dot" style="background:${colorForRestaurant(restaurant)}">${escapeHtml(
              shortEpisodeLabel(restaurant)
            )}</span>
            <span class="restaurant-main">
              <strong>${escapeHtml(restaurant.name)}</strong>
              <span class="address">${escapeHtml(
                [restaurant.seriesName, displayEpisode(restaurant, true), restaurant.city, restaurant.district]
                  .filter(Boolean)
                  .join(" · ")
              )}</span>
            </span>
            <span class="address address-full">${escapeHtml(restaurant.address)}</span>
            <span class="meta-line"><span class="ui-badge ui-badge-secondary">${escapeHtml(restaurant.cuisine)}</span>${dishes}${warning}</span>
          </button>
        `;
      })
      .join("");
  }

  function setupMap() {
    const key = (window.LAOGUAN_CONFIG?.AMAP_KEY || "").trim();
    const securityJsCode = (window.LAOGUAN_CONFIG?.AMAP_SECURITY_JS_CODE || "").trim();
    if (!key || key === "YOUR_AMAP_KEY") {
      document.body.classList.add("map-unavailable");
      showMapStatus(
        "需要配置高德地图 Key",
        "请在 config.local.js 填写 AMAP_KEY。2021-12-02 后创建的 Key 还需要填写 AMAP_SECURITY_JS_CODE。"
      );
      return;
    }

    document.body.classList.remove("map-unavailable");
    showMapStatus("正在加载高德地图", "地图脚本加载完成后会显示全部馆子标记。");
    loadAmapMap(key, securityJsCode)
      .then(() => {
        initAmapMap();
        hideMapStatus();
      })
      .catch((error) => {
        console.error(error);
        document.body.classList.add("map-unavailable");
        showMapStatus(
          "高德地图加载失败",
          "请检查 AMAP_KEY、AMAP_SECURITY_JS_CODE、Web 端 JS API 权限和本地服务地址，然后刷新页面。"
        );
      });
  }

  function loadAmapMap(key, securityJsCode) {
    if (window.AMap) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (securityJsCode) {
        window._AMapSecurityConfig = {
          securityJsCode
        };
      }

      const existing = document.querySelector("script[data-amap]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("AMap script failed")), {
          once: true
        });
        return;
      }

      const callbackName = `onAmapLoaded_${Date.now()}`;
      window[callbackName] = () => {
        delete window[callbackName];
        if (window.AMap) resolve();
        else reject(new Error("AMap global is unavailable"));
      };

      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
        key
      )}&callback=${callbackName}`;
      script.charset = "utf-8";
      script.async = true;
      script.defer = true;
      script.dataset.amap = "true";
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error("AMap script failed"));
      };
      document.head.appendChild(script);
    });
  }

  function initAmapMap() {
    const baseLayer =
      typeof window.AMap.TileLayer === "function" ? new window.AMap.TileLayer() : undefined;

    map = new window.AMap.Map(els.map, {
      center: [104.1954, 35.8617],
      zoom: 4,
      viewMode: "2D",
      rotateEnable: false,
      pitchEnable: false,
      zooms: [3, 20],
      mapStyle: "amap://styles/normal",
      features: ["bg", "road", "building", "point"],
      resizeEnable: true,
      layers: baseLayer ? [baseLayer] : undefined
    });

    if (typeof map.setFeatures === "function") {
      map.setFeatures(["bg", "road", "building", "point"]);
    }
    if (typeof map.setMapStyle === "function") {
      map.setMapStyle("amap://styles/normal");
    }

    infoWindow = new window.AMap.InfoWindow({
      content: "",
      anchor: "bottom-center",
      offset: new window.AMap.Pixel(0, -44),
      autoMove: false
    });

    if (typeof infoWindow.close === "function") {
      infoWindow.close();
    }

    mapReady = true;
    renderMarkers();
    fitVisibleMarkers();
  }

  function renderMarkers() {
    if (!mapReady || !window.AMap) return;

    if (markers.length) {
      map.remove(markers);
      markers = [];
    }

    markerById = new Map();
    markers = state.visible.filter(hasCoordinate).map((restaurant) => {
      const marker = new window.AMap.Marker({
        position: [Number(restaurant.lng), Number(restaurant.lat)],
        title: restaurant.name,
        content: markerContent(restaurant),
        offset: new window.AMap.Pixel(-17, -42),
        extData: {
          restaurantId: restaurant.id
        }
      });
      marker.on("click", () => selectRestaurant(restaurant, true));
      markerById.set(restaurant.id, marker);
      return marker;
    });

    if (markers.length) {
      map.add(markers);
    }
  }

  function markerContent(restaurant) {
    const active = restaurant.id === state.selectedId ? " is-active" : "";
    const reviewBadge = restaurant.needsReview
      ? '<span class="amap-marker-badge amap-marker-badge-warning">复核</span>'
      : "";
    const dishBadge = restaurant.mainDishes?.[0]
      ? `<span class="amap-marker-badge amap-marker-badge-outline">${escapeHtml(
          restaurant.mainDishes[0]
        )}</span>`
      : "";
    const locationText = [displayEpisode(restaurant, true), restaurant.city, restaurant.district]
      .filter(Boolean)
      .join(" · ");
    return `<div class="amap-marker-wrap${active}">
      <div class="amap-episode-marker" style="--marker-color:${escapeAttr(
        colorForRestaurant(restaurant)
      )}" aria-hidden="true"><span>${escapeHtml(shortEpisodeNumber(restaurant))}</span></div>
      <div class="amap-marker-card" aria-label="${escapeAttr(
        `${restaurant.name}，${locationText}`
      )}">
        <span class="amap-marker-card-title">${escapeHtml(restaurant.name)}</span>
        <span class="amap-marker-card-description">${escapeHtml(locationText)}</span>
        <span class="amap-marker-meta">
          <span class="amap-marker-badge">${escapeHtml(shortEpisodeLabel(restaurant))}</span>
          <span class="amap-marker-badge amap-marker-badge-secondary">${escapeHtml(
            restaurant.cuisine
          )}</span>
          ${dishBadge}
          ${reviewBadge}
        </span>
      </div>
    </div>`;
  }

  function selectRestaurant(restaurant, focusMap) {
    const previousId = state.selectedId;
    state.selectedId = restaurant.id;
    renderList();
    updateMarkerSelection(previousId, restaurant.id);

    if (!mapReady || !hasCoordinate(restaurant)) return;

    const position = [Number(restaurant.lng), Number(restaurant.lat)];
    const token = beginSelectionFlight();

    runSelectionFlight(restaurant, position, focusMap, token);
  }

  function updateMarkerSelection(previousId, selectedId) {
    if (!mapReady || !markerById.size) return;

    unique([previousId, selectedId]).forEach((id) => {
      const marker = markerById.get(id);
      const restaurant = restaurants.find((entry) => entry.id === id);
      if (!marker || !restaurant || typeof marker.setContent !== "function") return;
      marker.setContent(markerContent(restaurant));
    });
  }

  async function runSelectionFlight(restaurant, position, focusMap, token) {
    try {
      if (focusMap) {
        await flyFlatTo(position, token);
      }
      openInfoWindowWhenCurrent(restaurant, position, token);
    } finally {
      if (token === selectionMoveToken) {
        setMapRoaming(false);
      }
    }
  }

  function beginSelectionFlight() {
    selectionMoveToken += 1;

    if (pendingInfoTimer) {
      window.clearTimeout(pendingInfoTimer);
      pendingInfoTimer = null;
    }
    if (infoWindow && typeof infoWindow.close === "function") {
      infoWindow.close();
    }
    setMapRoaming(true);

    return selectionMoveToken;
  }

  async function flyFlatTo(position, token) {
    if (!supportsFlatCamera()) {
      const duration = moveMapTo(position);
      await waitForCamera(duration, token);
      return;
    }

    const profile = flatCameraProfile(position);

    await cameraStage(
      {
        zoom: profile.liftZoom
      },
      profile.liftDuration,
      token
    );
    await cameraStage(
      {
        center: position,
        zoom: profile.cruiseZoom
      },
      profile.cruiseDuration,
      token
    );
    await cameraStage(
      {
        center: position,
        zoom: profile.targetZoom
      },
      profile.diveDuration,
      token
    );
  }

  function supportsFlatCamera() {
    return map && typeof map.setZoomAndCenter === "function";
  }

  function flatCameraProfile(position) {
    const currentCenter = typeof map.getCenter === "function" ? map.getCenter() : null;
    const currentLng = Number(currentCenter?.lng);
    const currentLat = Number(currentCenter?.lat);
    const currentZoom = typeof map.getZoom === "function" ? Number(map.getZoom()) : 8;
    const safeCurrentZoom = Number.isFinite(currentZoom) ? currentZoom : 8;
    const span =
      Number.isFinite(currentLng) && Number.isFinite(currentLat)
        ? Math.max(Math.abs(currentLng - position[0]), Math.abs(currentLat - position[1]))
        : 8;

    const targetZoom = Math.max(16, Math.min(17, safeCurrentZoom + 1));

    if (span > 20) {
      return {
        liftZoom: 4.8,
        cruiseZoom: 6.2,
        targetZoom,
        liftDuration: 320,
        cruiseDuration: 780,
        diveDuration: 540
      };
    }

    if (span > 8) {
      return {
        liftZoom: 5.6,
        cruiseZoom: 7.5,
        targetZoom,
        liftDuration: 280,
        cruiseDuration: 640,
        diveDuration: 500
      };
    }

    if (span > 2) {
      return {
        liftZoom: 8.4,
        cruiseZoom: 11.5,
        targetZoom,
        liftDuration: 240,
        cruiseDuration: 480,
        diveDuration: 420
      };
    }

    return {
      liftZoom: Math.min(12.5, Math.max(10.5, safeCurrentZoom - 1.5)),
      cruiseZoom: Math.min(14.5, Math.max(12.5, safeCurrentZoom)),
      targetZoom,
      liftDuration: 180,
      cruiseDuration: 300,
      diveDuration: 340
    };
  }

  async function cameraStage(camera, duration, token) {
    if (token !== selectionMoveToken) return;

    if (Array.isArray(camera.center)) {
      map.setZoomAndCenter(camera.zoom, camera.center, false, duration);
    } else if (typeof map.setZoom === "function" && Number.isFinite(camera.zoom)) {
      map.setZoom(camera.zoom, false, duration);
    }

    await waitForCamera(duration, token);
  }

  function moveMapTo(position) {
    const targetZoom = 15;
    const duration = movementDuration(position);

    if (typeof map.setZoomAndCenter === "function") {
      map.setZoomAndCenter(targetZoom, position, false, duration);
      return duration;
    }

    if (typeof map.panTo === "function") {
      const currentZoom = typeof map.getZoom === "function" ? Number(map.getZoom()) : NaN;
      if (typeof map.setZoom === "function" && currentZoom !== targetZoom) {
        map.setZoom(targetZoom);
      }
      map.panTo(position, duration);
      return duration;
    }

    map.setCenter(position);
    map.setZoom(targetZoom);
    return 0;
  }

  function movementDuration(position) {
    const currentCenter = typeof map.getCenter === "function" ? map.getCenter() : null;
    const currentLng = Number(currentCenter?.lng);
    const currentLat = Number(currentCenter?.lat);
    if (!Number.isFinite(currentLng) || !Number.isFinite(currentLat)) return 900;

    const span = Math.max(Math.abs(currentLng - position[0]), Math.abs(currentLat - position[1]));
    if (span > 20) return 1250;
    if (span > 8) return 1050;
    if (span > 2) return 850;
    return 650;
  }

  function waitForCamera(duration, token) {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (token !== selectionMoveToken) {
          resolve(false);
          return;
        }
        resolve(true);
      }, Math.max(0, duration + 40));
    });
  }

  function openInfoWindowWhenCurrent(restaurant, position, token) {
    pendingInfoTimer = window.setTimeout(() => {
      if (token !== selectionMoveToken) return;
      infoWindow.setContent(infoWindowContent(restaurant));
      infoWindow.open(map, position);
      pendingInfoTimer = null;
    }, 80);
  }

  function setMapRoaming(active) {
    document.body.classList.toggle("is-map-roaming", active);
  }

  function infoWindowContent(restaurant) {
    const warning = restaurant.needsReview ? '<span class="info-warning">位置需复核</span>' : "";
    const dishes = restaurant.mainDishesText
      ? `<p><strong>主要菜品：</strong>${escapeHtml(restaurant.mainDishesText)}</p>`
      : "";
    const links = sourceLinkList(restaurant);
    return `
      <article class="info-window">
        <h3>${escapeHtml(restaurant.name)}</h3>
        <p><strong>节目：</strong>${escapeHtml(restaurant.seriesName)} · ${escapeHtml(
      displayEpisode(restaurant, true)
    )}</p>
        <p><strong>播出：</strong>${escapeHtml(restaurant.airDate || "未注明")}</p>
        <p><strong>地址：</strong>${escapeHtml(restaurant.city)} ${escapeHtml(
      restaurant.district
    )} ${escapeHtml(restaurant.address)}</p>
        <p><strong>菜系：</strong>${escapeHtml(restaurant.cuisine)}</p>
        ${dishes}
        <p><strong>店主：</strong>${escapeHtml(restaurant.owner || "未注明")}</p>
        ${links}
        ${warning}
      </article>
    `;
  }

  function sourceLinkList(restaurant) {
    const links = (Array.isArray(restaurant.sourceLinks) ? restaurant.sourceLinks : [])
      .map((link) => ({
        label: link?.label || "节目链接",
        url: safeHttpUrl(link?.url || "")
      }))
      .filter((link) => link.url);

    if (links.length === 0 && safeHttpUrl(restaurant.episodeUrl || "")) {
      links.push({
        label: "节目链接",
        url: safeHttpUrl(restaurant.episodeUrl)
      });
    }

    if (!links.length) return "";

    return `<div class="info-links" aria-label="节目链接">${links
      .map(
        (link) =>
          `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            link.label
          )}</a>`
      )
      .join("")}</div>`;
  }

  function fitVisibleMarkers() {
    if (!mapReady || !state.visible.length) return;
    const points = state.visible.filter(hasCoordinate);
    if (points.length === 0) return;

    const minLat = Math.min(...points.map((point) => Number(point.lat)));
    const maxLat = Math.max(...points.map((point) => Number(point.lat)));
    const minLng = Math.min(...points.map((point) => Number(point.lng)));
    const maxLng = Math.max(...points.map((point) => Number(point.lng)));

    if (points.length === 1) {
      map.setCenter([Number(points[0].lng), Number(points[0].lat)]);
      map.setZoom(15);
      return;
    }

    if (markers.length && typeof map.setFitView === "function") {
      try {
        map.setFitView(markers, false, [70, 70, 70, 70], 15);
        return;
      } catch (error) {
        console.warn("setFitView fallback used", error);
      }
    }

    const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    const span = Math.max(maxLat - minLat, maxLng - minLng);
    const zoom = span > 25 ? 4 : span > 8 ? 5 : span > 3 ? 7 : span > 1 ? 9 : 12;
    map.setCenter(center);
    map.setZoom(zoom);
  }

  function showMapStatus(title, body) {
    els.mapStatus.classList.add("is-visible");
    els.mapStatus.innerHTML = `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>`;
  }

  function hideMapStatus() {
    els.mapStatus.classList.remove("is-visible");
  }

  function renderScopeIntro() {
    const scoped = scopedRestaurants();
    const episodeCount = unique(scoped.map((item) => item.episodeKey)).length;
    const first = scoped[0] || restaurants.find(matchesSeries) || restaurants[0];
    const isAllSeries = state.series === "all";
    const title = isAllSeries
      ? "美食地理"
      : state.season !== "all" && first
        ? `${first.seriesName} 第${first.season}季`
        : first?.seriesName || "美食地理";

    els.totalCount.textContent = scoped.length;
    els.episodeCount.textContent = episodeCount;
    els.brandTitle.textContent = title;
    els.brandCopy.textContent = isAllSeries
      ? `${scoped.length} 家馆子，${episodeCount} 集路线；按纪录片、季度、集数、城市、店名和菜品查找定位。`
      : `${scoped.length} 家馆子，${episodeCount} 集路线；按集数、城市、店名和菜品查找并定位。`;

    if (els.mapKicker) {
      els.mapKicker.textContent = isAllSeries ? "美食地理" : `${first?.seriesName || "纪录片"}地图`;
    }
    if (els.mapSummary) {
      const visibleEpisodes = unique(state.visible.map((item) => item.episodeKey)).length;
      els.mapSummary.textContent = `${state.visible.length} 家馆子 · ${visibleEpisodes} 集路线`;
    }
  }

  function renderDataNotice() {
    if (!els.dataNotice) return;
    const note =
      state.series === "rensheng-yichuan" || state.series === "all"
        ? "《人生一串》当前接入 B 站官方可核验的第1-3季、共18集；截至2026-07-03未核到第4季正片页，暂不填充猜测点位。"
        : "";
    els.dataNotice.hidden = !note;
    els.dataNotice.textContent = note;
  }

  function scopedRestaurants() {
    return restaurants.filter((restaurant) => matchesSeries(restaurant) && matchesSeason(restaurant));
  }

  function matchesSeries(restaurant) {
    return state.series === "all" || restaurant.seriesId === state.series;
  }

  function matchesSeason(restaurant) {
    return state.season === "all" || restaurant.seasonKey === state.season;
  }

  function matchesEpisode(restaurant) {
    return state.episode === "all" || restaurant.episodeKey === state.episode;
  }

  function compareSeason(a, b) {
    return (
      a.seriesName.localeCompare(b.seriesName, "zh-Hans-CN") ||
      Number(a.season) - Number(b.season)
    );
  }

  function compareEpisode(a, b) {
    return (
      a.seriesName.localeCompare(b.seriesName, "zh-Hans-CN") ||
      Number(a.season) - Number(b.season) ||
      Number(a.episodeInSeason) - Number(b.episodeInSeason)
    );
  }

  function episodeFilterLabel(restaurant) {
    if (state.series === "all") return `${restaurant.seriesName} ${displayEpisode(restaurant, true)}`;
    if (state.season === "all") return displayEpisode(restaurant, true);
    return restaurant.episodeTitle
      ? `第${restaurant.episodeInSeason}集 ${restaurant.episodeTitle}`
      : `第${restaurant.episodeInSeason}集`;
  }

  function displayEpisode(restaurant, withTitle = false) {
    const prefix = restaurant.seriesId === "laoguan-zhenglang"
      ? `第${restaurant.episodeInSeason}集`
      : `第${restaurant.season}季第${restaurant.episodeInSeason}集`;
    if (!withTitle || !restaurant.episodeTitle) return prefix;
    return `${prefix} ${restaurant.episodeTitle}`;
  }

  function shortEpisodeLabel(restaurant) {
    if (restaurant.seriesId === "laoguan-zhenglang") return `第${restaurant.episodeInSeason}集`;
    return `${restaurant.season}-${restaurant.episodeInSeason}`;
  }

  function shortEpisodeNumber(restaurant) {
    return String(restaurant.episodeInSeason);
  }

  function colorForRestaurant(restaurant) {
    const index = (Number(restaurant.season) - 1) * 8 + Number(restaurant.episodeInSeason) - 1;
    if (Number.isFinite(index) && index >= 0) return markerPalette[index % markerPalette.length];
    return markerPalette[0];
  }

  function hasCoordinate(restaurant) {
    return Number.isFinite(Number(restaurant.lat)) && Number.isFinite(Number(restaurant.lng));
  }

  function normalizeRestaurant(item) {
    const seriesId = item.seriesId || "laoguan-zhenglang";
    const seriesName = item.seriesName || "老馆正浪";
    const season = Number(item.season || 1);
    const episodeInSeason = Number(item.episodeInSeason || item.episode || 1);
    const mainDishes = Array.isArray(item.mainDishes)
      ? item.mainDishes.filter(Boolean)
      : item.mainDishes
        ? [item.mainDishes]
        : [];
    return {
      ...item,
      seriesId,
      seriesName,
      season,
      episodeInSeason,
      seasonKey: `${seriesId}:s${season}`,
      episodeKey: `${seriesId}:s${season}:e${episodeInSeason}`,
      episodeTitle: item.episodeTitle || "",
      cuisine: item.cuisine || "未分类",
      district: item.district || "",
      owner: item.owner || "未注明",
      mainDishes,
      mainDishesText: mainDishes.join(" / ")
    };
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function uniqueBy(values, getKey) {
    const seen = new Set();
    return values.filter((value) => {
      const key = getKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value));
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }
})();
