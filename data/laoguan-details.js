(() => {
  const episodeMeta = {
    1: {
      episodeTitle: "带头大厨",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2167158",
      coverUrl: "https://i0.hdslb.com/bfs/archive/86ccc7c38bd2c5401547c2a99a7226cd5b1c0591.jpg"
    },
    2: {
      episodeTitle: "松弛结界",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2186196",
      coverUrl: "https://i0.hdslb.com/bfs/archive/f5cf4898cef4d3c81c36f1bc5c7c21f8dc185980.jpg"
    },
    3: {
      episodeTitle: "此味情长",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2219939",
      coverUrl: "https://i0.hdslb.com/bfs/archive/91a7cafa24090dbb699cd8a5e8cd8dc0dd3d1b1c.jpg"
    },
    4: {
      episodeTitle: "土生水长",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2232689",
      coverUrl: "https://i0.hdslb.com/bfs/archive/d8f0a6ed0c1661b4487be74ff22661a76c3f2a41.jpg"
    },
    5: {
      episodeTitle: "落地生根",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2254192",
      coverUrl: "https://i0.hdslb.com/bfs/archive/59a4ae21c07a89637c07eaeb8403f3487cc044d4.jpg"
    },
    6: {
      episodeTitle: "有点东西",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2285082",
      coverUrl: "https://i0.hdslb.com/bfs/archive/9680500c00c7cc31164e251c48be31b46c82c413.jpg"
    },
    7: {
      episodeTitle: "一门之隔",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2309471",
      coverUrl: "https://i0.hdslb.com/bfs/archive/01b8f5fe421436b05abf5198ca18a32b2be74fa1.jpg"
    },
    8: {
      episodeTitle: "迷之靠谱",
      episodeUrl: "https://www.bilibili.com/bangumi/play/ep2338028",
      coverUrl: "https://i0.hdslb.com/bfs/archive/01476f1f6807a9d2a99791e619f624663edda639.jpg"
    }
  };

  const sourceNote =
    "《老馆正浪》B站节目页、正片分集与官方短视频标题线索整理；菜品和故事摘要待逐帧复核。";

  const details = {
    "ep1-yuquan-fanzhuang": {
      mainDishes: ["赛螃蟹", "白蹦鱼丁", "扒牛肉条"],
      people: ["天津老派津鲁菜厨师团队", "挑嘴的天津食客"],
      story:
        "第1集以天津老派馆子的主厨和食客标准开场，短视频线索强调天津人对老味道的高要求。",
      recipeNotes: [
        "赛螃蟹用鸡蛋、姜末和糖醋味模拟蟹味，核心是酸甜鲜香的平衡。",
        "白蹦鱼丁强调鱼肉嫩滑，新鲜到入口轻轻一碰就断。",
        "扒牛肉条讲究成型、挂汁和摆盘，出锅后不能轻易破坏造型。"
      ]
    },
    "ep1-hongqilin-laozhen": {
      mainDishes: ["鳝丝", "三鲜茄子煲"],
      people: ["上海老客", "守着本帮味道的厨房团队"],
      story:
        "节目短视频提到有上海奶奶为了这一口老味道搬家，馆子承接的是街坊对海派家常味的依赖。",
      recipeNotes: [
        "鳝丝要炒出琥珀色的海派质感，火候和芡汁都不能拖泥带水。",
        "三鲜茄子煲走浓油赤酱的下饭路数，适合热锅端上桌。"
      ]
    },
    "ep1-laojiankang-jiayi": {
      mainDishes: ["锅包肉", "熘肉段", "风味鳕鱼", "虾仁菠菜"],
      people: ["贾姨", "哈尔滨高校食客"],
      story:
        "官方短视频称“东北奶奶靠锅包肉喂饱半个大学”，贾姨代表的是学校周边小馆长期积累的熟客关系。",
      recipeNotes: [
        "锅包肉一锅出品量不能贪多，复炸和卧汁决定脆度与酸甜香。",
        "熘肉段、风味鳕鱼和虾仁菠菜延续东北家常馆子的实惠组合。"
      ]
    },
    "ep2-jinan-dapaidang": {
      mainDishes: ["潮汕生腌", "鱼饭", "海鲜大排档菜"],
      people: ["罗姐", "揭阳本地食客"],
      story:
        "第2集预告指向“陋巷中的松弛”，揭阳大排档的核心是近海食材和本地人熟悉的夜宵秩序。",
      recipeNotes: [
        "生腌追求海鲜汁水在口中爆开的鲜甜冲击。",
        "鱼饭是潮汕语境里的冷熟鱼吃法，突出鱼本味而不是重调味。"
      ]
    },
    "ep2-erlou-shaocai": {
      mainDishes: ["特色啤酒鸭", "南昌油浸鱼", "蒜蓉粉丝腰片"],
      people: ["小区熟客", "南昌退休食客"],
      story:
        "官方故事短视频称这里藏在小区二层，既是烧菜馆，也是麻将馆，是南昌街坊日常松弛感的据点。",
      recipeNotes: [
        "啤酒鸭走浓香下饭路线，适合多人围桌。",
        "油浸鱼和蒜蓉粉丝腰片保留南昌家常烧菜的重口与锅气。"
      ]
    },
    "ep2-kuangqian-kuaican": {
      mainDishes: ["鸡爪猪脚", "土豆烧翅中", "矿区快餐"],
      people: ["矿区工友", "抚顺老食客"],
      story:
        "官方故事短视频把矿前快餐称为给工友驱散寒冷的暖心小店，重点不在精致，而在稳定、热乎和实在。",
      recipeNotes: [
        "鸡爪和猪脚同锅同味，吃的是胶质和家常卤烧味。",
        "土豆烧翅中以软糯回甜和脱骨口感做下饭记忆点。"
      ]
    },
    "ep3-huage-fandian": {
      mainDishes: ["猛火炒腰花", "油亮香肥肠", "香嫩脆肝"],
      people: ["华哥", "湘潭老客"],
      story:
        "官方故事短视频称华哥饭店是湘潭三十年的宝藏老馆，靠猛火爆炒和稳定熟客维持街坊口碑。",
      recipeNotes: [
        "腰花、肥肠、脆肝都依赖猛火短炒，去腥、脆嫩和锅气是关键。",
        "湘菜调味重香辣与油润，适合热菜快上快吃。"
      ]
    },
    "ep3-laowan-fanguan": {
      mainDishes: ["炒腰花", "肥肠", "脆肝", "溜肝尖", "下水菜"],
      people: ["老万饭馆厨师团队", "哈尔滨下水菜爱好者"],
      story:
        "官方故事短视频称老万饭馆是哈尔滨宝藏“下水米其林”；“在哈尔滨，理解了辛芷蕾的挑食”短视频封面与评论也指向溜肝尖一类下水菜。",
      recipeNotes: [
        "下水菜先处理干净，再靠火候、油脂和调味把脆嫩感留下。",
        "肥肠要油亮但不腻，腰花、脆肝和溜肝尖都怕过火。"
      ]
    },
    "ep3-fushan-laowei-mianguan": {
      mainDishes: ["刀拨面", "山西面食"],
      people: ["老卫"],
      story:
        "官方故事短视频称老卫是山西临汾年过七旬还健身的“老顽童”厨子，面馆的吸引力来自手艺和人本身。",
      recipeNotes: [
        "刀拨面是山西人活色生香的碳水炸弹，吃的是手工面形、筋道和浇头。",
        "面食的节奏要快，出锅后趁热拌开最有香气。"
      ]
    },
    "ep4-dazhu-tucai": {
      mainDishes: ["红烧鲫鱼", "土菜", "家常烧菜"],
      people: ["大朱土菜馆主理人", "合肥街坊食客"],
      story:
        "官方故事短视频称大朱土菜馆是从连锁店重围里杀出的老餐馆，并且从来不做外卖。",
      recipeNotes: [
        "红烧鲫鱼走朴素家常路线，靠煎、烧、收汁把鱼味做厚。",
        "土菜的价值在现点现做和锅气，不适合被外卖盒闷住。"
      ]
    },
    "ep4-heji-niurou-huoguo": {
      mainDishes: ["牛肉火锅", "牛肉干锅", "干香背筋", "干香牛胸口", "干香腱子肉"],
      people: ["何记老牌牛肉火锅团队", "都匀牛肉食客"],
      story:
        "官方短视频用“牛在贵州真的是不白死”形容这一站，“贵州bistro老祖宗”封面也露出牛肉干锅，强调本地牛肉从火锅到干香部位的完整吃法。",
      recipeNotes: [
        "背筋、牛胸口、腱子肉吃的是不同部位的脆、韧、香。",
        "牛肉火锅和牛肉干锅都需要清楚区分部位和下锅时间，过火会损失口感。"
      ]
    },
    "ep4-aleduosi-canting": {
      mainDishes: ["新疆手抓饭", "羊肉", "油香米饭"],
      people: ["库车餐厅三兄弟", "新疆本地食客"],
      story:
        "官方故事短视频提到新疆三兄弟的名号在公羊界闻风丧胆，餐厅把羊肉和米饭做成当地日常的硬菜。",
      recipeNotes: [
        "手抓饭的油脂、胡萝卜、羊肉和米粒要融合，油香是关键。",
        "羊肉处理要保留肉香，同时压住膻味。"
      ]
    },
    "ep5-jinlian-fandian": {
      mainDishes: ["印尼咖喱", "沙嗲", "南洋中菜"],
      people: ["金莲饭店主理人", "泉州侨乡食客"],
      story:
        "第5集“落地生根”里，这家店承载南洋风味在泉州本地化后的家常表达。",
      recipeNotes: [
        "印尼咖喱依赖复合香料，官方短视频提到神秘粉末让顾客吃了还想吃。",
        "沙嗲不是动作，而是一种酱料，重点是坚果香、辛香和甜咸平衡。"
      ]
    },
    "ep5-70niandai-laocaiguan": {
      mainDishes: ["浮油鸡片", "锅包肉", "东北老菜"],
      people: ["东北奶奶", "吉林高校与街坊食客"],
      story:
        "官方短视频称东北奶奶靠锅包肉喂饱半个大学，也提到她用肘关节才能端起锅、把青春留在厨房里；第5集公开评论进一步把“浮油鸡片”指向吉林这家老菜馆。",
      recipeNotes: [
        "浮油鸡片属于考验刀工、肉茸处理和汤油控制的老派菜，评论区也称这是手艺和功夫菜。",
        "锅包肉要靠复炸撑住脆壳，酸甜汁只挂表面，不能把肉片泡软。",
        "东北老菜讲究大份、热乎和直接的香。"
      ]
    },
    "ep8-wangdahei-fanpu": {
      mainDishes: ["烧饼", "老炒肉"],
      people: ["王大黑饭铺老板", "邢台任泽老街食客"],
      story:
        "官方番外19直接给出“王大黑饭铺，做烧饼一绝”，封面门头也显示主营老炒肉、烧饼，是第8集任泽老街段的具名老店。",
      recipeNotes: [
        "烧饼是门店招牌，官方标题把“做烧饼一绝”作为记忆点。",
        "老炒肉和烧饼构成老街快餐式的硬菜组合，适合边吃边补主食。"
      ]
    },
    "ep6-chenshi-niurou-gutoucheng": {
      mainDishes: ["饼卷牛肉", "老卤子炖牛肉", "牛肉骨头"],
      people: ["陈氏牛肉骨头城团队", "邢台牛肉食客"],
      story:
        "官方短视频称在邢台一张饼能卷下一头牛，老卤牛肉和牛骨头构成这家店的记忆点。",
      recipeNotes: [
        "老卤子炖牛肉要靠时间把肉香和卤香吃进纤维。",
        "饼卷肉的关键是饼不能抢味，肉要有油润和嚼劲。"
      ]
    },
    "ep6-longbao-chaguan": {
      mainDishes: ["兴化早茶", "一茶三点一面", "茶馆面点", "茶馆面"],
      people: ["龙宝茶馆熟客", "兴化早茶食客"],
      story:
        "官方短视频提到兴化人吃早茶讲究“一茶三点一面”；“最简单也最难的单品”和“先开水再开饭”的封面分别是吃面、茶水与早茶桌面，均归入龙宝茶馆的早茶体验。",
      recipeNotes: [
        "早茶不是单品，而是茶、点心和面一起构成的时间体验。",
        "面点要趁热，汤水和主食的顺序也影响吃法。"
      ]
    },
    "ep6-jinyuan-jiujia": {
      mainDishes: ["生炒鲩鱼卷", "鸡嗉", "粤式爆炒"],
      people: ["延续粤菜菜品的两兄弟"],
      story:
        "官方短视频称两兄弟一直在延续有传承的粤菜菜品，金源酒家这一站突出的是地方粤菜手艺。",
      recipeNotes: [
        "生炒鲩鱼卷要靠猛火保持鱼肉弹性和锅气。",
        "鸡嗉这类食材吃的是嚼头，处理干净与火候同样重要。"
      ]
    },
    "ep7-guilin-wuming": {
      mainDishes: ["干锅蚂拐", "桂林地方干锅"],
      people: ["老徐", "桂林老派厨师与街坊食客"],
      story:
        "官方故事短视频提到老徐以前是榕湖饭店的大厨，曾接待过两次尼克松；正片弹幕与高德 POI 指向的店名为“老徐干锅蚂拐”。",
      recipeNotes: [
        "干锅蚂拐对应桂林地方口味，核心是高温收干、重香料和蛙肉入味。",
        "老徐的故事线更像老饭店厨师手艺在社区小馆里的延续。"
      ]
    },
    "ep7-xiaochunfeng-nongjiale": {
      mainDishes: ["醋溜鱼", "艾糕", "绍兴农家菜"],
      people: ["笑春风农家乐主理人", "绍兴乡土食客"],
      story:
        "第7集“一门之隔”强调烟火交融，笑春风农家乐代表的是城市边缘和乡土菜之间的一步之隔。",
      recipeNotes: [
        "醋溜鱼用酸味打开鱼肉鲜味，和杭州西湖醋鱼同属江南酸甜鱼菜语境，但节目标题强调不是西湖醋鱼。",
        "艾糕使用艾草制作，官方短视频强调草本香气。",
        "农家菜重在时令、热锅和熟客熟路。"
      ]
    },
    "ep7-zanjia-sifangcai": {
      mainDishes: ["猛火爆炒", "家常私房菜"],
      people: ["从棉花厂质检主管转型的餐厅老板", "国棉四厂老街坊"],
      story:
        "官方故事短视频提到老板从棉花厂质检主管转型为餐厅老板，馆子和国棉四厂社区记忆紧密相连。",
      recipeNotes: [
        "猛火爆炒的记忆点在锅气和出菜速度，食材要在短时间内完成断生、挂味和增香。",
        "私房菜依赖老板对熟客口味的长期记忆。"
      ]
    },
    "ep8-wanbaolou-sanyuan": {
      mainDishes: ["肘子肉夹馍", "油泼辣子"],
      people: ["陕西乡党食客", "三原老馆厨师团队"],
      story:
        "官方短视频展示陕西乡党正宗肘子肉夹馍吃法，并把油泼辣子作为这一口的灵魂。",
      recipeNotes: [
        "油泼辣子要用热油激发辣椒香，温度过高会糊，过低则不香。",
        "肘子肉夹馍吃的是肉香、辣香和馍的承托。"
      ]
    },
    "ep8-leishi-feichang": {
      mainDishes: ["火爆肥肠"],
      people: ["雷氏火爆肥肠馆团队", "宜宾干饭食客"],
      story:
        "官方短视频称宜宾下饭神菜火爆肥肠有人甚至能因为它吃11碗饭，是第8集里最直接的干饭记忆点。",
      recipeNotes: [
        "火爆肥肠要把肥肠处理到无腥但保留油香，再用猛火和重味调料催出下饭感。",
        "肥肠不能软塌，入口要有弹性和油润。"
      ]
    },
    "ep8-miaodachu-shitou-chaorou": {
      mainDishes: ["石头老炒肉", "老炒肉饭"],
      people: ["苗大厨饭店团队", "任泽老街食客"],
      story:
        "官方番外17封面露出“苗大厨饭店”门头和“石头老炒肉”立牌；“这道朴实无华的菜，让这家餐厅开了几十年”的美食纯享封面明确写着“老炒肉”。",
      recipeNotes: [
        "老炒肉的重点是肉香、锅气和米饭适配度，不靠复杂摆盘取胜。",
        "高德只命中同街区“西大街石头饭店(老店)”候选，正式探店前建议二次确认门点。"
      ]
    }
  };

  const rows = Array.isArray(window.LAOGUAN_RESTAURANTS)
    ? window.LAOGUAN_RESTAURANTS
    : [];

  rows.forEach((restaurant) => {
    const detail = details[restaurant.id];
    if (!detail) return;

    const meta = episodeMeta[restaurant.episode] || {};
    Object.assign(restaurant, meta, detail, {
      sourceLinks: [
        {
          label: "B站节目页",
          url: "https://www.bilibili.com/bangumi/play/ss111333"
        },
        meta.episodeUrl
          ? {
              label: `第${restaurant.episode}集正片`,
              url: meta.episodeUrl
            }
          : null
      ].filter(Boolean),
      sourceNote: `${restaurant.sourceNote} ${sourceNote}`
    });
  });
})();
