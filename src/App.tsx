// @ts-nocheck -- The legacy prototype UI predates the typed intelligence layer.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Circle,
  Camera,
  ScanText,
  Database,
  ExternalLink,
} from "lucide-react";
import { scoreCandidates } from "./intelligence/confidenceEngine";
import { ingredientMatches, parseIngredientDetails } from "./intelligence/ingredientParser";
import { rankProducts } from "./intelligence/productScoring";
import { PRODUCT_CATALOG } from "./data/productCatalog";
import ProductContributionPanel from "./components/ProductContributionPanel";
import { loadSharedProductCatalog } from "./lib/supabase";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

const INK = "#1C1B19";
const PAPER = "#FAF9F6";
const LINE = "#E4E1DA";
const TEAL = "#3D6B63";
const TEAL_SOFT = "#E8EEEC";
const AMBER = "#B8863A";
const AMBER_SOFT = "#F5EBDA";
const RUST = "#A8503A";
const MUTE = "#8A8579";

/* ============================================================
   诊断引擎:每个症状 = 候选病因 + 问题树(选项带 signals 打分)
   signals: { candidateKey: { delta, label } }
   delta > 0 支持该候选 / delta < 0 削弱该候选
   ============================================================ */

const SYMPTOM_TREES = {
  redness: {
    label: "泛红",
    candidates: {
      barrier: "屏障受损型泛红",
      rosacea: "玫瑰痤疮倾向",
      sensitive: "单纯敏感肌反应",
      overexfoliate: "过度去角质",
      seborrheic: "脂溢性皮炎",
    },
    questions: [
      {
        key: "onset",
        q: "这种泛红是最近才出现的,还是持续超过一个月了?",
        hint: "先做急性/慢性分流,判断是外因触发还是体质性问题",
        options: [
          {
            v: "acute",
            l: "两周以内,比较突然",
            signals: {
              barrier: { delta: 25, label: "急性起病" },
              overexfoliate: { delta: 15, label: "急性起病" },
              rosacea: { delta: -10 },
              sensitive: { delta: -10 },
            },
          },
          {
            v: "chronic",
            l: "一个多月以上,反反复复",
            signals: {
              rosacea: { delta: 20, label: "慢性反复病程" },
              sensitive: { delta: 20, label: "慢性反复病程" },
              barrier: { delta: -10 },
            },
          },
        ],
      },
      {
        key: "trigger",
        q: "这段时间有没有以下情况?(可多选)",
        hint: "诱因具体化,而非开放式提问",
        multi: true,
        options: [
          {
            v: "product",
            l: "换了新的护肤品/精华/面霜",
            signals: { barrier: { delta: 10, label: "近期换新产品" } },
          },
          {
            v: "exfoliate",
            l: "用了去角质/焕肤类产品(酸类、磨砂、洁面仪)",
            signals: {
              overexfoliate: { delta: 30, label: "近期高频去角质" },
              barrier: { delta: 10, label: "近期高频去角质" },
            },
          },
          {
            v: "season",
            l: "环境明显变化(换季、出国、长期空调房)",
            signals: { sensitive: { delta: 10, label: "环境变化诱发" } },
          },
          {
            v: "none",
            l: "以上都没有,就是突然开始的",
            signals: {
              rosacea: { delta: 15, label: "找不到明确外部诱因" },
              sensitive: { delta: 10, label: "找不到明确外部诱因" },
              barrier: { delta: -15 },
            },
          },
        ],
      },
      {
        key: "feel",
        q: "泛红的地方有没有刺痛、紧绷、发烫的感觉?",
        hint: "区分屏障受损(有不适感)与单纯视觉泛红",
        options: [
          {
            v: "yes",
            l: "有,会痛或者很紧绷",
            signals: {
              barrier: { delta: 25, label: "伴随刺痛/紧绷" },
              overexfoliate: { delta: 10, label: "伴随刺痛/紧绷" },
              rosacea: { delta: -5 },
            },
          },
          {
            v: "no",
            l: "没有,只是看起来红",
            signals: {
              rosacea: { delta: 15, label: "视觉泛红但无不适感" },
              sensitive: { delta: 10, label: "视觉泛红但无不适感" },
              barrier: { delta: -15 },
            },
          },
        ],
      },
      {
        key: "flush",
        q: "遇到热水洗脸、喝酒、情绪激动时,泛红会不会突然加重、并且很久不退?",
        hint: "专门排查玫瑰痤疮——这是它最具特异性的触发模式",
        options: [
          {
            v: "yes",
            l: "会,而且退得很慢",
            signals: { rosacea: { delta: 35, label: "热/酒精/情绪触发,持续不退" } },
          },
          {
            v: "no",
            l: "不太会,或者退得挺快",
            signals: { rosacea: { delta: -20 } },
          },
        ],
      },
      {
        key: "scale",
        q: "泛红的地方有没有黄色、偏油腻的皮屑,而且集中在鼻翼两侧、眉毛、发际线这些部位?",
        hint: "脂溢性皮炎容易被当成普通泛红或屏障受损处理,但机制和马拉色菌相关,方向不同",
        options: [
          {
            v: "yes",
            l: "有,而且油腻感、边界感比较明显",
            signals: { seborrheic: { delta: 35, label: "油腻鳞屑+特定部位分布" }, barrier: { delta: -15 } },
          },
          {
            v: "no",
            l: "没有,就是单纯发红,没有皮屑",
            signals: { seborrheic: { delta: -20 } },
          },
        ],
      },
    ],
  },

  acne: {
    label: "爆痘",
    candidates: {
      pseudo: "假性痘(屏障受损型)",
      true_acne: "真性痤疮",
      product_induced: "致痘成分诱发",
      fungal_acne: "马拉色菌毛囊炎(真菌痘)",
    },
    questions: [
      {
        key: "onset",
        q: "这次爆痘是最近(两周内)突然冒出来的,还是断断续续持续一个多月了?",
        hint: "急慢性分流",
        options: [
          {
            v: "acute",
            l: "最近突然冒出来的",
            signals: {
              product_induced: { delta: 20, label: "急性突发" },
              pseudo: { delta: 10, label: "急性突发" },
              true_acne: { delta: -10 },
            },
          },
          {
            v: "chronic",
            l: "断断续续一个多月以上",
            signals: { true_acne: { delta: 25, label: "慢性反复病程" }, pseudo: { delta: -5 } },
          },
        ],
      },
      {
        key: "trigger",
        q: "这段时间有没有以下情况?(可多选)",
        hint: "诱因具体化",
        multi: true,
        options: [
          {
            v: "product",
            l: "换了新的护肤品/防晒/彩妆",
            signals: { product_induced: { delta: 30, label: "近期换新产品" } },
          },
          {
            v: "exfoliate",
            l: "用了去角质/焕肤类产品",
            signals: {
              pseudo: { delta: 15, label: "近期高频去角质" },
              product_induced: { delta: 10, label: "近期高频去角质" },
            },
          },
          {
            v: "diet",
            l: "饮食/作息明显变化(熬夜、高糖高油、压力大)",
            signals: { true_acne: { delta: 10, label: "饮食/作息变化" } },
          },
          {
            v: "cycle",
            l: "生理周期相关(经期前后规律性出现)",
            signals: { true_acne: { delta: 20, label: "生理周期相关" } },
          },
          {
            v: "none",
            l: "以上都没有",
            signals: { true_acne: { delta: 10, label: "找不到明确外部诱因" } },
          },
        ],
      },
      {
        key: "fungal",
        q: "有没有以下情况?(可多选)",
        hint: "马拉色菌毛囊炎(俗称真菌痘)外观很像痤疮,机制是酵母菌感染而非皮脂腺炎症,常规祛痘产品无效甚至加重",
        multi: true,
        options: [
          {
            v: "chest_back",
            l: "主要长在胸背部或发际线,不是以面部为主",
            signals: { fungal_acne: { delta: 25, label: "胸背/发际线分布为主" } },
          },
          {
            v: "uniform",
            l: "痘痘大小非常均匀,几乎一个模子刻出来的",
            signals: { fungal_acne: { delta: 20, label: "大小高度均匀" } },
          },
          {
            v: "itchy",
            l: "伴随明显瘙痒,而不是疼痛",
            signals: { fungal_acne: { delta: 20, label: "以瘙痒为主而非疼痛" }, true_acne: { delta: -10 } },
          },
          {
            v: "no_resolve",
            l: "用过祛痘产品或抗生素,没什么效果甚至更严重",
            signals: { fungal_acne: { delta: 25, label: "常规祛痘/抗生素处理无效" } },
          },
          {
            v: "none",
            l: "都没有以上情况",
            signals: { fungal_acne: { delta: -20 } },
          },
        ],
      },
      {
        key: "inflamed",
        q: "现在有没有红肿或者疼痛的感觉?",
        hint: "先做粉刺 vs 炎症性痘痘的分流——粉刺是没有发炎的最早期阶段",
        options: [
          {
            v: "no",
            l: "不红不肿不疼,就是鼓起来的小颗粒,或者能看到黑头/白头",
            signals: {
              true_acne: { delta: 15, label: "无红肿疼痛,以粉刺为主" },
              pseudo: { delta: -10 },
            },
          },
          {
            v: "yes",
            l: "有红肿或者疼痛感",
            signals: { true_acne: { delta: 5, label: "存在红肿或疼痛,已发炎" } },
          },
        ],
      },
      {
        key: "depth",
        q: "摸起来是浅表的、能感觉到清楚边界,还是感觉埋在皮下比较深、像个包?",
        hint: "深浅是判断严重程度的第一个独立维度",
        skipIf: (a) => a.inflamed === "no",
        options: [
          {
            v: "shallow",
            l: "浅表,边界比较清楚",
            signals: { pseudo: { delta: 10, label: "位置浅表" }, true_acne: { delta: 5 } },
          },
          {
            v: "deep",
            l: "感觉埋在皮下,像个包,摸起来比较深",
            signals: { true_acne: { delta: 25, label: "深层皮下病灶" }, pseudo: { delta: -15 } },
          },
        ],
      },
      {
        key: "pus",
        q: "顶端有没有明显的白色/黄色脓头,或者挤压会不会出脓?",
        hint: "有无脓是判断严重程度的第二个独立维度,和深浅是两条不同的轴",
        skipIf: (a) => a.inflamed === "no",
        options: [
          {
            v: "no",
            l: "没有脓头,挤不出什么东西",
            signals: { true_acne: { delta: 5, label: "无明显脓头" } },
          },
          {
            v: "yes",
            l: "有,能看到脓头或者挤压会出脓",
            signals: { true_acne: { delta: 25, label: "可见脓头或可挤出脓液" }, pseudo: { delta: -15 } },
          },
        ],
      },
      {
        key: "location",
        q: "主要长在两颊,还是集中在下巴/嘴周/T区?",
        hint: "分布位置辅助区分病因",
        options: [
          {
            v: "cheek",
            l: "两颊为主",
            signals: { pseudo: { delta: 20, label: "分布在两颊" }, product_induced: { delta: 10, label: "分布在两颊" } },
          },
          {
            v: "jaw",
            l: "下巴/嘴周/T区为主",
            signals: { true_acne: { delta: 25, label: "分布在下巴/嘴周/T区" } },
          },
        ],
      },
      {
        key: "cyclical",
        q: "这种爆痘是不是每个月固定时间会加重?",
        hint: "补充确认激素相关因素",
        options: [
          {
            v: "yes",
            l: "有规律,固定时间加重",
            signals: { true_acne: { delta: 30, label: "存在周期性加重规律" } },
          },
          {
            v: "no",
            l: "没什么规律",
            signals: { true_acne: { delta: -10 }, pseudo: { delta: 5 } },
          },
        ],
      },
    ],
  },

  dullness: {
    label: "暗沉",
    candidates: {
      buildup: "角质堆积",
      pigmentation: "色素沉着",
      circulation: "微循环/作息问题",
      photodamage: "光损伤(慢性)",
    },
    questions: [
      {
        key: "fluctuation",
        q: "这种暗沉是持续存在的,还是会随着睡眠/状态好坏明显变化?",
        hint: "波动性分流",
        options: [
          {
            v: "varies",
            l: "随状态波动明显",
            signals: { circulation: { delta: 35, label: "随睡眠/状态明显波动" } },
          },
          {
            v: "stable",
            l: "持续稳定,没怎么变过",
            signals: {
              buildup: { delta: 10, label: "持续稳定" },
              pigmentation: { delta: 10, label: "持续稳定" },
              photodamage: { delta: 15, label: "持续稳定" },
              circulation: { delta: -20 },
            },
          },
        ],
      },
      {
        key: "pattern",
        q: "暗沉是脸上有明显的深色斑块/印子,还是整张脸看起来均匀发暗?",
        hint: "局部 vs 整体",
        options: [
          {
            v: "patchy",
            l: "有明显局部斑块/印子",
            signals: { pigmentation: { delta: 35, label: "局部深色斑块" }, buildup: { delta: -10 } },
          },
          {
            v: "overall",
            l: "整张脸均匀发暗",
            signals: {
              buildup: { delta: 15, label: "整体均匀发暗" },
              photodamage: { delta: 15, label: "整体均匀发暗" },
              pigmentation: { delta: -15 },
            },
          },
        ],
      },
      {
        key: "texture",
        q: "皮肤摸起来是粗糙、有颗粒感,还是比较光滑但就是显老、毛孔明显?",
        hint: "触感线索,区分角质堆积 vs 光损伤",
        options: [
          {
            v: "rough",
            l: "粗糙,有颗粒感",
            signals: { buildup: { delta: 30, label: "触感粗糙有颗粒感" }, photodamage: { delta: -10 } },
          },
          {
            v: "smooth",
            l: "光滑,但显老/毛孔明显/有细纹",
            signals: { photodamage: { delta: 30, label: "光滑但显老/毛孔明显" }, buildup: { delta: -15 } },
          },
        ],
      },
      {
        key: "duration",
        q: "这种状态是最近才这样,还是感觉持续好几年了?",
        hint: "累积时长,最终确认光损伤",
        options: [
          {
            v: "recent",
            l: "最近才这样",
            signals: {
              buildup: { delta: 15, label: "近期才出现" },
              circulation: { delta: 10, label: "近期才出现" },
              photodamage: { delta: -20 },
            },
          },
          {
            v: "years",
            l: "持续好几年,一直没变过",
            signals: { photodamage: { delta: 30, label: "多年持续累积" }, pigmentation: { delta: 10 }, buildup: { delta: -15 } },
          },
        ],
      },
    ],
  },

  pores: {
    label: "毛孔粗大/黑头",
    candidates: {
      oily: "油脂型毛孔",
      compensatory: "缺水代偿型毛孔",
      buildup: "角质堆积型毛孔",
      aging: "衰老松弛型毛孔",
    },
    questions: [
      {
        key: "shape",
        q: "毛孔的形状更接近哪一种?",
        hint: "形状是判断成因最直接的线索——不同成因撑大毛孔的方式不一样",
        options: [
          {
            v: "u",
            l: "U型,主要集中在鼻翼/T区",
            signals: { oily: { delta: 30, label: "U型毛孔,集中T区" }, buildup: { delta: 10 } },
          },
          {
            v: "oval",
            l: "椭圆形,同时觉得皮肤有点紧绷缺水",
            signals: { compensatory: { delta: 30, label: "椭圆形毛孔+紧绷缺水" }, oily: { delta: -10 } },
          },
          {
            v: "drop",
            l: "水滴形,向下拉长,伴随松弛下垂感",
            signals: { aging: { delta: 35, label: "水滴形毛孔,向下松弛" }, oily: { delta: -15 } },
          },
          {
            v: "unclear",
            l: "看不出明显形状,但黑头/闭口很多",
            signals: { buildup: { delta: 30, label: "形状不明显,黑头闭口为主" }, oily: { delta: 10 } },
          },
        ],
      },
      {
        key: "oil",
        q: "平时出油情况怎么样?",
        hint: "区分真性出油和缺水代偿性出油——两者外观类似,方向相反",
        options: [
          {
            v: "heavy",
            l: "T区很快出油,一天要按吸油纸好几次",
            signals: { oily: { delta: 25, label: "T区出油旺盛" }, compensatory: { delta: -15 } },
          },
          {
            v: "dry",
            l: "皮肤偏干、很少出油,但毛孔看起来还是很粗",
            signals: { compensatory: { delta: 30, label: "皮肤干但毛孔粗——代偿性信号" }, oily: { delta: -20 } },
          },
          {
            v: "normal",
            l: "出油正常,不算严重",
            signals: { buildup: { delta: 10 }, aging: { delta: 10 } },
          },
        ],
      },
      {
        key: "surface",
        q: "皮肤表面有没有以下情况?(可多选)",
        hint: "具体化角质堆积的表现,而非笼统问“清洁够不够”",
        multi: true,
        options: [
          {
            v: "blackhead",
            l: "鼻头/鼻翼有明显黑头",
            signals: { buildup: { delta: 20, label: "鼻部黑头明显" }, oily: { delta: 10 } },
          },
          {
            v: "closed",
            l: "闭口比较多,摸起来有小颗粒",
            signals: { buildup: { delta: 25, label: "闭口较多,触感有颗粒" } },
          },
          {
            v: "rough",
            l: "皮肤摸起来粗糙,角质感觉偏厚",
            signals: { buildup: { delta: 15, label: "触感粗糙,角质偏厚" } },
          },
          {
            v: "none",
            l: "都没有",
            signals: { buildup: { delta: -15 } },
          },
        ],
      },
      {
        key: "aging_signal",
        q: "有没有以下情况?",
        hint: "补充确认是否存在衰老性因素",
        options: [
          {
            v: "sag",
            l: "毛孔感觉在往下垂,伴随皮肤松弛",
            signals: { aging: { delta: 30, label: "毛孔下垂,伴随松弛" } },
          },
          {
            v: "recent_sun",
            l: "最近熬夜或暴晒后,感觉毛孔明显变大",
            signals: { aging: { delta: 15, label: "熬夜/暴晒后明显加重" }, oily: { delta: 5 } },
          },
          {
            v: "no",
            l: "没有以上情况",
            signals: { aging: { delta: -15 } },
          },
        ],
      },
    ],
  },
};

/* 报告内容模板:按 症状 → 候选病因 key 索引 */
const REPORT_CONTENT = {
  redness: {
    barrier: {
      advice:
        "近期建议以修复为主:避免高浓度酸类和物理去角质,选择含神经酰胺、泛醇的修复类产品,清洁产品换成温和氨基酸表活。抗老/抗氧化类活性成分建议暂缓引入,待屏障状态稳定后再逐步添加。",
      drugs: [
        { tier: "温和", name: "壬二酸 (Azelaic Acid)", note: "抗炎抑菌,刺激性低,起效慢" },
      ],
      medical: false,
    },
    rosacea: {
      advice:
        "避免热水洗脸、酒精类护肤品和高浓度活性成分,以舒缓抗炎为主要方向,减少一切可能扩张血管的刺激源。",
      drugs: [
        { tier: "温和", name: "甲硝唑凝胶", note: "玫瑰痤疮一线外用,耐受性较好" },
        { tier: "温和-中等", name: "壬二酸", note: "兼具抗炎,适用于炎性丘疹" },
        { tier: "处方/口服", name: "低剂量四环素类抗生素", note: "中重度炎症性情况使用,需医生评估" },
      ],
      medical: "触发模式提示玫瑰痤疮可能性未被排除,建议挂皮肤科做进一步评估,确认后再决定用药方案。",
    },
    sensitive: {
      advice: "以基础舒缓保湿为主,减少新品尝试频率,给皮肤留出适应时间,避免叠加多种活性成分。",
      drugs: [{ tier: "温和", name: "泛醇/积雪草类舒缓成分", note: "非处方,日常维稳可用" }],
      medical: false,
    },
    overexfoliate: {
      advice: "立即停用一切去角质/焕肤类产品至少2-4周,专注基础保湿修复,待屏障感受恢复后再谨慎低频重启。",
      drugs: [{ tier: "温和", name: "神经酰胺类修复霜", note: "非药物,但是这个阶段的核心" }],
      medical: false,
    },
    seborrheic: {
      advice:
        "这更接近脂溢性皮炎而非单纯屏障受损,机制和马拉色菌相关,单纯保湿修复效果有限——护理方向应该侧重控油+抗真菌+抗炎的平衡,过度保湿反而可能加重油腻感。",
      drugs: [
        { tier: "非处方", name: "酮康唑洗剂/乳膏", note: "抗真菌方向,通常间歇性使用而非长期连续" },
        { tier: "温和", name: "锌吡硫酮", note: "兼具抗真菌和抗炎,常见于相关洗护产品" },
      ],
      medical: "如果反复发作或面积较大、常规护理没有改善,建议皮肤科确认诊断后再决定长期方案。",
    },
  },
  acne: {
    pseudo: {
      advice:
        "这种情况容易被当成油痘处理,但方向恰恰相反——应避免控油/祛痘产品线里的高浓度酸类和收敛成分,转向屏障修复,痘痘往往会随屏障恢复自然消退。",
      drugs: [{ tier: "温和", name: "壬二酸", note: "兼顾抗炎和轻度调节角质,刺激性低" }],
      medical: false,
    },
    true_acne: {
      advice: "护理方向以角质代谢调节+抗炎为主,粉刺和轻度丘疹阶段护肤品/非处方药可以起到明显作用,单靠护肤品对中重度炎症效果有限。",
      drugs: [
        { tier: "非处方", name: "阿达帕林 (Adapalene)", note: "调节角质代谢,刺激性低于传统维A酸" },
        { tier: "中等", name: "过氧化苯甲酰", note: "强抗菌,起效快但刺激性明显" },
        { tier: "处方(口服)", name: "螺内酯 / 口服避孕药", note: "针对激素周期性痤疮,需医生评估内分泌情况" },
      ],
      medical: "周期性、粉刺明显的模式提示可能与激素相关,建议挂皮肤科做评估,明确用药方案与浓度。",
    },
    true_acne_moderate: {
      advice: "已经出现脓疱,说明炎症比单纯粉刺更明确,护肤品能辅助但不该单独承担治疗任务——控油和抗炎方向的产品可以配合,但核心还是药物介入。",
      drugs: [
        { tier: "非处方", name: "阿达帕林 (Adapalene)", note: "调节角质代谢,长期使用可减少新发脓疱" },
        { tier: "中等", name: "过氧化苯甲酰", note: "强抗菌抗炎,起效快,常与阿达帕林联合使用" },
        { tier: "中等", name: "外用抗生素(克林霉素等)", note: "通常与过氧化苯甲酰联合,避免单独使用产生耐药性" },
        { tier: "处方(口服)", name: "螺内酯 / 口服避孕药", note: "针对激素周期性痤疮,需医生评估内分泌情况" },
      ],
      medical: "已经有脓疱形成,建议尽快挂皮肤科明确治疗方案,拖延可能增加炎症后色沉和留印的风险。",
    },
    true_acne_severe: {
      advice: "结节囊肿型的炎症位置比表面痘痘更深,护肤品这个阶段基本起不到治疗作用,处理不及时容易留下凹陷疤痕,这不是护肤能解决的范畴。",
      drugs: [
        { tier: "处方(重度)", name: "口服异维A酸", note: "重度囊肿型痤疮的标准选择,效果强但副作用系统性(致畸性、肝功能影响等),必须医生严格监控" },
        { tier: "处方(口服)", name: "螺内酯 / 口服避孕药", note: "如果同时有激素周期性规律,可作为联合治疗方向" },
        { tier: "处方(急性期)", name: "皮损内糖皮质激素注射", note: "医生操作,用于单个严重结节的快速消肿止痛" },
      ],
      medical: "结节囊肿型痤疮建议尽快就医,不建议自行护理观察——炎症深、留疤风险高,越早规范治疗、遗留疤痕的概率越低。",
    },
    product_induced: {
      advice: "先排查近期新用产品,停用可疑品项做单一变量测试,通常在停用后1-2周内会看到明显改善。",
      drugs: [],
      medical: false,
    },
    fungal_acne: {
      advice:
        "这不是细菌性痤疮,是马拉色菌(一种酵母菌)在毛囊内过度增殖导致的炎症,常规祛痘产品(尤其是含厚重油脂/发酵成分的)和抗生素类无效,甚至会因为破坏皮肤菌群平衡而加重。护理方向应该是抗真菌,而不是抗痘。",
      drugs: [{ tier: "非处方", name: "酮康唑洗剂/硫化硒洗剂", note: "抗真菌方向,常用于身体/头皮部位,面部需谨慎" }],
      medical: "如果面部也出现类似皮损,建议皮肤科做刮片镜检确认诊断,避免长期误用祛痘产品延误处理。",
    },
  },
  dullness: {
    buildup: {
      advice: "可以引入低浓度、低频率的化学去角质(如低浓度果酸/PHA),配合保湿,避免过度物理摩擦。",
      drugs: [],
      medical: false,
    },
    pigmentation: {
      advice: "重点在于抑制黑色素生成+严格防晒:建议加入烟酰胺、传明酸等美白方向成分,防晒是效果能否维持的关键。",
      drugs: [{ tier: "处方", name: "氢醌 (Hydroquinone)", note: "较强效美白成分,需医生指导浓度和使用周期" }],
      medical: "如果斑块边界不规则或近期明显扩大,建议皮肤科确认是否为黄褐斑或其他色素性疾病,再决定治疗方案。",
    },
    circulation: {
      advice: "护肤品能起到的作用有限,更多需要从睡眠、压力管理入手;日常可用含咖啡因、维C的提亮类精华辅助。",
      drugs: [],
      medical: false,
    },
    photodamage: {
      advice: "这是慢性累积效应,建议引入低浓度维A醇建立耐受,配合抗氧化精华(维C/阿魏酸)和严格防晒,效果显现需要数月周期。",
      drugs: [{ tier: "处方(视情况)", name: "维A酸 (Tretinoin)", note: "长期光损伤的经典处方选择,需建立耐受" }],
      medical: false,
    },
  },
  pores: {
    oily: {
      advice: "以控油、疏通毛孔为主:含锌PCA、烟酰胺的产品能持续调节皮脂分泌,避免频繁去角质或用力挤压,否则毛孔会被进一步物理撑大。",
      drugs: [],
      medical: false,
    },
    compensatory: {
      advice: "这种情况很容易被误判成出油旺盛去做控油,但方向恰恰相反——应该加强保湿修复,皮脂会随着屏障水润度恢复而回归正常分泌,继续控油只会让代偿性出油更严重。",
      drugs: [],
      medical: false,
    },
    buildup: {
      advice: "建议低浓度、低频率的化学去角质(水杨酸因为亲脂性,对疏通毛孔内堆积皮脂更有针对性),配合温和保湿,避免用手挤压黑头导致毛孔发炎撑大。",
      drugs: [{ tier: "非处方", name: "水杨酸 (BHA,低浓度)", note: "亲脂性强,较易进入毛孔溶解堆积的皮脂和角质" }],
      medical: false,
    },
    aging: {
      advice: "核心是胶原流失导致的支撑力下降,日常护肤能做的有限——建议引入低浓度维A醇建立耐受以刺激胶原新生,配合严格防晒延缓流失速度,效果显现通常需要数月。",
      drugs: [{ tier: "处方(视情况)", name: "维A酸 (Tretinoin)", note: "长期用于刺激胶原合成,需建立耐受,起效缓慢" }],
      medical: false,
    },
  },
};

/* 成分库——按体系分类,每个成分标注归属体系、具体功效,以及适合/有风险的候选病因(用CANDIDATE_FAMILY里同一套key,
   跨症状通用:比如"神经酰胺"对屏障受损、缺水代偿型毛孔都适用,不用每个症状重复定义一遍) */
const INGREDIENT_LIBRARY = [
  // ---- 脂质/封闭保湿体系 ----
  { name: "神经酰胺 (Ceramide NP)", system: "脂质体系", func: "补充屏障脂质,减少经皮水分流失", goodFor: ["barrier", "overexfoliate", "compensatory", "pseudo"] },
  { name: "植物鞘氨醇 (Phytosphingosine)", system: "脂质体系", func: "神经酰胺合成前体,协同修复屏障", goodFor: ["barrier", "compensatory"] },
  { name: "胆固醇/谷甾醇 (Beta-Sitosterol)", system: "脂质体系", func: "配合神经酰胺按比例修复屏障脂质结构", goodFor: ["barrier", "compensatory"] },
  { name: "角鲨烷 (Squalane)", system: "脂质体系", func: "仿生皮脂,低致痘性封闭保湿", goodFor: ["barrier", "compensatory", "sensitive"] },
  { name: "霍霍巴籽油 (Jojoba Seed Oil)", system: "脂质体系", func: "成分结构接近人体皮脂,温和不易致痘", goodFor: ["barrier", "compensatory"] },
  { name: "乳木果油 (Shea Butter)", system: "脂质体系(封闭型)", func: "高含量脂肪酸,强效封闭滋润", goodFor: ["barrier"], riskyFor: ["true_acne", "oily"] },
  { name: "白池花籽油 (Meadowfoam Seed Oil)", system: "脂质体系", func: "氧化稳定性高的轻质植物油,滋润不粘腻", goodFor: ["barrier", "compensatory"] },
  { name: "矿物油/凡士林 (Mineral Oil/Petrolatum)", system: "脂质体系(强封闭型)", func: "极强封闭锁水,但部分肤质可能闷痘", goodFor: ["barrier"], riskyFor: ["true_acne", "oily", "pseudo"] },
  { name: "羊毛脂醇 (Lanolin Alcohol)", system: "脂质体系", func: "强滋润封闭剂,少数人可能致敏", goodFor: ["barrier"], riskyFor: ["sensitive"] },
  { name: "硅油类 (Dimethicone)", system: "脂质体系(硅类)", func: "成膜封闭、改善肤感,不致痘但可能闷痘体质需注意", goodFor: ["barrier"], riskyFor: ["true_acne"] },

  // ---- 保湿体系(湿润剂,分小/大分子) ----
  { name: "透明质酸钠 (Sodium Hyaluronate)", system: "保湿体系(小分子)", func: "快速补水,分子量小、渗透表层", goodFor: ["barrier", "compensatory", "true_acne", "pigmentation"] },
  { name: "甘油 (Glycerin)", system: "保湿体系", func: "经典吸湿剂,性价比高、刺激性低", goodFor: ["barrier", "sensitive", "compensatory"] },
  { name: "丙二醇/丁二醇 (Propanediol/Butylene Glycol)", system: "保湿体系", func: "小分子吸湿保湿剂,兼做其他成分的溶剂", goodFor: ["barrier", "compensatory"] },
  { name: "海藻糖 (Trehalose)", system: "保湿体系", func: "糖类保湿剂,兼具一定的细胞保护作用", goodFor: ["barrier", "sensitive"] },
  { name: "山梨醇 (Sorbitol)", system: "保湿体系", func: "糖醇类保湿剂,质地稳定", goodFor: ["compensatory"] },
  { name: "依克多因 (Ectoin)", system: "保湿/抗炎体系", func: "渗透压保护,增强细胞抗刺激能力", goodFor: ["barrier", "sensitive"] },

  // ---- 清洁/表活体系 ----
  { name: "氨基酸表活 (如 Sodium Cocoyl Alaninate)", system: "清洁体系", func: "温和清洁,不过度破坏屏障脂质", goodFor: ["barrier", "rosacea", "sensitive"] },
  { name: "椰油两性基乙酸钠 (Cocoamphoacetate)", system: "清洁体系", func: "温和两性表活,常与氨基酸表活复配", goodFor: ["barrier", "sensitive"] },
  { name: "皂基表活 (Sodium Laureth Sulfate 等)", system: "清洁体系", func: "清洁力强但偏碱性,容易破坏屏障", riskyFor: ["barrier", "rosacea", "sensitive", "overexfoliate"] },

  // ---- 抗炎舒缓体系 ----
  { name: "泛醇/泛醌三乙酸酯 (Panthenol)", system: "抗炎舒缓体系", func: "抗炎+促进屏障修复", goodFor: ["barrier", "rosacea", "sensitive", "overexfoliate"] },
  { name: "积雪草提取物", system: "抗炎舒缓体系", func: "抗炎抗敏,促进创面愈合", goodFor: ["barrier", "pseudo", "overexfoliate"] },
  { name: "红没药醇", system: "抗炎舒缓体系", func: "抗炎舒缓,常用于刺激后修复", goodFor: ["barrier", "sensitive", "overexfoliate"] },
  { name: "尿囊素 (Allantoin)", system: "抗炎舒缓体系", func: "促进修复、舒缓刺激,质地温和", goodFor: ["barrier", "sensitive"] },
  { name: "甘草酸二钾/甘草根提取物 (Glycyrrhiza Glabra)", system: "抗炎舒缓体系", func: "抗炎兼具轻度美白效果", goodFor: ["barrier", "sensitive", "pigmentation"] },
  { name: "锦葵提取物 (Malva Sylvestris)", system: "抗炎舒缓体系", func: "植物来源舒缓成分,常用于敏感肌产品", goodFor: ["barrier", "sensitive"] },
  { name: "洋甘菊/矢车菊提取物 (Centaurium Erythraea)", system: "抗炎舒缓体系", func: "植物抗炎,常见于舒缓精华", goodFor: ["barrier", "sensitive", "rosacea"] },
  { name: "壬二酸 (Azelaic Acid)", system: "抗炎/抗痘体系", func: "抗炎抑菌,轻度调节角质,刺激性低", goodFor: ["barrier", "pseudo", "rosacea", "true_acne"] },

  // ---- 角质代谢/焕肤体系 ----
  { name: "水杨酸 (BHA)", system: "角质代谢体系", func: "亲脂性,疏通毛孔内堆积的角质和皮脂", goodFor: ["buildup", "true_acne"], riskyFor: ["barrier", "overexfoliate", "rosacea", "pseudo", "sensitive"] },
  { name: "果酸 (Glycolic/Lactic/Mandelic Acid)", system: "角质代谢体系", func: "促进表层角质脱落,改善暗沉粗糙", goodFor: ["buildup"], riskyFor: ["barrier", "rosacea"] },
  { name: "葡糖酸内酯 (Gluconolactone, PHA)", system: "角质代谢体系", func: "分子量大、渗透慢,焕肤效果温和,敏感肌也可尝试", goodFor: ["buildup", "sensitive"] },
  { name: "植酸 (Phytic Acid)", system: "角质代谢体系", func: "温和螯合+轻度焕肤,兼具抗氧化", goodFor: ["buildup", "pigmentation"] },

  // ---- 维A酸类/抗老活性体系 ----
  { name: "阿达帕林 (Adapalene)", system: "维A酸类体系", func: "调节角质代谢,减少粉刺形成", goodFor: ["true_acne"] },
  { name: "维A醇/维A酸 (Retinol/Tretinoin)", system: "维A酸类体系", func: "刺激胶原新生,加速角质代谢,起效强但刺激明显", goodFor: ["aging", "photodamage", "true_acne"], riskyFor: ["barrier", "rosacea", "sensitive"] },

  // ---- 肽类/修护体系 ----
  { name: "棕榈酰三肽-1 (Palmitoyl Tripeptide-1)", system: "肽类修护体系", func: "促进胶原蛋白合成,改善细纹", goodFor: ["aging", "photodamage"] },
  { name: "棕榈酰四肽-7 (Palmitoyl Tetrapeptide-7)", system: "肽类修护体系", func: "调节炎症反应,辅助抗老", goodFor: ["aging", "barrier"] },
  { name: "乙酰基六肽-8 (Acetyl Hexapeptide-8)", system: "肽类修护体系", func: "松弛类多肽,常用于表情纹改善", goodFor: ["aging"] },
  { name: "腺苷 (Adenosine)", system: "肽类/抗老体系", func: "促进细胞修复,改善细纹和松弛", goodFor: ["aging", "photodamage"] },

  // ---- 控油体系 ----
  { name: "锌PCA (Zinc PCA)", system: "控油体系", func: "调节皮脂分泌,兼具轻度抗菌", goodFor: ["oily"] },
  { name: "烟酰胺 (Niacinamide)", system: "控油/屏障强化体系", func: "促进神经酰胺合成、控油、抑制黑色素转移", goodFor: ["barrier", "oily", "pigmentation", "true_acne"] },
  { name: "咖啡因 (Caffeine)", system: "控油/循环体系", func: "收敛毛孔外观,促进微循环,常用于眼部和头皮", goodFor: ["oily", "circulation"] },

  // ---- 抗氧化体系 ----
  { name: "维生素C衍生物 (Ascorbyl Glucoside/Palmitate/3-O-Ethyl Ascorbic Acid)", system: "抗氧化体系", func: "中和自由基,抑制黑色素合成,比左旋VC稳定刺激低", goodFor: ["photodamage", "pigmentation", "antioxidant"] },
  { name: "阿魏酸 (Ferulic Acid)", system: "抗氧化体系", func: "增强维C稳定性,协同抗氧化", goodFor: ["photodamage", "antioxidant"] },
  { name: "咖啡酸 (Caffeic Acid)", system: "抗氧化体系", func: "多酚类抗氧化,常与阿魏酸复配", goodFor: ["photodamage", "antioxidant"] },
  { name: "生育酚/维E (Tocopherol/Tocopheryl Acetate)", system: "抗氧化体系", func: "经典脂溶性抗氧化剂,兼具轻度保湿", goodFor: ["photodamage", "barrier", "antioxidant"] },
  { name: "藻类提取物 (Algae Extract)", system: "抗氧化体系", func: "富含矿物质和多糖,兼具抗氧化和舒缓", goodFor: ["photodamage", "barrier", "antioxidant"] },
  { name: "蕨类提取物 (Polypodium Leucotomos)", system: "抗氧化体系", func: "口服/外用均有文献支持的光保护抗氧化成分", goodFor: ["photodamage", "antioxidant"] },

  // ---- 美白/淡斑体系 ----
  { name: "传明酸 (Tranexamic Acid)", system: "美白体系", func: "阻断黑色素细胞活化路径,改善色沉", goodFor: ["pigmentation"] },
  { name: "熊果苷/曲酸类", system: "美白体系", func: "抑制酪氨酸酶活性,减少黑色素生成", goodFor: ["pigmentation"] },

  // ---- 防晒体系 ----
  { name: "二氧化钛/氧化锌 (物理防晒剂)", system: "防晒体系(物理)", func: "物理防晒,阻断光损伤和色沉加重,敏感肌友好", goodFor: ["photodamage", "pigmentation", "rosacea"] },
  { name: "阿伏苯宗/奥克立林等 (化学防晒剂)", system: "防晒体系(化学)", func: "吸收紫外线转化为热能,肤感更轻薄但少数人可能刺激", goodFor: ["photodamage", "pigmentation"], riskyFor: ["sensitive"] },

  // ---- 抗真菌体系 ----
  { name: "酮康唑 (Ketoconazole)", system: "抗真菌体系", func: "抑制马拉色菌过度增殖", goodFor: ["fungal_acne", "seborrheic"] },
  { name: "锌吡硫酮 (Zinc Pyrithione)", system: "抗真菌体系", func: "兼具抗真菌和抗炎", goodFor: ["fungal_acne", "seborrheic"] },
  { name: "茶树精油 (Tea Tree Oil)", system: "抗真菌/抗菌体系", func: "天然抗菌抗真菌,需注意浓度", goodFor: ["fungal_acne", "true_acne"] },

  // ---- 抗菌体系 ----
  { name: "过氧化苯甲酰 (Benzoyl Peroxide)", system: "抗菌体系", func: "强抗菌,起效快但刺激性明显", goodFor: ["true_acne"], riskyFor: ["barrier", "sensitive", "rosacea"] },
  { name: "甲硝唑 (Metronidazole)", system: "抗炎/抗菌体系", func: "玫瑰痤疮一线外用抗炎抗菌", goodFor: ["rosacea"] },

  // ---- 发酵/微量元素活性体系(高端修护线常见) ----
  { name: "酵母提取物 (Faex/Yeast Extract)", system: "发酵活性体系", func: "富含氨基酸和维生素,辅助修护", goodFor: ["barrier"] },
  { name: "鞘氨醇单胞菌发酵提取物 (Sphingomonas Ferment Extract)", system: "发酵活性体系", func: "成膜锁水兼具舒缓,常见于高端修护精华", goodFor: ["barrier", "sensitive"] },
  { name: "微量元素复合物 (铜/锌/镁葡萄糖酸盐)", system: "微量元素体系", func: "辅助细胞代谢和修复,常见于奢华系列的\"活性精粹\"概念", goodFor: ["barrier", "aging"] },

  // ---- 风险类:溶剂、防腐、香精、感官刺激、着色剂 ----
  { name: "变性酒精 (Alcohol/Alcohol Denat.,高浓度)", system: "溶剂/收敛体系", func: "快速挥发、收敛控油,但会破坏屏障脂质", riskyFor: ["barrier", "rosacea", "overexfoliate", "sensitive", "compensatory", "pseudo"] },
  { name: "香精 (Parfum/Fragrance)", system: "防腐香精体系", func: "改善气味体验,但是最常见的致敏原之一", riskyFor: ["barrier", "sensitive", "rosacea"] },
  { name: "芳樟醇/柠檬烯/香叶醇等 (Linalool/Limonene/Geraniol)", system: "防腐香精体系", func: "天然存在或添加的常见致敏原,欧盟要求单独标注", riskyFor: ["sensitive", "barrier", "rosacea"] },
  { name: "薄荷醇/辣椒素等热感成分", system: "感官体系", func: "制造清凉/发热感,但会刺激血管扩张", riskyFor: ["rosacea", "barrier"] },
  { name: "着色剂 (CI 编号类,如 CI 14700/15985/19140)", system: "着色剂", func: "调整产品颜色,不参与功效,敏感肌偶见反应", riskyFor: ["sensitive"] },
  { name: "苯氧乙醇/氯苯甘醚等防腐剂 (Phenoxyethanol/Chlorphenesin)", system: "防腐体系", func: "广谱防腐,维持产品稳定性,常规浓度下大部分人耐受良好", goodFor: [] },
  { name: "1,2-己二醇/辛甘醇 (1,2-Hexanediol/Caprylyl Glycol)", system: "防腐体系", func: "多元醇类防腐增效剂,兼具保湿", goodFor: [] },
  { name: "苯甲酸钠/山梨酸钾 (Sodium Benzoate/Potassium Sorbate)", system: "防腐体系", func: "常见食品级防腐剂,广泛用于护肤品", goodFor: [] },

  // ---- 质地/流变调节剂(增稠、乳化、成膜——不参与功效判断,但配料表里占比很大) ----
  { name: "黄原胶 (Xanthan Gum)", system: "质地/基质成分", func: "天然增稠剂,稳定乳液质地", goodFor: [] },
  { name: "卡波姆 (Carbomer)", system: "质地/基质成分", func: "合成增稠剂,常用于凝胶质地", goodFor: [] },
  { name: "鲸蜡硬脂醇 (Cetearyl Alcohol)", system: "质地/基质成分", func: "脂肪醇类乳化稳定剂,兼具轻度润肤", goodFor: [] },
  { name: "聚丙烯酸酯类共聚物 (Acrylates Copolymer)", system: "质地/基质成分", func: "成膜剂,改善肤感和产品铺展性", goodFor: [] },
  { name: "聚山梨醇酯 (Polysorbate 20/60)", system: "质地/基质成分", func: "乳化剂,帮助油水两相混合", goodFor: [] },
  { name: "PEG类乳化剂 (PEG-100 Stearate 等)", system: "质地/基质成分", func: "乳化增稠,常见于面霜质地", goodFor: [] },
  { name: "羟乙基纤维素 (Hydroxyethylcellulose)", system: "质地/基质成分", func: "天然纤维素增稠剂", goodFor: [] },
  { name: "环聚二甲基硅氧烷类 (Cyclopentasiloxane 等)", system: "质地/基质成分(硅类)", func: "改善涂抹感,快速挥发不粘腻", goodFor: [] },
  { name: "异十二烷/异十六烷 (Isododecane/Isohexadecane)", system: "质地/基质成分", func: "轻质硅氧烷替代溶剂,肤感清爽", goodFor: [] },

  // ---- pH调节剂/螯合剂(功能性辅料) ----
  { name: "氢氧化钠/柠檬酸钠 (Sodium Hydroxide/Sodium Citrate)", system: "pH调节体系", func: "调节配方酸碱度,不直接作用于皮肤功效", goodFor: [] },
  { name: "依地酸二钠 (Disodium EDTA)", system: "螯合体系", func: "螯合金属离子,提升配方稳定性和防腐效果", goodFor: [] },

  // ---- 化学防晒滤剂(补充) ----
  { name: "依克舒安/双三嗪苯基蒽醌等新型滤剂 (Ethylhexyl Triazone/Drometrizole Trisiloxane)", system: "防晒体系(化学,新一代)", func: "广谱UVA/UVB防护,肤感较传统滤剂更轻薄", goodFor: ["photodamage", "pigmentation"] },
  { name: "水杨酸辛酯类 (Butyloctyl Salicylate)", system: "防晒体系(辅助)", func: "溶解其他防晒剂、辅助成膜,兼具轻微光稳定作用", goodFor: ["photodamage"] },

  // ---- 植物精粹/花水类(高端产品常见,多为香氛/舒缓复合功能) ----
  { name: "山茶花籽油/茶花提取物 (Camellia Japonica/Oleifera)", system: "植物精粹体系", func: "富含不饱和脂肪酸,滋润兼具抗氧化", goodFor: ["barrier", "photodamage"] },
  { name: "咖啡籽油 (Coffea Arabica Seed Oil)", system: "植物精粹体系", func: "富含绿原酸,兼具抗氧化和紧致观感", goodFor: ["photodamage", "circulation"] },
  { name: "玫瑰果油/玫瑰提取物 (Rosa Canina/Rose Extract)", system: "植物精粹体系", func: "舒缓兼具轻度抗氧化,常见于香氛型精华", goodFor: ["barrier"] },
  { name: "兰花提取物 (Orchid Extract)", system: "植物精粹体系", func: "高端产品常用的抗氧化/抗老概念成分", goodFor: ["aging"] },
  { name: "黑麦提取物 (Secale Cereale/Rye Seed Extract)", system: "植物精粹体系", func: "常用于屏障修护型精华的植物精粹", goodFor: ["barrier"] },
  { name: "秦艽/獐牙菜提取物 (Swertia Chirata)", system: "植物精粹体系", func: "传统舒缓类植物提取物", goodFor: ["sensitive"] },
  { name: "豨莶草提取物 (Sigesbeckia Orientalis)", system: "植物精粹体系", func: "抗炎类植物提取物,常见于玫瑰痤疮方向产品", goodFor: ["rosacea"] },
  { name: "香草果提取物 (Vanilla Planifolia)", system: "植物精粹体系", func: "主要提供香氛体验,兼具轻微舒缓概念", goodFor: [] },

  // ---- 着色剂/云母(纯外观,风险仅限极敏感人群) ----
  { name: "云母 (Mica)", system: "着色剂", func: "提供珠光质感,纯外观用途", goodFor: [] },
  { name: "氧化铁类着色剂 (Iron Oxides)", system: "着色剂", func: "调整产品或防晒霜色调,大部分人耐受良好", goodFor: [] },

  // ---- 其他常见功能性成分 ----
  { name: "精氨酸 (Arginine)", system: "pH调节/舒缓体系", func: "氨基酸类pH调节剂,兼具轻度舒缓作用", goodFor: ["sensitive"] },
  { name: "麦芽糖醇/木糖醇等糖醇类 (Maltitol/Xylitol)", system: "保湿体系", func: "糖醇类保湿剂,质地清爽", goodFor: ["compensatory"] },
  { name: "果寡糖 (Fructooligosaccharides)", system: "保湿/舒缓体系", func: "益生元类成分,辅助维持皮肤微生态平衡", goodFor: ["barrier", "sensitive"] },

  // ---- 发酵活性体系(补充,高端精华常见的"发酵滤液"概念) ----
  { name: "半乳糖酵母发酵滤液 (Galactomyces Ferment Filtrate/Pitera)", system: "发酵活性体系", func: "富含氨基酸、维生素、有机酸,常用于改善肤质均匀度和光泽感", goodFor: ["photodamage", "buildup"] },
  { name: "乳酸杆菌/大豆发酵提取物 (Lactobacillus/Soybean Ferment Extract)", system: "发酵活性体系", func: "发酵工艺生成的小分子活性物,辅助保湿和屏障支持", goodFor: ["barrier"] },
  { name: "酵母菌发酵产物 (Saccharomyces Ferment)", system: "发酵活性体系", func: "常与烟酰胺等复配,辅助控油和屏障调理", goodFor: ["barrier", "oily"] },

  // ---- 更多植物根茎/花卉精粹(高端及功能性产品常见) ----
  { name: "人参根提取物 (Panax Ginseng Root)", system: "植物精粹体系", func: "传统滋养类植物精粹,常用于抗老方向的复配", goodFor: ["aging"] },
  { name: "柴胡根提取物 (Bupleurum Falcatum Root)", system: "植物精粹体系", func: "东方草本配方中常见,舒缓类概念成分", goodFor: ["sensitive"] },
  { name: "当归根提取物 (Angelica Acutiloba Root)", system: "植物精粹体系", func: "传统草本活性物,常见于身体护理配方", goodFor: [] },
  { name: "麦冬根提取物 (Ophiopogon Japonicus Root)", system: "植物精粹体系", func: "东方草本保湿舒缓类成分", goodFor: ["sensitive"] },
  { name: "紫苏籽提取物 (Perilla Ocymoides Seed)", system: "植物精粹体系", func: "富含不饱和脂肪酸,常见于抗炎方向配方", goodFor: ["barrier", "sensitive"] },
  { name: "茉莉花提取物 (Jasminum Grandiflorum/Jasmine Flower)", system: "植物精粹体系", func: "主要提供香氛体验,兼具轻微舒缓概念", goodFor: [] },
  { name: "大麦茎水 (Hordeum Vulgare Stem Water)", system: "植物精粹体系", func: "有机认证产品常用的舒缓型植物水", goodFor: ["sensitive", "barrier"] },
  { name: "琉璃苣籽油 (Borago Officinalis Seed Oil)", system: "脂质体系", func: "富含γ-亚麻酸,滋润兼具舒缓屏障作用", goodFor: ["barrier", "sensitive"] },
  { name: "燕麦仁提取物 (Avena Sativa/Oat Kernel Extract)", system: "抗炎舒缓体系", func: "经典舒缓成分,敏感肌产品常用", goodFor: ["barrier", "sensitive"] },
  { name: "刺云实果提取物 (Caesalpinia Spinosa/Tara Fruit)", system: "质地/基质成分", func: "天然增稠剂来源,兼具轻度保湿", goodFor: [] },
  { name: "海茴香提取物 (Crithmum Maritimum/Sea Fennel)", system: "抗氧化体系", func: "耐盐植物提取物,含矿物质,兼具抗氧化", goodFor: ["photodamage"] },
  { name: "紫菜提取物 (Gigartina Stellata Extract)", system: "保湿体系", func: "海藻多糖类保湿成膜成分", goodFor: ["barrier"] },
  { name: "苦橙花提取物 (Citrus Aurantium Amara Flower)", system: "植物精粹体系", func: "主要提供香氛体验,传统芳疗类成分", goodFor: [] },
  { name: "大马士革玫瑰花水 (Rosa Damascena Flower Water)", system: "植物精粹体系", func: "舒缓保湿型花水,兼具香氛体验", goodFor: ["barrier"] },

  // ---- 清洁/表活体系(补充更多真实表活组合) ----
  { name: "月桂酰肌氨酸钠 (Sodium Lauroyl Sarcosinate)", system: "清洁体系", func: "温和氨基酸类表活,常见于高端洁面", goodFor: ["barrier", "sensitive"] },
  { name: "椰油酰胺丙基甜菜碱 (Cocamidopropyl Betaine)", system: "清洁体系", func: "两性表活,增加泡沫和温和度,少数人可能致敏", goodFor: [], riskyFor: ["sensitive"] },
  { name: "椰油酰胺MEA类 (Cocamide MEA/Cocamide Methyl MEA)", system: "清洁体系", func: "增稠起泡助剂,常见于洗护产品", goodFor: [] },
  { name: "C14-16烯烃磺酸钠 (Sodium C14-16 Olefin Sulfonate)", system: "清洁体系", func: "清洁力较强的表活,较硫酸盐温和", goodFor: [] },
  { name: "椰油两性基乙酸二钠 (Disodium Cocoamphodiacetate)", system: "清洁体系", func: "温和两性表活,常与主表活复配降低刺激", goodFor: ["sensitive"] },

  // ---- 防腐体系(补充,尤其是老一代防腐剂,部分人群需留意) ----
  { name: "尼泊金酯类防腐剂 (Methyl/Propyl/Butyl/Ethylparaben)", system: "防腐体系", func: "传统广谱防腐剂,大部分人耐受良好,极少数人可能致敏", goodFor: [], riskyFor: ["sensitive"] },
  { name: "咪唑烷基脲 (Imidazolidinyl Urea)", system: "防腐体系", func: "释放甲醛类防腐剂,部分敏感肌人群需留意", riskyFor: ["sensitive", "barrier"] },
  { name: "三乙醇胺 (Triethanolamine)", system: "pH调节体系", func: "调节配方酸碱度,部分产品会标注不含以降低刺激性", riskyFor: ["sensitive"] },
  { name: "邻苯基苯酚类防腐剂 (O-Cymen-5-ol)", system: "防腐体系", func: "抗菌防腐剂,常见于身体护理配方", goodFor: [] },
  { name: "苯甲酸 (Benzoic Acid)", system: "防腐体系", func: "天然存在及合成防腐剂,常与苯甲酸钠复配", goodFor: [] },

  // ---- 抗氧化/美白体系(补充) ----
  { name: "黑色素 (Melanin,配方用)", system: "抗氧化体系", func: "Heliocare等品牌用于光防护配方的天然色素类抗氧化成分", goodFor: ["photodamage"] },
  { name: "抗坏血酸棕榈酸酯类 (Ascorbyl Dipalmitate)", system: "抗氧化体系", func: "脂溶性维C衍生物,更稳定但活性略低于纯维C", goodFor: ["photodamage"] },
  { name: "羟基苯乙酮 (Hydroxyacetophenone)", system: "抗氧化/防腐增效体系", func: "兼具抗氧化和防腐增效作用,常见于无防腐配方替代方案", goodFor: [] },

  // ---- 防晒体系(补充新型滤剂) ----
  { name: "三联苯三嗪类滤剂 (Tris-Biphenyl Triazine)", system: "防晒体系(化学,新一代)", func: "广谱UVA防护,常见于欧系高端防晒配方", goodFor: ["photodamage"] },
  { name: "二乙氨羟苯甲酰基苯甲酸己酯 (Uvinul A Plus)", system: "防晒体系(化学)", func: "长波UVA防护滤剂,光稳定性较好", goodFor: ["photodamage"] },

  // ---- 控油/毛孔调理体系(补充) ----
  { name: "胭脂树籽提取物 (Roucou/Bixa Orellana Seed)", system: "控油体系", func: "调节皮脂分泌,兼具轻度收敛毛孔外观", goodFor: ["oily"] },
  { name: "膨润土/高岭土 (Bentonite/Kaolin Clay)", system: "控油体系", func: "吸附多余油脂,常见于泥膜类产品", goodFor: ["oily"] },

  // ---- 质地/基质成分(大批量补充,真实配方里占比最高的部分) ----
  { name: "鲸蜡硬脂醇葡糖苷 (Cetearyl Glucoside)", system: "质地/基质成分", func: "天然来源乳化剂", goodFor: [] },
  { name: "硬脂酸甘油酯 (Glyceryl Stearate)", system: "质地/基质成分", func: "乳化增稠,常见基础乳化剂", goodFor: [] },
  { name: "山嵛醇聚醚-25 (Beheneth-25)", system: "质地/基质成分", func: "乳化剂,常与硬脂酸复配", goodFor: [] },
  { name: "蔗糖硬脂酸酯/月桂酸酯 (Sucrose Laurate/Palmitate)", system: "质地/基质成分", func: "糖酯类温和乳化剂", goodFor: [] },
  { name: "聚二甲基硅氧烷醇 (Dimethiconol)", system: "质地/基质成分(硅类)", func: "改善肤感和铺展性", goodFor: [] },
  { name: "尼龙-12 (Nylon-12)", system: "质地/基质成分", func: "哑光粉体,改善肤感、吸油", goodFor: [] },
  { name: "甲基丙烯酸甲酯交联聚合物 (Methyl Methacrylate Crosspolymer)", system: "质地/基质成分", func: "光学模糊粉体,常用于妆前/防晒配方改善毛孔视觉", goodFor: [] },
  { name: "氢氧化铝 (Aluminum Hydroxide)", system: "质地/基质成分", func: "防晒剂分散助剂", goodFor: [] },
  { name: "二硬脂基氢化牛脂基氯化铵蒙脱土 (Disteardimonium Hectorite)", system: "质地/基质成分", func: "增稠悬浮剂,常用于防晒/彩妆", goodFor: [] },
  { name: "硫酸镁 (Magnesium Sulfate)", system: "质地/基质成分", func: "电解质类增稠辅助剂", goodFor: [] },
  { name: "罗望子籽胶 (Tamarindus Indica Seed Gum)", system: "质地/基质成分", func: "天然增稠成膜剂", goodFor: [] },
  { name: "生物多糖胶-1 (Biosaccharide Gum-1)", system: "保湿/舒缓体系", func: "发酵来源多糖,兼具保湿和舒缓", goodFor: ["barrier", "sensitive"] },
  { name: "聚甘油-10月桂酸酯/二异硬脂酸酯 (Polyglyceryl-10 Laurate/Diisostearate)", system: "质地/基质成分", func: "多元醇类乳化剂,肤感轻盈", goodFor: [] },
  { name: "羟丙基双棕榈酰胺MEA (Hydroxypropyl Bispalmitamide MEA)", system: "质地/基质成分", func: "增稠稳定剂,常见于韩系洗护配方", goodFor: [] },
  { name: "丙烯酸(酯)类共聚物 (Acrylates/C10-30 Alkyl Acrylate Crosspolymer)", system: "质地/基质成分", func: "增稠成胶剂,广泛用于精华和凝胶质地", goodFor: [] },
  { name: "聚季铵盐-51 (Polyquaternium-51)", system: "质地/基质成分", func: "调理型成膜剂,改善肤感", goodFor: [] },
  { name: "乙基己基棕榈酸酯 (Ethylhexyl Palmitate)", system: "脂质体系", func: "轻质酯类润肤剂,肤感清爽", goodFor: ["barrier"] },
  { name: "辛基十二醇 (Octyldodecanol)", system: "脂质体系", func: "润肤剂兼溶剂,常用于精华质地", goodFor: [] },

  // ---- 糖类/多元醇保湿体系(补充) ----
  { name: "麦芽糊精 (Maltodextrin)", system: "保湿/质地体系", func: "多糖类保湿剂,兼具增稠作用", goodFor: [] },
  { name: "木糖基葡糖苷/无水木糖醇 (Xylitylglucoside/Anhydroxylitol)", system: "保湿体系", func: "糖类保湿复合物,常与木糖醇复配增强保水", goodFor: ["compensatory"] },
  { name: "糖类等排物 (Saccharide Isomerate)", system: "保湿体系", func: "仿生型保湿糖类,长效锁水", goodFor: ["barrier", "compensatory"] },
  { name: "甘露醇 (Mannitol)", system: "保湿/抗氧化体系", func: "糖醇类保湿剂,兼具自由基清除能力", goodFor: ["compensatory"] },

  // ---- 着色剂/其他外观类(补充) ----
  { name: "焦糖 (Caramel)", system: "着色剂", func: "天然来源着色剂,纯外观用途", goodFor: [] },
  { name: "氧化锡 (Tin Oxide)", system: "着色剂/质地成分", func: "调节珠光质感,常见于高端乳霜", goodFor: [] },

  // ---- 品牌复合活性物(带营销故事但机制描述模糊,标注为中性参考) ----
  { name: "多重复合活性物 (如品牌专利的\"XX因子\"复合体系)", system: "品牌复合活性体系", func: "品牌自研的多成分复合概念,通常由已知活性物(肽类/发酵物/植物精粹等)组合而成,建议拆解到具体成分判断而非直接采信宣传功效", goodFor: [] },

  // ---- 硅类/挥发性溶剂扩展 ----
  { name: "环五聚二甲基硅氧烷 (Cyclopentasiloxane)", system: "质地/基质成分(硅类)", func: "挥发性硅油,改善涂抹感和延展性", goodFor: [] },
  { name: "苯基三甲基硅氧烷 (Phenyl Trimethicone)", system: "质地/基质成分(硅类)", func: "改善光泽感和顺滑度,常见于精华质地", goodFor: [] },
  { name: "十二烷基苯甲酸酯 (C12-15 Alkyl Benzoate)", system: "质地/基质成分", func: "轻质酯类溶剂,常用于防晒和精华配方", goodFor: [] },
  { name: "碳酸二辛酯 (Dicaprylyl Carbonate)", system: "质地/基质成分", func: "轻盈润肤剂,肤感清爽不粘腻", goodFor: [] },
  { name: "异壬酸异壬酯 (Isononyl Isononanoate)", system: "脂质体系", func: "轻质酯类润肤剂", goodFor: [] },

  // ---- 氨基酸类活性成分(补充) ----
  { name: "丝氨酸 (Serine)", system: "保湿体系", func: "氨基酸类天然保湿因子成分", goodFor: ["barrier"] },
  { name: "甜菜碱 (Betaine)", system: "保湿体系", func: "氨基酸衍生保湿剂,兼具轻度舒缓", goodFor: ["barrier", "sensitive"] },
  { name: "水解DNA/水解大豆蛋白 (Hydrolyzed DNA/Soy Protein)", system: "保湿/修护体系", func: "小分子蛋白质衍生物,辅助保湿和屏障支持概念成分", goodFor: ["barrier"] },

  // ---- 防晒辅助/光稳定剂扩展 ----
  { name: "水杨酸辛酯 (Butyloctyl Salicylate,防晒辅助)", system: "防晒体系(辅助)", func: "溶解并稳定其他防晒剂,兼具轻微光稳定作用", goodFor: ["photodamage"] },
  { name: "聚硅氧烷-15 (Polysilicone-15)", system: "防晒体系(辅助)", func: "成膜性防晒增效剂,提升防水抗汗能力", goodFor: [] },

  // ---- 螯合剂/稳定剂扩展 ----
  { name: "三乙烯二胺二琥珀酸三钠 (Trisodium Ethylenediamine Disuccinate)", system: "螯合体系", func: "环境友好型螯合剂,提升配方稳定性", goodFor: [] },
  { name: "植酸/植酸盐类", system: "螯合/焕肤体系", func: "螯合金属离子兼具温和焕肤作用", goodFor: ["buildup", "pigmentation"] },

  // ---- 身体护理常见成分(沐浴露/身体乳类配方) ----
  { name: "椰油基葡糖苷 (Coco-Glucoside)", system: "清洁体系", func: "温和糖苷类表活,常见于身体沐浴配方", goodFor: ["barrier"] },
  { name: "羟乙基纤维素 (Hydroxyethylcellulose,身体护理)", system: "质地/基质成分", func: "增稠剂,常见于沐浴露质地调整", goodFor: [] },
  { name: "椰油酸聚乙二醇甘油酯 (PEG-7 Glyceryl Cocoate)", system: "清洁体系", func: "温和乳化增泡剂", goodFor: [] },
  { name: "硫酸锌/硫酸铜 (Zinc/Copper Sulfate)", system: "微量元素体系", func: "微量元素补充,常见于身体调理类配方", goodFor: ["barrier"] },
];

function getSuitability(candidateKey) {
  const good = INGREDIENT_LIBRARY.filter((i) => i.goodFor && i.goodFor.includes(candidateKey));
  const risky = INGREDIENT_LIBRARY.filter((i) => i.riskyFor && i.riskyFor.includes(candidateKey));
  if (good.length === 0 && risky.length === 0) return null;
  return { good, risky };
}

/* 合并所有已选症状的适合/风险成分,而不是只看第一个症状——
   同一个成分在不同症状的诊断结论下可能一边是"适合"一边是"风险",这种情况单独归到conflicting,
   而不是简单去重掩盖掉这个矛盾 */
function mergeSuitability(results) {
  const goodMap = {};
  const riskyMap = {};
  results.forEach((r) => {
    const su = getSuitability(r.top.key);
    if (!su) return;
    su.good.forEach((g) => {
      if (!goodMap[g.name]) goodMap[g.name] = g;
    });
    su.risky.forEach((x) => {
      if (!riskyMap[x.name]) riskyMap[x.name] = x;
    });
  });
  const conflicting = Object.keys(goodMap)
    .filter((n) => riskyMap[n])
    .map((n) => ({ ...goodMap[n], riskyFunc: riskyMap[n].func }));
  const conflictNames = new Set(conflicting.map((c) => c.name));
  const good = Object.values(goodMap).filter((g) => !conflictNames.has(g.name));
  const risky = Object.values(riskyMap).filter((r) => !conflictNames.has(r.name));
  return { good, risky, conflicting };
}

/* 用真实成分库分析一份(模拟的)已上传产品配料表——按成分在配料表中的位置估算权重,
   命中风险成分且排位靠前 → risk;命中风险成分但排位靠后(估计浓度低) → mild;命中适合成分 → good */
function buildUploadedAnalysis(product, suitability) {
  if (!suitability) return [];
  const recognized = product.ingredients.map((ing, idx) => {
    const conflict = suitability.conflicting.find((c) => ingredientMatches(ing, c.name));
    if (conflict) {
      return {
        name: ing,
        position: `第 ${idx + 1} 位`,
        status: "mild",
        note: `${conflict.func}——但它对你选择的不同症状存在方向冲突，需要结合报告判断。`,
      };
    }
    const good = suitability.good.find((g) => ingredientMatches(ing, g.name));
    if (good) {
      return { name: ing, position: `第 ${idx + 1} 位`, status: "good", note: good.func };
    }
    const risky = suitability.risky.find((r) => ingredientMatches(ing, r.name));
    if (risky) {
      const late = idx >= 8;
      return {
        name: ing,
        position: `第 ${idx + 1} 位`,
        status: late ? "mild" : "risk",
        note: late ? `${risky.func}（排位靠后，风险权重相应调低）` : risky.func,
      };
    }
    const reference = INGREDIENT_LIBRARY.find((item) => ingredientMatches(ing, item.name));
    return {
      name: ing,
      position: `第 ${idx + 1} 位`,
      status: "neutral",
      note: reference ? `${reference.system}：${reference.func}。当前诊断下不参与加减分。` : "已记录，但当前规则库没有把它列为适合或风险证据。",
    };
  });

  const unknown = (product.unknownIngredients || []).map((ingredient, index) => ({
    name: ingredient,
    position: `未标准化 ${index + 1}`,
    status: "unknown",
    note: "OCR 已读取这段文字，但暂时无法映射到标准成分名，因此不参与评分。",
  }));
  return [...recognized, ...unknown];
}

function groupBySystem(items) {
  const map = {};
  items.forEach((it) => {
    if (!map[it.system]) map[it.system] = [];
    map[it.system].push(it);
  });
  return Object.entries(map).map(([system, list]) => ({ system, items: list }));
}

/* ============================================================
   三入口共享数据层
   快速选择只负责把用户选择映射到已有 candidateKey,
   不新增一套诊断逻辑。
   ============================================================ */

const QUICK_INGREDIENT_OPTIONS = [
  { key: "barrier", label: "屏障修复", sub: "泛红 / 紧绷 / 刺痛后的修护方向" },
  { key: "sensitive", label: "敏感肌", sub: "减少刺激,优先温和体系" },
  { key: "rosacea", label: "泛红·玫瑰痤疮倾向", sub: "避免把所有泛红都当成缺水" },
  { key: "true_acne", label: "爆痘·痤疮", sub: "控痘与角质代谢方向" },
  { key: "fungal_acne", label: "毛囊炎/真菌痘倾向", sub: "抗真菌方向,避免盲目叠加祛痘活性" },
  { key: "buildup", label: "暗沉·角质堆积", sub: "焕肤与角质代谢方向" },
  { key: "pigmentation", label: "暗沉·色素沉着", sub: "淡斑与色素路径" },
  { key: "oily", label: "油脂型毛孔", sub: "皮脂与毛孔外观管理" },
  { key: "compensatory", label: "缺水代偿型毛孔", sub: "补水与屏障优先" },
  { key: "aging", label: "抗老·松弛", sub: "胶原、细纹与光老化方向" },
  { key: "antioxidant", label: "抗氧化·日常预防", sub: "与“修复已经发生的光损伤”区分开" },
];

const QUICK_RECOMMEND_OPTIONS = [
  { key: "dry", label: "干性肤质", sub: "以屏障 + 缺水代偿方向综合匹配", keys: ["barrier", "compensatory"] },
  { key: "oily", label: "油性肤质", sub: "以油脂 + 角质/痤疮方向综合匹配", keys: ["oily", "buildup"] },
  { key: "sensitive", label: "敏感肤质", sub: "以敏感 + 屏障方向综合匹配", keys: ["sensitive", "barrier"] },
  { key: "redness", label: "泛红", sub: "优先温和、舒缓、低刺激体系", keys: ["rosacea", "sensitive"] },
  { key: "acne", label: "爆痘", sub: "按痤疮/角质方向匹配", keys: ["true_acne", "buildup"] },
  { key: "dullness", label: "暗沉", sub: "区分色沉、角质堆积与光损伤", keys: ["pigmentation", "buildup", "photodamage"] },
  { key: "pores", label: "毛孔/黑头", sub: "油脂、角质、缺水与衰老方向综合匹配", keys: ["oily", "buildup", "compensatory", "aging"] },
  { key: "aging", label: "抗老", sub: "胶原、细纹、光老化相关方向", keys: ["aging", "photodamage"] },
];

function mergeSuitabilityKeys(keys) {
  const results = keys.map((key) => ({ top: { key } }));
  return mergeSuitability(results);
}

/* ============================================================ */

function acneMorphology(answers) {
  if (answers.inflamed === "no") return "comedone";
  if (answers.depth === "shallow" && answers.pus === "no") return "papule";
  if (answers.depth === "shallow" && answers.pus === "yes") return "pustule";
  if (answers.depth === "deep" && answers.pus === "no") return "nodule";
  if (answers.depth === "deep" && answers.pus === "yes") return "cyst";
  return null;
}

function contentKeyLabel(symptom, answers) {
  if (symptom !== "acne") return null;
  const m = acneMorphology(answers);
  if (m === "nodule") return "结节型";
  if (m === "cyst") return "囊肿型";
  if (m === "pustule") return "脓疱型";
  return null;
}

/* ============================================================
   UI 基础组件
   ============================================================ */

function Eyebrow({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: TEAL, textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

const PROFILE_STAGES = ["肤质", "基础信息", "安全筛查", "问题问诊"];

function JourneyProgress({ stage }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
        {PROFILE_STAGES.map((label, index) => {
          const complete = index < stage;
          const active = index === stage;
          return (
            <div
              key={label}
              aria-label={`${label}${complete ? "已完成" : active ? "进行中" : "未开始"}`}
              style={{
                height: 5,
                borderRadius: 4,
                background: complete || active ? TEAL : LINE,
                opacity: active ? 0.72 : 1,
                transition: "background 300ms ease",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: TEAL }}>
          {stage + 1}/4 · {PROFILE_STAGES[stage]}
        </span>
        <span style={{ fontSize: 10.5, color: MUTE }}>每完成一阶段，点亮一格</span>
      </div>
    </div>
  );
}

function OptionCard({ label, sub, selected, onClick, dim }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left",
        padding: "16px 18px", borderRadius: 10, border: `1px solid ${selected ? TEAL : LINE}`,
        background: selected ? TEAL_SOFT : "#fff", cursor: dim ? "default" : "pointer", marginBottom: 10,
        transition: "all 150ms ease", opacity: dim ? 0.45 : 1,
      }}
    >
      <div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, fontWeight: 500, color: INK }}>{label}</div>
        {sub && <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: MUTE, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${selected ? TEAL : "#C7C2B8"}`, background: selected ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "14px 20px",
        borderRadius: 10, border: "none", background: disabled ? "#DEDAD0" : INK, color: disabled ? "#A8A296" : PAPER,
        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14.5, fontWeight: 500, cursor: disabled ? "default" : "pointer",
        marginTop: 8, transition: "background 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

function TextButton({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: MUTE, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
      {children}
    </button>
  );
}

function ConfidenceBar({ label, pct, tone }) {
  const color = tone === "primary" ? TEAL : "#C7C2B8";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, marginBottom: 6 }}>
        <span style={{ color: INK, fontWeight: tone === "primary" ? 600 : 400 }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: tone === "primary" ? TEAL : MUTE }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#EFEDE7", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function EvidenceList({ evidence }) {
  const { supporting, contradicting, missing, risk, confidence } = evidence;
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", background: "#fff", marginBottom: 20 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.08em", color: MUTE, textTransform: "uppercase", marginBottom: 10 }}>
        证据拆解 · Confidence Engine
      </div>
      <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, marginBottom: 10 }}>
        基础 {confidence.baseScore} + 支持 {confidence.supportingContribution} {confidence.contradictingContribution < 0 ? `− 矛盾 ${Math.abs(confidence.contradictingContribution)}` : ""} {confidence.uncertaintyPenalty < 0 ? `− 不确定 ${Math.abs(confidence.uncertaintyPenalty)}` : ""} = {confidence.score}%（{confidence.level === "high" ? "高" : confidence.level === "moderate" ? "中" : "低"}）
      </div>
      {supporting.map((m, i) => (
        <div key={"m" + i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Check size={13} color={TEAL} strokeWidth={3} />
          <span style={{ fontSize: 12.5, color: "#2E4E48" }}>{m}</span>
        </div>
      ))}
      {contradicting.map((m, i) => (
        <div key={"c" + i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <X size={13} color={RUST} strokeWidth={3} />
          <span style={{ fontSize: 12.5, color: "#7A3D2C" }}>矛盾信号:{m}</span>
        </div>
      ))}
      {missing.map((m, i) => (
        <div key={"x" + i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <X size={13} color="#B7B2A6" strokeWidth={3} />
          <span style={{ fontSize: 12.5, color: MUTE }}>未观察到:{m}</span>
        </div>
      ))}
      {risk.map((m, i) => (
        <div key={"r" + i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <AlertTriangle size={13} color={AMBER} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12.5, color: "#6B5527", lineHeight: 1.5 }}>风险信号:{m}</span>
        </div>
      ))}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "#fff", border: `1px solid ${LINE}`, color: "#5C574D" }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: MUTE, textTransform: "uppercase", marginBottom: 10, marginTop: 4, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
      {children}
    </div>
  );
}

function BodyText({ children }) {
  return <p style={{ fontSize: 13.5, color: "#3D3A34", lineHeight: 1.75, marginBottom: 18, marginTop: 0 }}>{children}</p>;
}

function DrugRow({ tier, name, note }) {
  const isMild = tier.includes("温和");
  const tierColor = isMild ? TEAL : RUST;
  const tierBg = isMild ? TEAL_SOFT : "#FBF0EC";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "3px 8px", borderRadius: 5, background: tierBg, color: tierColor, flexShrink: 0, marginTop: 2, whiteSpace: "nowrap" }}>
        {tier}
      </span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{name}</div>
        <div style={{ fontSize: 12, color: MUTE, marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
}

function IngredientRow({ name, position, status, note }) {
  const cfg = {
    risk: { color: RUST, bg: "#FBF0EC", label: "冲突" },
    good: { color: TEAL, bg: TEAL_SOFT, label: "一致" },
    mild: { color: AMBER, bg: AMBER_SOFT, label: "低权重" },
    neutral: { color: "#676156", bg: "#F1EFEA", label: "中性" },
    unknown: { color: "#756F64", bg: "#F6F4EF", label: "未识别" },
  }[status];
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{name}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: MUTE, marginLeft: 8 }}>{position}</span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "3px 8px", borderRadius: 5, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
          {cfg.label}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5C574D", lineHeight: 1.6, margin: 0 }}>{note}</p>
    </div>
  );
}

function ProductRecommendationCard({ product, index }) {
  const confidenceLabel = { high: "高", medium: "中", low: "低" }[product.confidence];
  const scoreColor = product.score === null ? MUTE : index === 0 ? TEAL : INK;
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "15px 16px", marginBottom: 12, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 9 }}>
        <div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: MUTE, marginRight: 8 }}>#{index + 1}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{product.brand} · {product.name}</span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: product.score === null ? 10.5 : 15, color: scoreColor, fontWeight: 600, whiteSpace: "nowrap" }}>
          {product.score === null ? "证据不足" : `${product.score} 分`}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Tag>{product.category}</Tag>
          <Tag>{product.ingredientListType === "full" ? "完整配方" : "部分配方"}</Tag>
        </div>
        <a href={product.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: TEAL, fontSize: 11.5, textDecoration: "none", whiteSpace: "nowrap" }}>
          数据来源 <ExternalLink size={11} />
        </a>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTE, marginBottom: 5 }}>
          <span>数据完整度 {product.dataCompleteness}%</span>
          <span>可信度：{confidenceLabel} · 有效证据 {product.evidenceCount} 条</span>
        </div>
        <div style={{ height: 5, background: LINE, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${product.dataCompleteness}%`, background: product.dataCompleteness >= 85 ? TEAL : AMBER }} />
        </div>
      </div>

      {product.positiveEvidence.map((evidence) => (
        <div key={`good-${evidence.name}`} style={{ fontSize: 12, color: "#2E4E48", marginBottom: 4 }}>
          +{evidence.points} · {evidence.name}（配料第 {evidence.ingredientPosition} 位）
        </div>
      ))}
      {product.negativeEvidence.map((evidence) => (
        <div key={`risk-${evidence.name}`} style={{ fontSize: 12, color: "#7A3D2C", marginBottom: 4 }}>
          {evidence.points} · {evidence.name}（配料第 {evidence.ingredientPosition} 位）
        </div>
      ))}
      {product.conflictingEvidence.map((name) => (
        <div key={`conflict-${name}`} style={{ fontSize: 12, color: "#6B5527", marginBottom: 4 }}>
          方向冲突 · {name}：不同症状下适用性相反，不计入分数
        </div>
      ))}
      {!product.recommendationAvailable && (
        <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.55 }}>
          当前配方数据或相关证据不足，因此不生成精确推荐分数，也不会把它当作首选。
        </div>
      )}
    </div>
  );
}

/* ============================================================
   主应用
   ============================================================ */

const SKIN_QUESTIONS = [
  {
    key: "wash",
    q: "洗完脸不涂任何东西,1小时后T区和两颊分别是什么状态?",
    options: [
      { v: "combo", l: "T区出油,两颊偏干或正常", sub: "混合性" },
      { v: "oily", l: "整脸都出油", sub: "油性" },
      { v: "dry", l: "整脸紧绷、有点起皮", sub: "干性" },
      { v: "normal", l: "比较舒适,没什么明显感觉", sub: "中性" },
    ],
  },
  {
    key: "sensitive",
    q: "换新产品时,皮肤容易泛红刺痛,还是基本没什么反应?",
    options: [
      { v: "yes", l: "比较容易有反应", sub: "敏感叠加" },
      { v: "no", l: "基本没什么反应", sub: "非敏感" },
    ],
  },
];

const PROFILE_QUESTIONS = [
  {
    key: "age",
    q: "你的年龄段是?",
    hint: "年龄会影响诊断权重——同样症状在不同年龄段更可能对应的病因不一样",
    options: [
      { v: "u18", l: "18岁以下" },
      { v: "18-30", l: "18-30岁" },
      { v: "30-45", l: "30-45岁" },
      { v: "45+", l: "45岁以上" },
    ],
  },
  {
    key: "gender",
    q: "性别",
    hint: "用于判断部分周期性/激素相关问题是否适用,以及用药建议的安全边界",
    options: [
      { v: "female", l: "女" },
      { v: "male", l: "男" },
    ],
  },
  {
    key: "pregnancy",
    q: "目前有没有怀孕或哺乳?",
    hint: "这一步是用药建议前的安全检查,不影响病因诊断本身",
    skipIf: (a) => a.gender !== "female",
    options: [
      { v: "yes", l: "是,目前怀孕或哺乳期" },
      { v: "no", l: "没有" },
    ],
  },
];

const PREGNANCY_UNSAFE_KEYWORDS = ["异维A酸", "维A酸", "阿达帕林", "水杨酸", "氢醌", "螺内酯", "避孕药", "四环素", "糖皮质激素"];

const RED_FLAGS = [
  {
    v: "psoriasis",
    l: "边界清楚的红斑,上面覆盖较厚的银白色鳞屑,撕掉鳞屑容易点状出血",
    condition: "银屑病",
    note: "属于需要系统性皮肤科管理的慢性病,鳞屑厚度和点状出血是和普通干燥脱皮最大的区别。",
  },
  {
    v: "vitiligo",
    l: "有边界清楚的色素完全脱失斑(不是变浅,是完全变白)",
    condition: "白癜风",
    note: "和色沉、晒斑的方向相反,容易被误判成\"美白过度\",不属于护肤品能干预的范畴。",
  },
  {
    v: "herpes",
    l: "成簇的小水疱,伴刺痛或灼烧感",
    condition: "疱疹类病毒感染",
    note: "病毒感染,和痤疮/接触性皮炎的水疱表现需要鉴别,不适合按护肤流程处理。",
  },
  {
    v: "urticaria",
    l: "风团样红斑,通常24小时内自行消退,但此起彼伏反复出现",
    condition: "荨麻疹",
    note: "起消速度是关键特征,和接触性皮炎、普通泛红的病程明显不同。",
  },
  {
    v: "actinic",
    l: "长期日晒部位(面部/手背)出现粗糙鳞屑性斑块,摸起来像砂纸",
    condition: "日光性角化病",
    note: "属于癌前病变,检测到疑似特征应立即建议就医,而不是继续走护肤建议路径。",
  },
  { v: "none", l: "都没有以上情况", condition: null, note: null },
];

const CANDIDATE_FAMILY = {
  // redness
  barrier: "屏障受损",
  overexfoliate: "屏障受损",
  rosacea: "血管性(玫瑰痤疮倾向)",
  sensitive: "敏感体质",
  seborrheic: "脂溢性/真菌相关",
  // acne
  pseudo: "屏障受损",
  true_acne: "炎症性痤疮",
  product_induced: "外源刺激诱发",
  fungal_acne: "脂溢性/真菌相关",
  // dullness
  buildup: "角质堆积",
  pigmentation: "色素沉着",
  circulation: "生活方式/微循环",
  photodamage: "光老化",
  // pores
  oily: "皮脂旺盛",
  compensatory: "屏障受损",
  aging: "光老化",
};

function App() {
  const [screen, setScreen] = useState("intro");
  const [skinAnswers, setSkinAnswers] = useState({});
  const [skinStep, setSkinStep] = useState(0);
  const [profileAnswers, setProfileAnswers] = useState({});
  const [profileStep, setProfileStep] = useState(0);
  const [redFlag, setRedFlag] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomIndex, setSymptomIndex] = useState(0);
  const [qStep, setQStep] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [multiSelMap, setMultiSelMap] = useState({});
  const [multiDraft, setMultiDraft] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [uploadedProduct, setUploadedProduct] = useState(null);
  const [uploadedParseResult, setUploadedParseResult] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [ingredientPhotoFile, setIngredientPhotoFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [quickCandidateKey, setQuickCandidateKey] = useState(null);
  const [quickRecommendKey, setQuickRecommendKey] = useState(null);
  const [history, setHistory] = useState(["intro"]);
  const [sharedProducts, setSharedProducts] = useState([]);
  const [sharedCatalogStatus, setSharedCatalogStatus] = useState("loading");
  const photoInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadSharedProductCatalog()
      .then((records) => {
        if (!active) return;
        setSharedProducts(records);
        setSharedCatalogStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setSharedCatalogStatus("offline");
      });
    return () => { active = false; };
  }, []);

  const productCatalog = useMemo(() => {
    const sharedKeys = new Set(sharedProducts.map((item) => `${item.brand}|${item.name}`.toLowerCase()));
    const offlineFallback = PRODUCT_CATALOG.filter(
      (item) => !sharedKeys.has(`${item.brand}|${item.name}`.toLowerCase()),
    );
    return [...sharedProducts, ...offlineFallback];
  }, [sharedProducts]);

  function goTo(nextScreen) {
    setHistory((h) => [...h, nextScreen]);
    setScreen(nextScreen);
  }

  function goBack() {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const next = h.slice(0, -1);
      setScreen(next[next.length - 1]);
      return next;
    });
  }

  function resetAll() {
    setScreen("intro");
    setHistory(["intro"]);
    setSkinAnswers({});
    setSkinStep(0);
    setProfileAnswers({});
    setProfileStep(0);
    setRedFlag(null);
    setSelectedSymptoms([]);
    setSymptomIndex(0);
    setQStep(0);
    setAnswersMap({});
    setMultiSelMap({});
    setMultiDraft([]);
    setSelectedUploadId(null);
    setUploadedProduct(null);
    setUploadedParseResult(null);
    setPhotoPreview("");
    setIngredientPhotoFile(null);
    setOcrText("");
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrError("");
    setQuickCandidateKey(null);
    setQuickRecommendKey(null);
  }

  async function handleIngredientPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIngredientPhotoFile(file);

    setUploadedProduct(null);
    setUploadedParseResult(null);
    setSelectedUploadId(null);
    setOcrText("");
    setOcrError("");
    setOcrProgress(0);
    setOcrStatus("reading");

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrProgress(Math.round((message.progress || 0) * 100));
          }
        },
      });
      const result = await worker.recognize(file);
      await worker.terminate();
      setOcrText(result.data.text.trim());
      setOcrStatus("done");
      if (!result.data.text.trim()) {
        setOcrError("没有识别到文字，请换一张更清晰、正对配料表的照片，或在下方手动粘贴成分。 ");
      }
    } catch (error) {
      setOcrStatus("error");
      setOcrError("图片已保留，但本次 OCR 识别失败。你仍可以在下方手动粘贴或校对配料表。 ");
    }
  }

  function confirmScannedIngredients() {
    const parsed = parseIngredientDetails(ocrText, INGREDIENT_LIBRARY);
    if (parsed.recognized.length === 0) {
      setOcrError("暂时没有匹配到成分库中的标准成分名。请检查识别文字，或用英文 INCI 名称补充后再分析。 ");
      return;
    }
    setUploadedParseResult(parsed);
    setUploadedProduct({
      id: "camera-upload",
      brand: "我的产品",
      name: "拍照识别的配料表",
      category: "自定义",
      ingredients: parsed.recognized.map((item) => item.canonicalName),
      unknownIngredients: parsed.unknown.map((item) => item.raw),
      dataCompleteness: parsed.coverage,
      ingredientListType: "partial",
    });
    setOcrError("");
    goTo("ingredient");
  }

  function backSkin() {
    if (skinStep > 0) setSkinStep(skinStep - 1);
    else goBack();
  }

  function backProfile() {
    if (profileStep > 0) setProfileStep(profileStep - 1);
    else goBack();
  }

  function backQuestion() {
    if (qStep > 0) {
      setQStep(qStep - 1);
    } else if (symptomIndex > 0) {
      const prevKey = selectedSymptoms[symptomIndex - 1];
      const prevTree = SYMPTOM_TREES[prevKey];
      const prevAnswers = answersMap[prevKey] || {};
      const prevVisible = prevTree.questions.filter((q) => !q.skipIf || !q.skipIf(prevAnswers));
      setSymptomIndex(symptomIndex - 1);
      setQStep(Math.max(0, prevVisible.length - 1));
    } else {
      goBack();
    }
    setMultiDraft([]);
  }

  function toggleSymptom(key) {
    setSelectedSymptoms((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function beginSymptoms() {
    setSymptomIndex(0);
    setQStep(0);
    setMultiDraft([]);
    goTo("questions");
  }

  function selectRedFlag(v) {
    setRedFlag(v);
    if (v === "none") {
      setTimeout(() => goTo("symptom"), 200);
    } else {
      setTimeout(() => goTo("referral"), 200);
    }
  }

  function selectSkin(key, v) {
    const next = { ...skinAnswers, [key]: v };
    setSkinAnswers(next);
    if (skinStep < SKIN_QUESTIONS.length - 1) setTimeout(() => setSkinStep(skinStep + 1), 200);
    else setTimeout(() => goTo("profile"), 250);
  }

  const visibleProfileQuestions = PROFILE_QUESTIONS.filter((q) => !q.skipIf || !q.skipIf(profileAnswers));
  const currentProfileQ = visibleProfileQuestions[profileStep] || null;

  function selectProfile(key, v) {
    const next = { ...profileAnswers, [key]: v };
    setProfileAnswers(next);
    const nextVisible = PROFILE_QUESTIONS.filter((q) => !q.skipIf || !q.skipIf(next));
    if (profileStep < nextVisible.length - 1) setTimeout(() => setProfileStep(profileStep + 1), 200);
    else setTimeout(() => goTo("redflag"), 250);
  }

  const currentSymptomKey = selectedSymptoms[symptomIndex] || null;
  const tree = currentSymptomKey ? SYMPTOM_TREES[currentSymptomKey] : null;
  const answers = currentSymptomKey ? answersMap[currentSymptomKey] || {} : {};
  const multiSel = currentSymptomKey ? multiSelMap[currentSymptomKey] || {} : {};
  const visibleQuestions = tree ? tree.questions.filter((q) => !q.skipIf || !q.skipIf(answers)) : [];
  const currentQ = visibleQuestions[qStep] || null;

  function selectAnswer(v) {
    if (currentQ.multi) {
      setMultiDraft((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
      return;
    }
    const next = { ...answers, [currentQ.key]: v };
    setAnswersMap((prev) => ({ ...prev, [currentSymptomKey]: next }));
    setTimeout(() => advanceQ(next), 200);
  }

  function confirmMulti() {
    setMultiSelMap((prev) => ({ ...prev, [currentSymptomKey]: { ...multiSel, [currentQ.key]: multiDraft } }));
    setMultiDraft([]);
    advanceQ(answers);
  }

  function advanceQ(latestAnswers) {
    const visible = tree.questions.filter((q) => !q.skipIf || !q.skipIf(latestAnswers));
    if (qStep < visible.length - 1) {
      setQStep(qStep + 1);
    } else if (symptomIndex < selectedSymptoms.length - 1) {
      setSymptomIndex(symptomIndex + 1);
      setQStep(0);
      setMultiDraft([]);
    } else {
      goTo("report");
    }
  }

  const skinDry = skinAnswers.wash === "dry";
  const skinSensitive = skinAnswers.sensitive === "yes";

  let symptomResults = [];
  if (screen === "report" || screen === "ingredient" || screen === "recommend") {
    symptomResults = selectedSymptoms.map((symKey) => {
      const t = SYMPTOM_TREES[symKey];
      const ans = answersMap[symKey] || {};
      const msel = multiSelMap[symKey] || {};
      const rk = scoreCandidates(t, ans, msel);
      const tp = rk[0];
      const ev = tp;
      let ck = tp.key;
      if (symKey === "acne" && tp.key === "true_acne") {
        const m = acneMorphology(ans);
        if (m === "nodule" || m === "cyst") ck = "true_acne_severe";
        else if (m === "pustule") ck = "true_acne_moderate";
      }
      const ct = (REPORT_CONTENT[symKey] && REPORT_CONTENT[symKey][ck]) || { advice: "", drugs: [], medical: false };
      const su = getSuitability(tp.key);
      return { key: symKey, label: t.label, tree: t, ranked: rk, top: tp, evidence: ev, content: ct, suitability: su };
    });
  }

  let familyGroups = [];
  if (symptomResults.length) {
    const groupMap = {};
    symptomResults.forEach((r) => {
      const fam = CANDIDATE_FAMILY[r.top.key] || r.top.label;
      if (!groupMap[fam]) groupMap[fam] = [];
      groupMap[fam].push(r);
    });
    familyGroups = Object.entries(groupMap)
      .map(([family, items]) => {
        const drugMap = {};
        items.forEach((it) => it.content.drugs.forEach((d) => { if (!drugMap[d.name]) drugMap[d.name] = d; }));
        let drugs = Object.values(drugMap);
        let pregnancyFiltered = false;
        if (profileAnswers.pregnancy === "yes") {
          const filtered = drugs.filter((d) => !PREGNANCY_UNSAFE_KEYWORDS.some((k) => d.name.includes(k)));
          pregnancyFiltered = filtered.length !== drugs.length;
          drugs = filtered;
        }
        return { family, items, drugs, pregnancyFiltered };
      })
      .sort((a, b) => b.items.length - a.items.length);
  }

  const evidenceRiskWarnings = symptomResults.flatMap((result) =>
    result.ranked
      // Safety-oriented threshold: observed risk is surfaced before a candidate
      // needs to become the top conclusion, reducing the chance of false reassurance.
      .filter((candidate) => candidate.risk.length > 0 && candidate.pct >= 35)
      .flatMap((candidate) =>
        candidate.risk.map((risk) => `${candidate.label}（${candidate.pct}%）:${risk}`),
      ),
  );
  const allMedicalFlags = [
    ...new Set([
      ...symptomResults.map((r) => r.content.medical).filter(Boolean),
      ...evidenceRiskWarnings,
    ]),
  ];

  const primary = symptomResults[0] || null;
  const diagnosisSuitability = symptomResults.length > 0 ? mergeSuitability(symptomResults) : null;
  const quickIngredientSuitability = quickCandidateKey ? getSuitability(quickCandidateKey) : null;
  const quickRecommendSuitability = quickRecommendKey
    ? mergeSuitabilityKeys((QUICK_RECOMMEND_OPTIONS.find((o) => o.key === quickRecommendKey) || {}).keys || [])
    : null;
  const suitability = diagnosisSuitability || quickIngredientSuitability || quickRecommendSuitability;
  const selectedProduct = uploadedProduct || productCatalog.find((p) => p.id === selectedUploadId) || null;
  const liveOcrResult = ocrText.trim() ? parseIngredientDetails(ocrText, INGREDIENT_LIBRARY) : null;
  const selectedProductAnalysis = selectedProduct && suitability ? buildUploadedAnalysis(selectedProduct, suitability) : [];
  const rankedProducts = suitability
    ? rankProducts(productCatalog, suitability)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* ---------------- HOME / THREE ENTRY POINTS ---------------- */}
        {screen === "intro" && (
          <div style={{ paddingTop: 34, paddingBottom: 40 }}>
            <Eyebrow>SKIN INTELLIGENCE · DEMO v2</Eyebrow>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 500, lineHeight: 1.25, marginBottom: 14, marginTop: 0 }}>
              同一个症状,
              <br />
              不一定是同一个原因。
            </h1>
            <p style={{ fontSize: 14.5, color: "#5C574D", lineHeight: 1.7, marginBottom: 24 }}>
              三个独立入口,共用同一套候选病因与成分匹配逻辑。完整问诊用于判断,快速选择用于直接查成分和产品。
            </p>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.08em", color: MUTE, textTransform: "uppercase", marginBottom: 10 }}>
              三条线 · 一个共享站
            </div>

            <button
              onClick={() => goTo("skin")}
              style={{ width: "100%", textAlign: "left", border: `1px solid ${TEAL}`, background: TEAL_SOFT, borderRadius: 12, padding: "17px 18px", marginBottom: 10, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#2E4E48", marginBottom: 4 }}>01 · 皮肤诊断</div>
                  <div style={{ fontSize: 12.5, color: "#526A64", lineHeight: 1.5 }}>结构化追问 → 候选病因 → 置信度 + 证据 → 护理方向</div>
                </div>
                <ChevronRight size={18} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </button>

            <button
              onClick={() => goTo("quickIngredient")}
              style={{ width: "100%", textAlign: "left", border: `1px solid ${LINE}`, background: "#fff", borderRadius: 12, padding: "17px 18px", marginBottom: 10, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>02 · 成分分析</div>
                  <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5 }}>不用完整问诊,直接选择一个状态,查看适合 / 风险成分</div>
                </div>
                <ChevronRight size={18} color={MUTE} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </button>

            <button
              onClick={() => goTo("quickRecommend")}
              style={{ width: "100%", textAlign: "left", border: `1px solid ${LINE}`, background: "#fff", borderRadius: 12, padding: "17px 18px", marginBottom: 22, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>03 · 产品推荐</div>
                  <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5 }}>按肤质 / 症状 / 需求浏览,解释“为什么适合”</div>
                </div>
                <ChevronRight size={18} color={MUTE} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </button>

            <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "13px 15px", background: "#fff" }}>
              <div style={{ display: "flex", gap: 9, fontSize: 12.5, color: "#5C574D", lineHeight: 1.6 }}>
                <FlaskConical size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>三个入口最终都会汇入同一个“成分库 + 候选病因判断”共享层，不各自维护一套推荐逻辑。</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- QUICK INGREDIENT SELECT ---------------- */}
        {screen === "quickIngredient" && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}><ChevronLeft size={14} /> 首页</TextButton>
            <Eyebrow>成分分析 · 快速选择</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 23, fontWeight: 500, marginBottom: 7, marginTop: 0 }}>
              你想从哪个状态开始?
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, marginBottom: 20 }}>
              这里不是重新做一遍诊断,只是把你的选择映射到已有 candidate key,直接进入同一份成分库。
            </p>
            {QUICK_INGREDIENT_OPTIONS.map((o) => (
              <OptionCard
                key={o.key}
                label={o.label}
                sub={o.sub}
                selected={quickCandidateKey === o.key}
                onClick={() => {
                  setQuickCandidateKey(o.key);
                  goTo("quickIngredientResult");
                }}
              />
            ))}
          </div>
        )}

        {/* ---------------- QUICK INGREDIENT RESULT ---------------- */}
        {screen === "quickIngredientResult" && quickIngredientSuitability && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}><ChevronLeft size={14} /> 重新选择</TextButton>
            <Eyebrow>成分分析 · 快速参考</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 23, fontWeight: 500, marginBottom: 7, marginTop: 0 }}>
              「{QUICK_INGREDIENT_OPTIONS.find((o) => o.key === quickCandidateKey)?.label}」
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, marginBottom: 20 }}>
              这是基于现有成分库的状态级参考,不是完整皮肤诊断。真实产品分析仍需要结合完整配料表、排位和具体使用情境。
            </p>

            {groupBySystem(quickIngredientSuitability.good).map((grp) => (
              <div key={"g" + grp.system} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: TEAL, marginBottom: 6 }}>{grp.system} · 适合方向</div>
                {grp.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <Check size={13} color={TEAL} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: "#2E4E48", lineHeight: 1.5 }}><b>{it.name}</b> —— {it.func}</span>
                  </div>
                ))}
              </div>
            ))}

            {groupBySystem(quickIngredientSuitability.risky).map((grp) => (
              <div key={"r" + grp.system} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: RUST, marginBottom: 6 }}>{grp.system} · 谨慎方向</div>
                {grp.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <X size={13} color={RUST} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: "#7A3D2C", lineHeight: 1.5 }}><b>{it.name}</b> —— {it.func}</span>
                  </div>
                ))}
              </div>
            ))}

            {quickCandidateKey === "antioxidant" && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", background: TEAL_SOFT, marginTop: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 12.5, color: "#2E4E48", lineHeight: 1.6 }}>
                  抗氧化在这里作为“日常预防”入口,不要和 photodamage 的“已经发生的光损伤”混为一个 candidate。
                </span>
              </div>
            )}

            <PrimaryButton onClick={() => goTo("upload")}>
              <FlaskConical size={15} /> 分析一瓶具体产品
            </PrimaryButton>
            <TextButton onClick={() => goTo("intro")}>回到三个入口</TextButton>
          </div>
        )}

        {/* ---------------- QUICK PRODUCT RECOMMEND SELECT ---------------- */}
        {screen === "quickRecommend" && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}><ChevronLeft size={14} /> 首页</TextButton>
            <Eyebrow>产品推荐 · 快速选择</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 23, fontWeight: 500, marginBottom: 7, marginTop: 0 }}>
              你想按什么条件找?
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, marginBottom: 20 }}>
              选择一个肤质、症状或需求大类。系统只负责匹配已有数据,不会假装做一次完整诊断。
            </p>
            {QUICK_RECOMMEND_OPTIONS.map((o) => (
              <OptionCard
                key={o.key}
                label={o.label}
                sub={o.sub}
                selected={quickRecommendKey === o.key}
                onClick={() => {
                  setQuickRecommendKey(o.key);
                  goTo("quickRecommendResult");
                }}
              />
            ))}
          </div>
        )}

        {/* ---------------- QUICK PRODUCT RECOMMEND RESULT ---------------- */}
        {screen === "quickRecommendResult" && quickRecommendSuitability && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}><ChevronLeft size={14} /> 重新选择</TextButton>
            <Eyebrow>产品推荐 · 本地产品数据库</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 23, fontWeight: 500, marginBottom: 7, marginTop: 0 }}>
              按「{QUICK_RECOMMEND_OPTIONS.find((o) => o.key === quickRecommendKey)?.label}」匹配
            </h2>
            <div style={{ display: "flex", gap: 10, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, background: "#fff" }}>
              <Database size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
                已收录 {productCatalog.length} 款真实产品（共享库 {sharedProducts.length} 款，本地离线备份 {productCatalog.length - sharedProducts.length} 款）。配方可能因地区与批次调整，购买或使用前仍应与手中包装核对。
              </span>
            </div>
            {rankedProducts.map((p, i) => (
              <ProductRecommendationCard key={p.id} product={p} index={i} />
            ))}
            <SectionLabel>为什么不是黑箱推荐?</SectionLabel>
            <BodyText>
              每个分数都会展示加分、减分、配料位置、有效证据数量和数据完整度。没有相关证据时直接标记“证据不足”，不会用默认中性分数假装完成推荐。
            </BodyText>
            <TextButton onClick={() => goTo("intro")}>回到三个入口</TextButton>
          </div>
        )}

        {/* ---------------- SKIN TYPE ---------------- */}
        {screen === "skin" && (
          <div style={{ paddingTop: 24 }}>
            <TextButton onClick={backSkin}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>第一步 · 肤质建档</Eyebrow>
            <JourneyProgress stage={0} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: MUTE, marginBottom: 10 }}>
              本阶段问题 {skinStep + 1}/{SKIN_QUESTIONS.length}
            </div>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              {SKIN_QUESTIONS[skinStep].q}
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20 }}>这一层结果会作为后续所有症状判断的先验条件</p>
            {SKIN_QUESTIONS[skinStep].options.map((o) => (
              <OptionCard key={o.v} label={o.l} sub={o.sub} selected={skinAnswers[SKIN_QUESTIONS[skinStep].key] === o.v} onClick={() => selectSkin(SKIN_QUESTIONS[skinStep].key, o.v)} />
            ))}
          </div>
        )}

        {/* ---------------- PROFILE (年龄/性别/怀孕安全闸门) ---------------- */}
        {screen === "profile" && currentProfileQ && (
          <div style={{ paddingTop: 24 }}>
            <TextButton onClick={backProfile}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>第二步 · 基础信息</Eyebrow>
            <JourneyProgress stage={1} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: MUTE, marginBottom: 10 }}>
              本阶段问题 {profileStep + 1}/{visibleProfileQuestions.length}
            </div>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              {currentProfileQ.q}
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20 }}>{currentProfileQ.hint}</p>
            {currentProfileQ.options.map((o) => (
              <OptionCard key={o.v} label={o.l} selected={profileAnswers[currentProfileQ.key] === o.v} onClick={() => selectProfile(currentProfileQ.key, o.v)} />
            ))}
          </div>
        )}

        {/* ---------------- SYMPTOM SELECT ---------------- */}
        {screen === "symptom" && (
          <div style={{ paddingTop: 24 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>肤质已记录</Eyebrow>
            <JourneyProgress stage={3} />
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              <Tag>{{ combo: "混合性", oily: "油性", dry: "干性", normal: "中性" }[skinAnswers.wash]}</Tag>
              <Tag>{skinSensitive ? "敏感叠加" : "非敏感"}</Tag>
              {profileAnswers.age && <Tag>{{ u18: "18岁以下", "18-30": "18-30岁", "30-45": "30-45岁", "45+": "45岁以上" }[profileAnswers.age]}</Tag>}
              {profileAnswers.gender && <Tag>{profileAnswers.gender === "female" ? "女" : "男"}</Tag>}
              {profileAnswers.pregnancy === "yes" && <Tag>怀孕/哺乳期</Tag>}
            </div>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              今天想咨询哪些问题?
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20 }}>
              可以多选——如果几个症状最终指向同一个根因,报告会自动合并,而不是给你几份互不相关的建议
            </p>
            {Object.entries(SYMPTOM_TREES).map(([key, t]) => (
              <OptionCard
                key={key}
                label={t.label}
                sub={`约 ${t.questions.length} 题鉴别问诊`}
                selected={selectedSymptoms.includes(key)}
                onClick={() => toggleSymptom(key)}
              />
            ))}
            <PrimaryButton onClick={beginSymptoms} disabled={selectedSymptoms.length === 0}>
              开始问诊{selectedSymptoms.length > 0 ? `(${selectedSymptoms.length}个)` : ""} <ChevronRight size={16} />
            </PrimaryButton>
          </div>
        )}

        {/* ---------------- RED FLAG SCREENING (全局分诊,一次性) ---------------- */}
        {screen === "redflag" && (
          <div style={{ paddingTop: 24 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>第三步 · 就医识别</Eyebrow>
            <JourneyProgress stage={2} />
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 21, fontWeight: 500, marginBottom: 6, marginTop: 0, lineHeight: 1.4 }}>
              在选具体问题之前,先排除这几种情况
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20, lineHeight: 1.6 }}>
              这几种不属于护肤品能处理的范畴,这一步只做一次——命中任意一项会直接建议就医,不会进入后面的症状选择
            </p>
            {RED_FLAGS.map((f) => (
              <OptionCard key={f.v} label={f.l} selected={redFlag === f.v} onClick={() => selectRedFlag(f.v)} />
            ))}
          </div>
        )}

        {/* ---------------- REFERRAL (转诊拦截) ---------------- */}
        {screen === "referral" && redFlag && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>建议就医</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 500, marginBottom: 20, marginTop: 0 }}>
              这个特征超出了护肤品能处理的范围
            </h2>
            <div style={{ display: "flex", gap: 10, border: `1px solid #DDBBAE`, borderRadius: 10, padding: "16px 18px", marginBottom: 20, background: "#FBF0EC" }}>
              <Stethoscope size={18} color={RUST} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#7A3D2C", marginBottom: 4 }}>
                  特征更符合:{RED_FLAGS.find((f) => f.v === redFlag)?.condition}
                </div>
                <div style={{ fontSize: 12.5, color: "#7A3D2C", lineHeight: 1.6 }}>{RED_FLAGS.find((f) => f.v === redFlag)?.note}</div>
              </div>
            </div>
            <BodyText>
              这类情况通常需要专业检查(必要时刮片、皮肤镜或活检)才能确诊,继续用护肤品自行判断和护理不仅无效,还可能延误规范治疗的时机。建议尽快挂皮肤科明确诊断,再决定后续方案。
            </BodyText>
            <PrimaryButton onClick={resetAll}>重新开始演示</PrimaryButton>
          </div>
        )}

        {/* ---------------- QUESTIONS ---------------- */}
        {screen === "questions" && currentQ && (
          <div style={{ paddingTop: 24 }}>
            <TextButton onClick={backQuestion}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>
              {tree.label} · 鉴别问诊
              {selectedSymptoms.length > 1 ? `(${symptomIndex + 1}/${selectedSymptoms.length})` : ""}
            </Eyebrow>
            <JourneyProgress stage={3} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: MUTE, marginBottom: 10 }}>
              本症状问题 {qStep + 1}/{visibleQuestions.length}
            </div>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 21, fontWeight: 500, marginBottom: 6, marginTop: 0, lineHeight: 1.4 }}>
              {currentQ.q}
            </h2>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20 }}>{currentQ.hint}</p>
            {currentQ.options
              .filter((o) => !(currentSymptomKey === "acne" && currentQ.key === "trigger" && o.v === "cycle" && profileAnswers.gender === "male"))
              .map((o) => {
                const selected = currentQ.multi ? multiDraft.includes(o.v) : answers[currentQ.key] === o.v;
                return <OptionCard key={o.v} label={o.l} selected={selected} onClick={() => selectAnswer(o.v)} />;
              })}
            {currentQ.multi && (
              <PrimaryButton onClick={confirmMulti} disabled={multiDraft.length === 0}>
                确认 <ChevronRight size={16} />
              </PrimaryButton>
            )}
          </div>
        )}

        {/* ---------------- REPORT ---------------- */}
        {screen === "report" && symptomResults.length > 0 && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <Eyebrow>整合诊断报告 · {symptomResults.map((r) => r.label).join(" / ")}</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 500, marginBottom: 20, marginTop: 0 }}>
              病因判断
            </h2>

            {familyGroups.map((group) => {
              const isShared = group.items.length > 1;
              return (
                <div key={group.family} style={{ marginBottom: 28 }}>
                  {isShared && (
                    <div style={{ display: "flex", gap: 10, background: TEAL_SOFT, border: `1px solid #BFD6D0`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                      <Circle size={14} color={TEAL} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 12.5, color: "#2E4E48", lineHeight: 1.6 }}>
                        共同根因:{group.items.map((it) => it.label).join(" + ")} 的顶端诊断都指向「{group.family}」——很可能是同一个根因导致的不同表现,下面的建议已合并,不重复给两套逻辑。
                      </span>
                    </div>
                  )}

                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 20, background: "#fff", marginBottom: 16 }}>
                    {group.items.map((it) => {
                      const itAnswers = answersMap[it.key] || {};
                      const label = contentKeyLabel(it.key, itAnswers) ? `${it.label}:${it.top.label} · ${contentKeyLabel(it.key, itAnswers)}` : `${it.label}:${it.top.label}`;
                      return <ConfidenceBar key={it.key} label={label} pct={it.top.pct} tone="primary" />;
                    })}
                    {group.items.some((it) => it.content.medical) && (
                      <div style={{ display: "flex", gap: 10, background: AMBER_SOFT, border: `1px solid #E3CFA0`, borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
                        <AlertTriangle size={16} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12.5, color: "#6B5527", lineHeight: 1.6 }}>
                          高风险病因即使未夺得最高置信度,只要没被充分排除就保留提示——误判延误就医的成本更高。
                        </span>
                      </div>
                    )}
                  </div>

                  {group.items.map((it) => (
                    <EvidenceList key={it.key} evidence={it.evidence} />
                  ))}

                  <SectionLabel>{isShared ? "合并护肤建议" : "护肤建议"}</SectionLabel>
                  {group.items.map((it) => (
                    <BodyText key={it.key}>{isShared ? `${it.label}:` : ""}{it.content.advice}</BodyText>
                  ))}

                  {group.drugs.length > 0 && (
                    <>
                      <SectionLabel>药物参考(强度分层,已去重)</SectionLabel>
                      <div style={{ marginBottom: 16 }}>
                        {group.drugs.map((d, i) => (
                          <DrugRow key={i} tier={d.tier} name={d.name} note={d.note} />
                        ))}
                      </div>
                    </>
                  )}

                  {profileAnswers.pregnancy === "yes" && group.pregnancyFiltered && (
                    <div style={{ display: "flex", gap: 10, background: AMBER_SOFT, border: `1px solid #E3CFA0`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                      <AlertTriangle size={16} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12.5, color: "#6B5527", lineHeight: 1.6 }}>
                        已识别到怀孕/哺乳期:部分药物类别已从这组建议中移除,用药请务必经产科/皮肤科医生共同评估。
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {skinDry && (
              <div style={{ display: "flex", gap: 10, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, background: TEAL_SOFT }}>
                <Circle size={14} color={TEAL} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 12.5, color: "#2E4E48", lineHeight: 1.6 }}>
                  先验条件生效:检测到你是干性肤质,相关判断权重已相应调整。
                </span>
              </div>
            )}

            {allMedicalFlags.length > 0 && (
              <>
                <SectionLabel>就医提示</SectionLabel>
                {allMedicalFlags.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, border: `1px solid #DDBBAE`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, background: "#FBF0EC" }}>
                    <Stethoscope size={16} color={RUST} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: "#7A3D2C", lineHeight: 1.6 }}>{m}</span>
                  </div>
                ))}
              </>
            )}

            {suitability && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", background: "#fff", marginBottom: 20, marginTop: 8 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.08em", color: MUTE, textTransform: "uppercase", marginBottom: 12 }}>
                  适合 / 风险成分参考 · 综合本次{symptomResults.length > 1 ? "所有已选症状" : "诊断结论"},按体系分类
                </div>

                {groupBySystem(suitability.good).map((grp) => (
                  <div key={"g" + grp.system} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: TEAL, marginBottom: 6 }}>{grp.system}</div>
                    {grp.items.map((it, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                        <Check size={13} color={TEAL} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: "#2E4E48", lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 500 }}>{it.name}</span> —— {it.func}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {groupBySystem(suitability.risky).map((grp) => (
                  <div key={"r" + grp.system} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: RUST, marginBottom: 6 }}>{grp.system}</div>
                    {grp.items.map((it, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                        <X size={13} color={RUST} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: "#7A3D2C", lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 500 }}>{it.name}</span> —— {it.func}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {suitability.conflicting.length > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: AMBER, marginBottom: 6 }}>因症状而异(需结合具体诊断判断)</div>
                    {suitability.conflicting.map((it, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                        <AlertTriangle size={13} color={AMBER} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: "#6B5527", lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 500 }}>{it.name}</span> —— 对你选的某个症状是{it.func};对另一个症状则是{it.riskyFunc},两个方向冲突,不能一概而论。
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <PrimaryButton onClick={() => goTo("upload")}>
              <FlaskConical size={15} /> 查看成分匹配分析
            </PrimaryButton>
            {suitability && (
              <PrimaryButton onClick={() => goTo("recommend")}>从产品数据库为我匹配</PrimaryButton>
            )}
            <TextButton onClick={resetAll}>重新开始</TextButton>
          </div>
        )}

        {/* ---------------- UPLOAD (拍照/选产品入口) ---------------- */}
        {screen === "upload" && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>成分匹配分析 · 第一步</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              先告诉我们你在用哪一瓶
            </h2>
            {diagnosisSuitability && (
              <div style={{ border: `1px solid ${TEAL}`, borderRadius: 10, padding: "12px 14px", background: TEAL_SOFT, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#2E4E48", lineHeight: 1.6 }}>
                  已有本次完整诊断结果。默认使用刚才的诊断结论，比自己选择一个标签更准确。
                </div>
              </div>
            )}
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 24, lineHeight: 1.6 }}>
              拍摄瓶身背面的配料表，OCR 会在你的设备浏览器内读取英文 INCI 名称；识别后可以手动校对，再进入匹配分析。
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleIngredientPhoto}
              style={{ display: "none" }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
                padding: "22px 20px", borderRadius: 12, border: `1.5px dashed ${TEAL}`, background: TEAL_SOFT,
                cursor: "pointer", marginBottom: 24,
              }}
            >
              <Camera size={18} color={TEAL} />
              <span style={{ fontSize: 14.5, fontWeight: 500, color: "#2E4E48" }}>拍照或从相册选择配料表</span>
            </button>

            {photoPreview && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 10, background: "#fff", marginBottom: 14 }}>
                <img src={photoPreview} alt="待识别的产品配料表" style={{ display: "block", width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 8 }} />
              </div>
            )}

            {ocrStatus === "reading" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: MUTE, marginBottom: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ScanText size={14} /> 正在识别英文 INCI…</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div style={{ height: 5, background: LINE, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${ocrProgress}%`, background: TEAL, transition: "width 200ms ease" }} />
                </div>
              </div>
            )}

            {(photoPreview || ocrText) && ocrStatus !== "reading" && (
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>识别结果（请校对）</label>
                <textarea
                  value={ocrText}
                  onChange={(event) => setOcrText(event.target.value)}
                  placeholder="例如：Aqua, Glycerin, Niacinamide, Ceramide NP…"
                  rows={7}
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: `1px solid ${ocrError ? RUST : LINE}`, borderRadius: 10, padding: "12px 13px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.55, color: INK, background: "#fff" }}
                />
                {ocrError && <div style={{ color: RUST, fontSize: 11.5, lineHeight: 1.5, marginTop: 7 }}>{ocrError}</div>}
                {liveOcrResult && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 10 }}>
                      {[
                        ["已标准化", liveOcrResult.recognized.length, TEAL],
                        ["待确认", liveOcrResult.unknown.length, AMBER],
                        ["覆盖率", `${liveOcrResult.coverage}%`, INK],
                      ].map(([label, value, color]) => (
                        <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 8px", background: "#fff", textAlign: "center" }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color }}>{value}</div>
                          <div style={{ fontSize: 10.5, color: MUTE, marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {liveOcrResult.recognized.length > 0 && (
                      <div style={{ fontSize: 11.5, color: "#2E4E48", lineHeight: 1.6, marginBottom: 6 }}>
                        已识别：{liveOcrResult.recognized.map((item) => item.canonicalName).join("、")}
                      </div>
                    )}
                    {liveOcrResult.unknown.length > 0 && (
                      <div style={{ fontSize: 11.5, color: "#6B5527", lineHeight: 1.6 }}>
                        未识别：{liveOcrResult.unknown.slice(0, 6).map((item) => item.raw).join("、")}{liveOcrResult.unknown.length > 6 ? "…" : ""}
                      </div>
                    )}
                  </div>
                )}
                <PrimaryButton onClick={confirmScannedIngredients} disabled={!ocrText.trim()}>
                  <ScanText size={15} /> 确认成分并开始匹配
                </PrimaryButton>
              </div>
            )}

            <ProductContributionPanel
              rawIngredients={ocrText}
              parseResult={liveOcrResult}
              photoFile={ingredientPhotoFile}
            />

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: MUTE, textTransform: "uppercase", marginBottom: 12 }}>
              或者从产品数据库选择 {sharedCatalogStatus === "offline" ? "（共享库暂时离线，已使用本地备份）" : ""}
            </div>
            {productCatalog.map((p) => (
              <OptionCard
                key={p.id}
                label={`${p.brand} · ${p.name}`}
                sub={`${p.category} · ${p.ingredientListType === "full" ? "完整配方" : "部分配方"} · 数据完整度 ${p.dataCompleteness}%`}
                selected={selectedUploadId === p.id}
                onClick={() => {
                  setUploadedProduct(null);
                  setSelectedUploadId(p.id);
                  goTo("ingredient");
                }}
              />
            ))}
          </div>
        )}

        {/* ---------------- INGREDIENT ---------------- */}
        {screen === "ingredient" && suitability && selectedProduct && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步(重新选择产品)
            </TextButton>
            <Eyebrow>成分匹配分析 · {uploadedProduct ? "拍照识别" : "产品数据库"}</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              你在用的这瓶,匹配吗?
            </h2>
            <div style={{ display: "flex", gap: 10, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, background: "#fff" }}>
              {uploadedProduct ? <ScanText size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} /> : <Database size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span style={{ fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
                正在比对「{selectedProduct.brand} · {selectedProduct.name}」。识别到 {selectedProduct.ingredients.length} 个成分库条目，下面每一条判断都来自 {INGREDIENT_LIBRARY.length} 条成分规则，而不是写死的示例。
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: MUTE, marginBottom: 20, lineHeight: 1.6 }}>
              基于本次{symptomResults.length > 1 ? "所有已选症状" : "诊断结论"}比对——同一个成分,风险会因诊断结论而不同
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
              {[
                ["数据完整度", `${selectedProduct.dataCompleteness ?? 100}%`],
                ["已标准化", selectedProduct.ingredients.length],
                ["未识别", selectedProduct.unknownIngredients?.length || 0],
              ].map(([label, value]) => (
                <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 8px", background: "#fff", textAlign: "center" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: INK }}>{value}</div>
                  <div style={{ fontSize: 10.5, color: MUTE, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {uploadedParseResult && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", background: "#fff", marginBottom: 16 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: MUTE, marginBottom: 8 }}>OCR 原文 → 标准成分</div>
                {uploadedParseResult.recognized.map((item, index) => (
                  <div key={`${item.canonicalName}-${index}`} style={{ fontSize: 11.5, color: "#4B473F", lineHeight: 1.55, marginBottom: 4 }}>
                    {item.raw} → <b>{item.canonicalName}</b>
                    {item.matchType === "fuzzy" ? `（纠错匹配 ${Math.round(item.confidence * 100)}%）` : ""}
                  </div>
                ))}
              </div>
            )}

            {selectedProductAnalysis.map((ing, i) => (
              <IngredientRow key={i} name={ing.name} position={ing.position} status={ing.status} note={ing.note} />
            ))}

            {selectedProductAnalysis.length === 0 && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", background: "#fff", color: MUTE, fontSize: 12.5, lineHeight: 1.6, marginBottom: 18 }}>
                已读取配料表，但没有命中当前诊断对应的适合或风险规则。这不等于产品一定适合，只表示现有规则库没有足够证据评分。
              </div>
            )}

            <SectionLabel>结论</SectionLabel>
            <BodyText>
              结合诊断结论与成分排位估算,上面标记为「冲突」的成分建议优先替换或减少使用频率,「一致」的成分可以保留,「低权重」的成分理论上有风险但估计浓度低,暂不列为优先处理项。
            </BodyText>

            {uploadedProduct && (
              <BodyText>OCR 可能漏字或误认，尤其是反光、弧形瓶身和小字号。安全结论以你校对后的文字和产品包装原始配料表为准。</BodyText>
            )}

            <PrimaryButton onClick={resetAll}>重新开始演示</PrimaryButton>
          </div>
        )}

        {/* ---------------- RECOMMEND (产品数据库匹配) ---------------- */}
        {screen === "recommend" && suitability && (
          <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            <TextButton onClick={goBack}>
              <ChevronLeft size={14} /> 上一步
            </TextButton>
            <Eyebrow>为你推荐 · 本地产品数据库</Eyebrow>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
              按{symptomResults.length > 1 ? `本次${symptomResults.length}个症状综合` : `「${primary.top.label}」`}的适合/风险成分匹配
            </h2>
            <div style={{ display: "flex", gap: 10, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, background: "#fff" }}>
              <Database size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
                当前数据库收录 {productCatalog.length} 款真实产品，其中共享审核库 {sharedProducts.length} 款。打分依据是 {INGREDIENT_LIBRARY.length} 条成分规则{symptomResults.length > 1 ? ",并综合本次所有已选症状" : ""}；配方可能因地区与批次变化，请以包装为准。
              </span>
            </div>

            {rankedProducts.map((p, i) => (
              <ProductRecommendationCard key={p.id} product={p} index={i} />
            ))}

            <SectionLabel>打分逻辑</SectionLabel>
            <BodyText>
              命中适合成分加分、命中风险成分减分，且位置越靠前权重越大。结果同时受产品配方完整度和有效证据数量约束；证据不足的产品不显示精确分数，也不会排在有证据的产品前面。
            </BodyText>

            <PrimaryButton onClick={resetAll}>重新开始演示</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
