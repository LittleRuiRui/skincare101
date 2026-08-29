import fs from "node:fs";

const appPath = "src/App.tsx";
const i18nPath = "src/lib/legacySkinText.ts";
const MARKER = "// expanded-skin-concerns-v1";

let app = fs.readFileSync(appPath, "utf8");
if (!app.includes(MARKER)) {
  app = app
    .replace('label: "泛红",\n    candidates:', 'label: "泛红 / 敏感 / 屏障",\n    candidates:')
    .replace('label: "暗沉",\n    candidates:', 'label: "暗沉 / 色斑",\n    candidates:')
    .replace('label: "毛孔粗大/黑头",\n    candidates:', 'label: "毛孔 / 黑头 / 出油",\n    candidates:');

  const treeMarker = "\n};\n\n/* 报告内容模板:按 症状 → 候选病因 key 索引 */";
  const treeInsert = `

  // ${MARKER}
  dryness: {
    label: "干燥 / 缺水 / 起皮",
    candidates: {
      barrier: "屏障受损",
      compensatory: "缺水状态",
      sensitive: "敏感不耐受",
    },
    questions: [
      {
        key: "timing",
        q: "什么时候最容易觉得干、紧绷或起皮?",
        hint: "先判断是持续性干燥，还是清洁、环境或护肤后短暂出现",
        options: [
          { v: "all_day", l: "一天大部分时间都干，甚至会起皮", signals: { compensatory: { delta: 25, label: "持续性缺水干燥" }, barrier: { delta: 10 } } },
          { v: "after_wash", l: "主要是洗脸后明显紧绷", signals: { barrier: { delta: 25, label: "清洁后明显紧绷" }, sensitive: { delta: 10 } } },
          { v: "environment", l: "空调房、换季或旅行时明显", signals: { compensatory: { delta: 20, label: "环境相关干燥" }, sensitive: { delta: 10 } } },
        ],
      },
      {
        key: "surface",
        q: "干燥时皮肤表面更像哪一种?",
        hint: "区分单纯缺水与屏障受损",
        options: [
          { v: "tight", l: "只是紧绷、缺水，但没有明显刺痛", signals: { compensatory: { delta: 30, label: "紧绷缺水为主" } } },
          { v: "flaky", l: "会起皮、粗糙，底妆容易卡粉", signals: { barrier: { delta: 20, label: "起皮粗糙" }, compensatory: { delta: 15 } } },
          { v: "sting", l: "涂普通护肤品也会刺痛或发热", signals: { barrier: { delta: 30, label: "基础护肤也刺痛" }, sensitive: { delta: 20 } } },
        ],
      },
      {
        key: "oil_mix",
        q: "干的同时会不会明显出油?",
        hint: "识别常见的外油内干/缺水代偿状态",
        options: [
          { v: "yes", l: "会，T区或整脸还是很容易出油", signals: { compensatory: { delta: 30, label: "干燥同时明显出油" } } },
          { v: "no", l: "不会，整体就是偏干、油脂很少", signals: { barrier: { delta: 10 }, compensatory: { delta: 15 } } },
        ],
      },
      {
        key: "trigger",
        q: "最近有没有明显增加刷酸、清洁或高活性产品?",
        hint: "确认干燥是否可能来自近期刺激叠加",
        options: [
          { v: "yes", l: "有，最近活性产品或清洁明显变多", signals: { barrier: { delta: 35, label: "近期刺激叠加" }, sensitive: { delta: 10 } } },
          { v: "no", l: "没有，护肤习惯基本没变", signals: { compensatory: { delta: 15 }, barrier: { delta: -5 } } },
        ],
      },
    ],
  },

  agingConcern: {
    label: "细纹 / 松弛 / 老化",
    candidates: {
      aging: "胶原流失 / 松弛",
      photodamage: "光老化",
    },
    questions: [
      {
        key: "main",
        q: "你现在最明显的变化是什么?",
        hint: "先区分动态细纹、结构性松弛与整体光老化表现",
        options: [
          { v: "lines", l: "眼周、额头或嘴角细纹更明显", signals: { aging: { delta: 25, label: "细纹明显" } } },
          { v: "sag", l: "轮廓变松、皮肤支撑感下降", signals: { aging: { delta: 35, label: "松弛支撑下降" } } },
          { v: "overall", l: "同时有暗沉、粗糙、斑点和细纹", signals: { photodamage: { delta: 35, label: "多维度光老化表现" }, aging: { delta: 10 } } },
        ],
      },
      {
        key: "sun",
        q: "过去几年日晒和防晒情况怎么样?",
        hint: "紫外线是可干预的主要外源老化因素",
        options: [
          { v: "high", l: "日晒较多，过去也不太规律防晒", signals: { photodamage: { delta: 30, label: "长期紫外线暴露" } } },
          { v: "low", l: "日晒不多，而且长期规律防晒", signals: { aging: { delta: 15 }, photodamage: { delta: -10 } } },
        ],
      },
      {
        key: "duration",
        q: "这些变化大概持续多久了?",
        hint: "长期稳定累积更符合结构性老化，而短期波动可能受缺水和状态影响",
        options: [
          { v: "recent", l: "最近几个月才突然觉得明显", signals: { aging: { delta: 5 }, photodamage: { delta: -10 } } },
          { v: "years", l: "几年里逐渐变明显", signals: { aging: { delta: 25, label: "多年渐进变化" }, photodamage: { delta: 20 } } },
        ],
      },
      {
        key: "dryness",
        q: "补足保湿后，细纹会不会明显变浅?",
        hint: "帮助区分缺水纹与更稳定的结构性细纹",
        options: [
          { v: "yes", l: "会，皮肤水润时明显好很多", signals: { aging: { delta: -10 }, photodamage: { delta: -5 } } },
          { v: "no", l: "不会，保湿后还是很明显", signals: { aging: { delta: 25, label: "保湿后仍存在" } } },
        ],
      },
    ],
  },

  textureConcern: {
    label: "粗糙 / 肤质不平",
    candidates: {
      buildup: "角质堆积",
      barrier: "屏障受损",
      true_acne: "闭口 / 粉刺倾向",
    },
    questions: [
      {
        key: "feel",
        q: "摸起来的不平整更像哪一种?",
        hint: "粗糙、脱屑和闭口看起来相似，但处理方向不同",
        options: [
          { v: "rough", l: "整体像砂纸一样粗糙，但没有很多凸起", signals: { buildup: { delta: 30, label: "整体角质粗糙" } } },
          { v: "flaky", l: "粗糙同时会起皮、紧绷或刺痛", signals: { barrier: { delta: 35, label: "粗糙伴起皮不适" } } },
          { v: "bumps", l: "是一颗颗小凸起，摸起来颗粒感明显", signals: { true_acne: { delta: 30, label: "小颗粒凸起" }, buildup: { delta: 10 } } },
        ],
      },
      {
        key: "location",
        q: "主要集中在哪里?",
        hint: "分布能帮助判断角质、屏障还是毛孔堵塞为主",
        options: [
          { v: "tzone", l: "额头、鼻翼、下巴这些容易出油的位置", signals: { true_acne: { delta: 20 }, buildup: { delta: 20 } } },
          { v: "cheeks", l: "两颊为主，而且容易干或敏感", signals: { barrier: { delta: 25 } } },
          { v: "overall", l: "整脸都比较粗糙", signals: { buildup: { delta: 20 }, barrier: { delta: 10 } } },
        ],
      },
      {
        key: "clog",
        q: "同时有没有黑头、白头或闭口?",
        hint: "确认毛囊堵塞是否是主要原因",
        options: [
          { v: "yes", l: "有，而且数量不少", signals: { true_acne: { delta: 30, label: "伴明显粉刺堵塞" }, buildup: { delta: 15 } } },
          { v: "no", l: "基本没有，就是表面不够平滑", signals: { true_acne: { delta: -20 }, buildup: { delta: 15 } } },
        ],
      },
      {
        key: "exfoliation",
        q: "温和去角质后通常会怎样?",
        hint: "反应模式能进一步区分角质堆积与屏障脆弱",
        options: [
          { v: "better", l: "会暂时更光滑，而且没有明显刺激", signals: { buildup: { delta: 30, label: "温和去角质后改善" } } },
          { v: "worse", l: "容易更红、更干或刺痛", signals: { barrier: { delta: 30, label: "去角质后刺激加重" } } },
          { v: "unknown", l: "不确定，平时很少去角质", signals: {} },
        ],
      },
    ],
  },`;
  if (!app.includes(treeMarker)) throw new Error("SYMPTOM_TREES insertion marker not found");
  app = app.replace(treeMarker, treeInsert + treeMarker);

  const reportMarker = "\n};\n\n/* 成分库——按体系分类";
  const reportInsert = `
  dryness: {
    barrier: { advice: "当前更像屏障受损导致的干燥不耐受。先停高频去角质和刺激性活性，保留温和清洁、保湿和防晒，优先补充神经酰胺、泛醇等屏障支持体系。", drugs: [], medical: false },
    compensatory: { advice: "当前更像缺水或外油内干。重点不是继续强控油，而是增加稳定的吸湿保湿和适度封闭，观察出油是否随水润度恢复而下降。", drugs: [], medical: false },
    sensitive: { advice: "干燥同时伴随较明显的不耐受信号。减少新品和活性叠加，优先使用配方简单、低刺激的保湿修护产品，并逐个引入新产品。", drugs: [], medical: false },
  },
  agingConcern: {
    aging: { advice: "当前更偏向结构性细纹或松弛。日常重点是长期防晒、稳定保湿，并在耐受允许时逐步建立维A类或其他有证据的抗老活性；变化通常以月为单位。", drugs: [], medical: false },
    photodamage: { advice: "当前光老化信号更突出。严格防晒是第一优先级，再考虑抗氧化和维A类长期方案；如果有持续变化的异常色斑或皮损，应先由皮肤科确认。", drugs: [], medical: false },
  },
  textureConcern: {
    buildup: { advice: "当前更像角质堆积造成的粗糙。可以从低频、温和的化学去角质开始，同时保持保湿；不要因为追求即时光滑而连续叠加酸类。", drugs: [], medical: false },
    barrier: { advice: "当前粗糙更像屏障不稳定而不是角质太厚。先停止去角质和强清洁，以修护和保湿为主，等紧绷、起皮或刺痛稳定后再评估肤质。", drugs: [], medical: false },
    true_acne: { advice: "当前颗粒感更像闭口或粉刺堵塞。避免挤压，优先考虑温和的角质代谢和控油方案；如果持续发炎、疼痛或明显加重，建议皮肤科评估。", drugs: [], medical: false },
  },`;
  if (!app.includes(reportMarker)) throw new Error("REPORT_CONTENT insertion marker not found");
  app = app.replace(reportMarker, "\n" + reportInsert + reportMarker);
  fs.writeFileSync(appPath, app);
}

let i18n = fs.readFileSync(i18nPath, "utf8");
if (!i18n.includes("expandedSkinConcernTranslations")) {
  const translations = {
    "泛红 / 敏感 / 屏障": "Redness / sensitivity / barrier",
    "暗沉 / 色斑": "Dullness / pigmentation",
    "毛孔 / 黑头 / 出油": "Pores / blackheads / oiliness",
    "干燥 / 缺水 / 起皮": "Dryness / dehydration / flaking",
    "细纹 / 松弛 / 老化": "Fine lines / firmness / aging",
    "粗糙 / 肤质不平": "Rough / uneven texture",
    "屏障受损": "Barrier damage",
    "缺水状态": "Dehydration",
    "敏感不耐受": "Sensitivity / intolerance",
    "胶原流失 / 松弛": "Collagen loss / loss of firmness",
    "光老化": "Photodamage",
    "闭口 / 粉刺倾向": "Comedonal acne tendency",
    "什么时候最容易觉得干、紧绷或起皮?": "When does your skin feel driest, tightest, or most flaky?",
    "先判断是持续性干燥，还是清洁、环境或护肤后短暂出现": "This helps distinguish persistent dryness from temporary dryness related to cleansing, environment, or skincare.",
    "一天大部分时间都干，甚至会起皮": "Dry for most of the day, sometimes with flaking",
    "主要是洗脸后明显紧绷": "Mainly tight after cleansing",
    "空调房、换季或旅行时明显": "Mainly in air-conditioning, seasonal changes, or travel",
    "干燥时皮肤表面更像哪一种?": "When your skin is dry, which description fits best?",
    "区分单纯缺水与屏障受损": "Helps distinguish dehydration from barrier damage.",
    "只是紧绷、缺水，但没有明显刺痛": "Tight and dehydrated, but without obvious stinging",
    "会起皮、粗糙，底妆容易卡粉": "Flaky or rough, and makeup catches on dry patches",
    "涂普通护肤品也会刺痛或发热": "Even basic skincare can sting or feel hot",
    "干的同时会不会明显出油?": "Do you also get noticeably oily while feeling dry?",
    "识别常见的外油内干/缺水代偿状态": "Checks for the common oily-but-dehydrated pattern.",
    "会，T区或整脸还是很容易出油": "Yes, my T-zone or whole face still gets oily easily",
    "不会，整体就是偏干、油脂很少": "No, my skin is generally dry with little oil",
    "最近有没有明显增加刷酸、清洁或高活性产品?": "Have you recently increased exfoliation, cleansing, or strong active products?",
    "确认干燥是否可能来自近期刺激叠加": "Checks whether recent irritation may be driving the dryness.",
    "有，最近活性产品或清洁明显变多": "Yes, I have used more actives or cleansed more aggressively",
    "没有，护肤习惯基本没变": "No, my routine has been mostly unchanged",
    "你现在最明显的变化是什么?": "What change is most noticeable to you?",
    "先区分动态细纹、结构性松弛与整体光老化表现": "First distinguish fine lines, structural loss of firmness, and broader photodamage.",
    "眼周、额头或嘴角细纹更明显": "Fine lines around my eyes, forehead, or mouth are more visible",
    "轮廓变松、皮肤支撑感下降": "My facial contours feel looser and less supported",
    "同时有暗沉、粗糙、斑点和细纹": "I have a mix of dullness, roughness, spots, and fine lines",
    "过去几年日晒和防晒情况怎么样?": "How much sun exposure and sunscreen use have you had over the past few years?",
    "紫外线是可干预的主要外源老化因素": "UV exposure is one of the main modifiable external aging factors.",
    "日晒较多，过去也不太规律防晒": "A lot of sun exposure and inconsistent sunscreen use",
    "日晒不多，而且长期规律防晒": "Limited sun exposure and consistent sunscreen use",
    "这些变化大概持续多久了?": "How long have you noticed these changes?",
    "长期稳定累积更符合结构性老化，而短期波动可能受缺水和状态影响": "Gradual long-term change is more consistent with structural aging; short-term changes may reflect hydration and skin condition.",
    "最近几个月才突然觉得明显": "They only became noticeable in the last few months",
    "几年里逐渐变明显": "They have gradually become more noticeable over several years",
    "补足保湿后，细纹会不会明显变浅?": "Do the fine lines look noticeably softer after good moisturization?",
    "帮助区分缺水纹与更稳定的结构性细纹": "Helps distinguish dehydration lines from more persistent structural lines.",
    "会，皮肤水润时明显好很多": "Yes, they look much better when my skin is well hydrated",
    "不会，保湿后还是很明显": "No, they remain obvious even after moisturizing",
    "摸起来的不平整更像哪一种?": "Which best describes the uneven texture you can feel?",
    "粗糙、脱屑和闭口看起来相似，但处理方向不同": "Roughness, flaking, and closed comedones can look similar but need different approaches.",
    "整体像砂纸一样粗糙，但没有很多凸起": "Generally rough like sandpaper, without many raised bumps",
    "粗糙同时会起皮、紧绷或刺痛": "Rough with flaking, tightness, or stinging",
    "是一颗颗小凸起，摸起来颗粒感明显": "Small raised bumps with a clearly bumpy feel",
    "主要集中在哪里?": "Where is it mainly concentrated?",
    "分布能帮助判断角质、屏障还是毛孔堵塞为主": "Distribution helps distinguish buildup, barrier issues, and clogged pores.",
    "额头、鼻翼、下巴这些容易出油的位置": "Forehead, sides of the nose, or chin where I get oily",
    "两颊为主，而且容易干或敏感": "Mostly the cheeks, which also tend to be dry or sensitive",
    "整脸都比较粗糙": "My whole face feels relatively rough",
    "同时有没有黑头、白头或闭口?": "Do you also have blackheads, whiteheads, or closed comedones?",
    "确认毛囊堵塞是否是主要原因": "Checks whether follicular clogging is the main driver.",
    "有，而且数量不少": "Yes, quite a few",
    "基本没有，就是表面不够平滑": "Hardly any; the surface just does not feel smooth",
    "温和去角质后通常会怎样?": "What usually happens after gentle exfoliation?",
    "反应模式能进一步区分角质堆积与屏障脆弱": "Your response can further distinguish buildup from a fragile barrier.",
    "会暂时更光滑，而且没有明显刺激": "It becomes smoother temporarily without obvious irritation",
    "容易更红、更干或刺痛": "It becomes redder, drier, or more irritated",
    "不确定，平时很少去角质": "Not sure; I rarely exfoliate",
    "当前更像屏障受损导致的干燥不耐受。先停高频去角质和刺激性活性，保留温和清洁、保湿和防晒，优先补充神经酰胺、泛醇等屏障支持体系。": "This looks more like dryness and intolerance related to barrier disruption. Pause frequent exfoliation and irritating actives; keep gentle cleansing, moisturizer, and sunscreen, with barrier-supportive ingredients such as ceramides and panthenol.",
    "当前更像缺水或外油内干。重点不是继续强控油，而是增加稳定的吸湿保湿和适度封闭，观察出油是否随水润度恢复而下降。": "This looks more like dehydration or an oily-but-dehydrated pattern. Instead of stronger oil control, focus on consistent humectant hydration and appropriate occlusion, then see whether oiliness settles as hydration improves.",
    "干燥同时伴随较明显的不耐受信号。减少新品和活性叠加，优先使用配方简单、低刺激的保湿修护产品，并逐个引入新产品。": "Dryness is accompanied by clearer intolerance signals. Reduce new products and active layering, prioritize simple low-irritation moisturizers, and introduce new products one at a time.",
    "当前更偏向结构性细纹或松弛。日常重点是长期防晒、稳定保湿，并在耐受允许时逐步建立维A类或其他有证据的抗老活性；变化通常以月为单位。": "This leans more toward structural fine lines or loss of firmness. Prioritize long-term sunscreen and consistent moisturization, then gradually introduce retinoids or other evidence-based anti-aging actives if tolerated. Meaningful change usually takes months.",
    "当前光老化信号更突出。严格防晒是第一优先级，再考虑抗氧化和维A类长期方案；如果有持续变化的异常色斑或皮损，应先由皮肤科确认。": "Photodamage signals are more prominent. Strict sunscreen use comes first, followed by longer-term antioxidant and retinoid strategies. Any unusual changing spot or lesion should be assessed by a dermatologist first.",
    "当前更像角质堆积造成的粗糙。可以从低频、温和的化学去角质开始，同时保持保湿；不要因为追求即时光滑而连续叠加酸类。": "This looks more like roughness from surface buildup. Start with low-frequency gentle chemical exfoliation while maintaining hydration, and avoid stacking acids for immediate smoothness.",
    "当前粗糙更像屏障不稳定而不是角质太厚。先停止去角质和强清洁，以修护和保湿为主，等紧绷、起皮或刺痛稳定后再评估肤质。": "The roughness looks more like barrier instability than excess dead skin. Pause exfoliation and harsh cleansing, focus on repair and moisturization, and reassess texture after tightness, flaking, or stinging settles.",
    "当前颗粒感更像闭口或粉刺堵塞。避免挤压，优先考虑温和的角质代谢和控油方案；如果持续发炎、疼痛或明显加重，建议皮肤科评估。": "The bumpiness looks more like closed comedones or clogged pores. Avoid squeezing and consider gentle keratinization and oil-control strategies. Persistent inflammation, pain, or worsening should be assessed by a dermatologist."
  };
  i18n = i18n.replace("const ZH_OVERRIDE", `const expandedSkinConcernTranslations=${JSON.stringify(translations)};\nObject.assign(EN,expandedSkinConcernTranslations);\nconst ZH_OVERRIDE`);
  fs.writeFileSync(i18nPath, i18n);
}

console.log("Expanded skin concerns are synchronized.");
