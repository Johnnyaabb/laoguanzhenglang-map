# 老馆正浪互动地图

静态网页应用，用高德地图 JS API 2.0 标注《老馆正浪》8 集中出现的 24 家馆子。

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

3. 访问 `http://localhost:8000/?v=amap-layoutfix-20260614`。

## 数据

馆子数据在 `data/restaurants.js`。当前包含 24 条记录，每条记录包含名称、集数、播出日期、城市、区县、地址、菜系、店主、坐标和来源备注。

坐标是初始预置点，用于让地图先具备完整交互。上线或正式使用前，建议用高德 Geocoder 复核坐标。

## 复核坐标

设置环境变量后运行：

```bash
AMAP_SERVICE_KEY=你的Web服务Key node tools/geocode.mjs --out data/geocode-results.json
```

脚本会调用高德地理编码接口，输出每条地址的 `lat`、`lng`、`level`、`formattedAddress` 和是否解析成功。
