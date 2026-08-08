export interface ProductRecord {
  id: string;
  brand: string;
  name: string;
  category: "洁面" | "精华" | "乳霜" | "防晒" | "焕肤";
  ingredients: string[];
  sourceUrl: string;
  verifiedAt: string;
}

// 首批本地产品目录。成分来自品牌官方页面公开的配方或重点成分；
// 不保存价格与购买链接，且提醒用户以手中包装的最新配料表为准。
export const PRODUCT_CATALOG: ProductRecord[] = [
  {
    id: "lrp-toleriane-double-repair",
    brand: "La Roche-Posay",
    name: "Toleriane Double Repair Face Moisturizer",
    category: "乳霜",
    ingredients: [
      "水",
      "甘油 (Glycerin)",
      "角鲨烷 (Squalane)",
      "硅油类 (Dimethicone)",
      "烟酰胺 (Niacinamide)",
      "神经酰胺 (Ceramide NP)",
      "氢氧化钠/柠檬酸钠 (Sodium Hydroxide/Sodium Citrate)",
      "1,2-己二醇/辛甘醇 (1,2-Hexanediol/Caprylyl Glycol)",
      "黄原胶 (Xanthan Gum)",
    ],
    sourceUrl: "https://www.laroche-posay.us/our-products/face/face-moisturizer/toleriane-double-repair-face-moisturizer-tolerianedoublerepair.html",
    verifiedAt: "2026-08-08",
  },
  {
    id: "cerave-pm-facial-lotion",
    brand: "CeraVe",
    name: "PM Facial Moisturizing Lotion",
    category: "乳霜",
    ingredients: [
      "甘油 (Glycerin)",
      "烟酰胺 (Niacinamide)",
      "透明质酸钠 (Sodium Hyaluronate)",
      "神经酰胺 (Ceramide NP)",
      "胆固醇/谷甾醇 (Beta-Sitosterol)",
      "植物鞘氨醇 (Phytosphingosine)",
    ],
    sourceUrl: "https://www.cerave.com/en-us/skincare/moisturizers/pm-facial-moisturizing-lotion",
    verifiedAt: "2026-08-08",
  },
  {
    id: "vanicream-daily-facial-moisturizer",
    brand: "Vanicream",
    name: "Daily Facial Moisturizer",
    category: "乳霜",
    ingredients: [
      "透明质酸钠 (Sodium Hyaluronate)",
      "神经酰胺 (Ceramide NP)",
      "角鲨烷 (Squalane)",
      "甘油 (Glycerin)",
    ],
    sourceUrl: "https://www.vanicream.com/product/vanicream-daily-facial-moisturizer",
    verifiedAt: "2026-08-08",
  },
  {
    id: "aveeno-calm-restore-oat-gel",
    brand: "Aveeno",
    name: "Calm + Restore Oat Gel Moisturizer",
    category: "乳霜",
    ingredients: [
      "甘油 (Glycerin)",
      "燕麦仁提取物 (Avena Sativa/Oat Kernel Extract)",
      "1,2-己二醇/辛甘醇 (1,2-Hexanediol/Caprylyl Glycol)",
      "硅油类 (Dimethicone)",
    ],
    sourceUrl: "https://www.aveeno.com/products/calm-restore-oat-gel-moisturizer-sensitive-skin",
    verifiedAt: "2026-08-08",
  },
  {
    id: "ordinary-niacinamide-zinc",
    brand: "The Ordinary",
    name: "Niacinamide 10% + Zinc 1%",
    category: "精华",
    ingredients: [
      "水",
      "烟酰胺 (Niacinamide)",
      "锌PCA (Zinc PCA)",
      "黄原胶 (Xanthan Gum)",
      "苯氧乙醇/氯苯甘醚等防腐剂 (Phenoxyethanol/Chlorphenesin)",
    ],
    sourceUrl: "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html",
    verifiedAt: "2026-08-08",
  },
  {
    id: "paulas-choice-bha-liquid",
    brand: "Paula's Choice",
    name: "Skin Perfecting 2% BHA Liquid Exfoliant",
    category: "焕肤",
    ingredients: [
      "水",
      "水杨酸 (BHA)",
      "绿茶提取物 (Camellia Sinensis Leaf Extract)",
      "丁二醇 (Butylene Glycol)",
    ],
    sourceUrl: "https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html",
    verifiedAt: "2026-08-08",
  },
  {
    id: "cerave-sa-cream",
    brand: "CeraVe",
    name: "SA Cream for Rough & Bumpy Skin",
    category: "焕肤",
    ingredients: [
      "水杨酸 (BHA)",
      "果酸 (Glycolic/Lactic/Mandelic Acid)",
      "透明质酸钠 (Sodium Hyaluronate)",
      "烟酰胺 (Niacinamide)",
      "神经酰胺 (Ceramide NP)",
    ],
    sourceUrl: "https://www.cerave.com/en-us/skincare/moisturizers/sa-cream-for-rough-and-bumpy-skin",
    verifiedAt: "2026-08-08",
  },
  {
    id: "eucerin-clear-skin-spf50",
    brand: "Eucerin",
    name: "Clear Skin SPF 50 Face Sunscreen",
    category: "防晒",
    ingredients: [
      "阿伏苯宗/奥克立林等 (化学防晒剂)",
      "生育酚/维E (Tocopherol/Tocopheryl Acetate)",
      "甘草酸二钾/甘草根提取物 (Glycyrrhiza Glabra)",
      "硅油类 (Dimethicone)",
    ],
    sourceUrl: "https://www.eucerinus.com/products/sun-protection/clear-skin-spf-50-face-sunscreen",
    verifiedAt: "2026-08-08",
  },
];
