# 美食地理

静态网页应用，用高德地图 JS API 2.0 标注美食纪录片中的出镜馆子。当前包含《老馆正浪》和《人生一串》数据，可按纪录片、季度、集数、城市、店名和菜品筛选。

## 使用

1. 在 `config.local.js` 填写高德地图 Web JS API Key：

   ```js
   window.LAOGUAN_CONFIG.AMAP_KEY = "YOUR_AMAP_KEY";
   window.LAOGUAN_CONFIG.AMAP_SECURITY_JS_CODE = "YOUR_AMAP_SECURITY_JS_CODE";
   ```

   高德 2021-12-02 后创建的 Web 端 JS API Key 需要同时填写安全密钥 `AMAP_SECURITY_JS_CODE`。

2. 在项目目录启动本地 HTTP 服务：

   ```bash
   python3 -m http.server 8000
   ```

3. 访问 `http://localhost:8000/?v=food-geography-20260703`。

## 数据

《老馆正浪》基础馆子数据在 `data/restaurants.js`，补充菜品、故事和节目链接在 `data/laoguan-details.js`。

《人生一串》馆子数据在 `data/rensheng-yichuan.js`，分集标题、播出日期和 B 站节目链接在 `data/rensheng-yichuan-details.js`。截至 2026-07-03，仅核到 B 站官方第 1-3 季共 18 集，未核到第 4 季正片页，因此不填充猜测点位。

每条记录包含纪录片、季度、集数、名称、城市、区县、地址、菜品、坐标和来源备注。

坐标是初始预置点，用于让地图先具备完整交互。上线或正式使用前，建议用高德 Geocoder 复核坐标。

## 复核坐标

设置环境变量后运行：

```bash
AMAP_SERVICE_KEY=你的Web服务Key node tools/geocode.mjs --out data/geocode-results.json
```

脚本会调用高德地理编码接口，输出每条地址的 `lat`、`lng`、`level`、`formattedAddress` 和是否解析成功。
