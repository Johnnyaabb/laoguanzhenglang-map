(() => {
  const restaurants = Array.isArray(window.LAOGUAN_RESTAURANTS)
    ? window.LAOGUAN_RESTAURANTS
    : [];

  const episodeColors = {
    1: "#d94a38",
    2: "#2878b5",
    3: "#1f8a70",
    4: "#b36b00",
    5: "#6f59c5",
    6: "#c23b72",
    7: "#238a99",
    8: "#545b62"
  };

  const state = {
    episode: "all",
    cuisine: "all",
    query: "",
    selectedId: null,
    visible: restaurants
  };

  const els = {};
  let map = null;
  let markers = [];
  let infoWindow = null;
  let mapReady = false;

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
    els.cuisineSelect = document.getElementById("cuisineSelect");
    els.searchInput = document.getElementById("searchInput");
    els.totalCount = document.getElementById("totalCount");
    els.episodeCount = document.getElementById("episodeCount");
    els.visibleCount = document.getElementById("visibleCount");
    els.listSummary = document.getElementById("listSummary");
  }

  function renderStaticControls() {
    const episodes = unique(restaurants.map((item) => item.episode)).sort((a, b) => a - b);
    const cuisines = unique(restaurants.map((item) => item.cuisine)).sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN")
    );

    els.totalCount.textContent = restaurants.length;
    els.episodeCount.textContent = episodes.length;

    els.episodeFilters.innerHTML = [
      buttonTemplate("all", "全部", state.episode === "all"),
      ...episodes.map((episode) =>
        buttonTemplate(String(episode), `第${episode}集`, state.episode === String(episode))
      )
    ].join("");

    els.cuisineSelect.innerHTML = [
      '<option value="all">全部菜系</option>',
      ...cuisines.map((cuisine) => `<option value="${escapeAttr(cuisine)}">${escapeHtml(cuisine)}</option>`)
    ].join("");
  }

  function bindEvents() {
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
      const episodeMatch =
        state.episode === "all" || String(restaurant.episode) === String(state.episode);
      const cuisineMatch = state.cuisine === "all" || restaurant.cuisine === state.cuisine;
      const queryMatch =
        !query ||
        [
          restaurant.name,
          restaurant.city,
          restaurant.district,
          restaurant.address,
          restaurant.cuisine,
          restaurant.owner,
          `第${restaurant.episode}集`
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return episodeMatch && cuisineMatch && queryMatch;
    });

    if (!state.visible.some((restaurant) => restaurant.id === state.selectedId)) {
      state.selectedId = null;
    }

    renderList();
    renderMarkers();
    fitVisibleMarkers();
  }

  function renderList() {
    els.visibleCount.textContent = state.visible.length;
    els.listSummary.textContent =
      state.visible.length === restaurants.length
        ? `全部 ${restaurants.length} 家`
        : `筛选出 ${state.visible.length} 家`;

    if (state.visible.length === 0) {
      els.restaurantList.innerHTML = '<p class="empty-state">没有匹配的馆子。</p>';
      return;
    }

    els.restaurantList.innerHTML = state.visible
      .map((restaurant) => {
        const active = restaurant.id === state.selectedId;
        const warning = restaurant.needsReview
          ? '<span class="tag tag-warning">位置需复核</span>'
          : "";
        return `
          <button class="restaurant-card${active ? " is-active" : ""}" type="button" data-id="${escapeAttr(
            restaurant.id
          )}">
            <span class="episode-dot" style="background:${episodeColors[restaurant.episode]}">第${
              restaurant.episode
            }集</span>
            <span class="restaurant-main">
              <strong>${escapeHtml(restaurant.name)}</strong>
              <span class="address">${escapeHtml(restaurant.city)} · ${escapeHtml(
          restaurant.district
        )}</span>
            </span>
            <span class="address address-full">${escapeHtml(restaurant.address)}</span>
            <span class="meta-line"><span>${escapeHtml(restaurant.cuisine)}</span>${warning}</span>
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
      pitch: 0,
      rotation: 0,
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
      // Keep the selected restaurant centered: don't let the window auto-pan the map.
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
      marker.on("click", () => selectRestaurant(restaurant, false));
      return marker;
    });

    if (markers.length) {
      map.add(markers);
    }
  }

  function markerContent(restaurant) {
    const color = episodeColors[restaurant.episode] || episodeColors[8];
    return `<div class="amap-marker-wrap">
      <div class="amap-episode-marker" style="--marker-color:${escapeAttr(
        color
      )}"><span>${restaurant.episode}</span></div>
      <div class="amap-marker-label">${escapeHtml(restaurant.name)}</div>
    </div>`;
  }

  function selectRestaurant(restaurant, focusMap) {
    state.selectedId = restaurant.id;
    renderList();

    if (!mapReady || !hasCoordinate(restaurant)) return;

    const position = [Number(restaurant.lng), Number(restaurant.lat)];

    // Open the info window first. autoMove is off so it won't shift the map, and
    // because it runs BEFORE the camera move it can't interrupt the animation
    // (that interruption was what previously left the map off-center on first click).
    infoWindow.setContent(infoWindowContent(restaurant));
    infoWindow.open(map, position);

    if (focusMap) {
      // Smoothly roam to the restaurant and zoom in (animated), as the final step.
      if (typeof map.setZoomAndCenter === "function") {
        map.setZoomAndCenter(15, position, false, 900);
      } else {
        map.setCenter(position);
        map.setZoom(15);
      }
    }
  }

  function infoWindowContent(restaurant) {
    const warning = restaurant.needsReview ? '<span class="info-warning">位置需复核</span>' : "";
    return `
      <article class="info-window">
        <h3>${escapeHtml(restaurant.name)}</h3>
        <p><strong>播出：</strong>第${restaurant.episode}集 · ${escapeHtml(
      restaurant.airDate
    )}</p>
        <p><strong>地址：</strong>${escapeHtml(restaurant.city)} ${escapeHtml(
      restaurant.district
    )} ${escapeHtml(restaurant.address)}</p>
        <p><strong>菜系：</strong>${escapeHtml(restaurant.cuisine)}</p>
        <p><strong>店主：</strong>${escapeHtml(restaurant.owner || "未注明")}</p>
        ${warning}
      </article>
    `;
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

  function hasCoordinate(restaurant) {
    return Number.isFinite(Number(restaurant.lat)) && Number.isFinite(Number(restaurant.lng));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
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
})();
