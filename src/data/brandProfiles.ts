export interface BrandProfile {
  name: string;
  country: string;
  segment: string;
  description: string;
  knownFor: string;
  bestFor: string;
  pricePositioning: string;
}

const PROFILES: Record<string, BrandProfile> = {
  Chanel: { name: "Chanel", country: "法国", segment: "Luxury skincare", description: "以奢华肤感、山茶花与香氛体验见长的高端护肤线。", knownFor: "Sublimage、N°1 de Chanel、Le Lift", bestFor: "重视肤感、仪式感和综合抗老体验的人", pricePositioning: "高端 / 超高端" },
  Dior: { name: "Dior", country: "法国", segment: "Luxury skincare", description: "以花植研究、奢华质地和多条抗老及提亮产品线为核心。", knownFor: "Dior Prestige、Capture、Dior Snow", bestFor: "希望兼顾肤感、抗老或提亮诉求的人", pricePositioning: "高端 / 超高端" },
  "La Roche-Posay": { name: "La Roche-Posay", country: "法国", segment: "Dermocosmetic", description: "欧莱雅集团旗下药妆品牌，围绕敏感、痘肌、防晒与皮肤屏障建立清晰产品线。", knownFor: "Toleriane、Effaclar、Anthelios、Cicaplast", bestFor: "敏感、痘肌、防晒及屏障护理", pricePositioning: "大众药妆" },
  "Avène": { name: "Avène", country: "法国", segment: "Dermocosmetic", description: "法国皮尔法伯旗下敏感肌药妆品牌，以雅漾活泉水和低刺激护理著称。", knownFor: "Tolerance、Cicalfate、Cleanance", bestFor: "敏感、泛红和屏障不稳定肌肤", pricePositioning: "大众药妆" },
  Bioderma: { name: "Bioderma", country: "法国", segment: "Dermocosmetic", description: "法国 NAOS 旗下皮肤科学品牌，按皮肤生态和不同问题划分产品线。", knownFor: "Sensibio、Sebium、Hydrabio", bestFor: "敏感、油痘、卸妆与基础屏障护理", pricePositioning: "大众药妆" },
  CeraVe: { name: "CeraVe", country: "美国", segment: "Dermocosmetic", description: "以神经酰胺组合和简洁基础护理著称，强调清洁、保湿与屏障支持。", knownFor: "洁面、保湿乳、面霜", bestFor: "需要高性价比基础清洁和屏障保湿的人", pricePositioning: "大众" },
  Cetaphil: { name: "Cetaphil", country: "加拿大", segment: "Dermocosmetic", description: "Galderma 旗下温和护肤品牌，以敏感肌清洁和保湿产品覆盖广。", knownFor: "Gentle Skin Cleanser、Moisturising Lotion", bestFor: "敏感或想建立简洁基础 Routine 的人", pricePositioning: "大众" },
  "Paula's Choice": { name: "Paula's Choice", country: "美国", segment: "Clinical / masstige", description: "强调公开配方逻辑和功效活性，酸类、A醇与屏障产品线尤其成熟。", knownFor: "2% BHA、Clinical、Calm", bestFor: "希望按明确功效选择酸类、抗老或控痘产品的人", pricePositioning: "中端" },
  "The Ordinary": { name: "The Ordinary", country: "加拿大", segment: "Ingredient-led", description: "以单一或少数组合活性和透明定价闻名，适合有一定成分基础的人。", knownFor: "烟酰胺、酸类、A醇、多肽", bestFor: "预算有限且愿意自己管理活性叠加的人", pricePositioning: "大众" },
  "SK-II": { name: "SK-II", country: "日本", segment: "Prestige skincare", description: "以 PITERA 发酵滤液和精华水为品牌核心的高端亚洲护肤品牌。", knownFor: "Facial Treatment Essence", bestFor: "偏好发酵精华、肤感和通透感护理的人", pricePositioning: "高端" },
  Shiseido: { name: "Shiseido", country: "日本", segment: "Prestige skincare", description: "日本综合美妆集团旗舰品牌，覆盖保湿、抗老、提亮与防晒。", knownFor: "Ultimune、Vital Perfection、Benefiance", bestFor: "希望从成熟日系产品线选择综合护理的人", pricePositioning: "中高端 / 高端" },
  "SKIN 1004": { name: "SKIN1004", country: "韩国", segment: "K-beauty / masstige", description: "以马达加斯加积雪草为核心叙事的韩系护肤品牌，产品多围绕舒缓、轻薄保湿和痘肌护理。", knownFor: "Madagascar Centella 系列", bestFor: "偏好清爽肤感、舒缓和基础屏障护理的人", pricePositioning: "大众 / 中端" },
  Anua: { name: "Anua", country: "韩国", segment: "K-beauty / trending", description: "以鱼腥草等舒缓植萃切入的韩系热门品牌，化妆水、精华和温和清洁产品讨论度较高。", knownFor: "Heartleaf 鱼腥草系列", bestFor: "油敏、泛红或偏好轻薄植萃护理的人", pricePositioning: "大众 / 中端" },
  medicube: { name: "medicube", country: "韩国", segment: "Clinical K-beauty", description: "围绕毛孔、痘肌、焕肤和家用美容设备建立产品线，功效导向较强。", knownFor: "Zero Pore、AGE-R、Collagen 系列", bestFor: "关注毛孔、肤质平滑和功效型护理的人", pricePositioning: "中端" },
  Nivea: { name: "Nivea", country: "德国", segment: "Mass market", description: "覆盖面部、身体和防晒的大众护理品牌，产品分布广、价格易接近。", knownFor: "基础保湿、防晒、洁面", bestFor: "预算有限并需要基础护理的人", pricePositioning: "大众" },
  Garnier: { name: "Garnier", country: "法国", segment: "Mass market", description: "欧莱雅集团旗下大众美容品牌，在亚洲常见洁面、精华、面膜和防晒产品。", knownFor: "维C提亮、Micellar 卸妆、防晒", bestFor: "追求易买和高性价比功效护理的人", pricePositioning: "大众" },
  APLB: { name: "APLB", country: "韩国", segment: "Ingredient-led K-beauty", description: "以积雪草、谷胱甘肽等成分组合命名产品的韩系功效护肤品牌。", knownFor: "Glutathione Niacinamide、Centella 系列", bestFor: "偏好成分导向和价格友好产品的人", pricePositioning: "大众" },
  "Beauty of Joseon": { name: "Beauty of Joseon", country: "韩国", segment: "K-beauty / masstige", description: "以韩方植萃和现代配方结合为特色，防晒、精华和洁面在海外市场知名度高。", knownFor: "Relief Sun、Glow Serum、Dynasty Cream", bestFor: "偏好温和肤感、日常防晒和基础提亮的人", pricePositioning: "大众 / 中端" },
  COSRX: { name: "COSRX", country: "韩国", segment: "Clinical K-beauty", description: "以痘肌、角质和简洁功效配方起家的韩系品牌。", knownFor: "BHA、Snail 蜗牛、痘痘贴", bestFor: "油痘、黑头、角质和修护需求", pricePositioning: "大众 / 中端" },
  celimax: { name: "celimax", country: "韩国", segment: "K-beauty / indie", description: "以屏障、舒缓和功效精华为主的韩系护肤品牌。", knownFor: "Dual Barrier、Noni、Oil Control", bestFor: "屏障不稳、缺水或希望尝试轻功效护理的人", pricePositioning: "大众 / 中端" },
  Neutrogena: { name: "Neutrogena", country: "美国", segment: "Mass derm-inspired", description: "强生旗下大众护肤品牌，覆盖痘肌、水杨酸、保湿和防晒。", knownFor: "Hydro Boost、水杨酸洁面、防晒", bestFor: "需要容易购买的基础保湿或油痘护理的人", pricePositioning: "大众" },
  "Dr. Althea": { name: "Dr. Althea", country: "韩国", segment: "K-beauty / masstige", description: "以舒缓修护面霜、精华和面膜为主的韩系护肤品牌。", knownFor: "345 Relief Cream、Vitamin C", bestFor: "偏好舒缓型韩系面霜和轻功效精华的人", pricePositioning: "中端" },
  Facetheory: { name: "Facetheory", country: "英国", segment: "Ingredient-led indie", description: "强调活性成分、纯素定位和线上直销的英国独立护肤品牌。", knownFor: "Azeclear、Retin-C、exaglow", bestFor: "愿意研究活性浓度、色沉和痘肌护理的人", pricePositioning: "中端" },
  "haruharu wonder": { name: "haruharu wonder", country: "韩国", segment: "K-beauty / indie", description: "以黑米发酵提取物和轻薄保湿产品为特色的韩系品牌。", knownFor: "Black Rice 系列", bestFor: "缺水、轻敏或偏好发酵抗氧化护理的人", pricePositioning: "大众 / 中端" },
  "Purito SEOUL": { name: "Purito SEOUL", country: "韩国", segment: "Sensitive-skin K-beauty", description: "以敏感肌、积雪草和屏障护理为核心的韩系品牌。", knownFor: "Wonder Releaf Centella、Oat-in、Dermide", bestFor: "敏感、泛红和屏障护理", pricePositioning: "大众 / 中端" },
  Eucerin: { name: "Eucerin", country: "德国", segment: "Dermocosmetic", description: "拜尔斯道夫旗下皮肤科学品牌，覆盖干燥、色沉、痘肌和防晒。", knownFor: "UreaRepair、Anti-Pigment、DermoPure", bestFor: "干燥、色沉、痘肌和功效型药妆需求", pricePositioning: "大众药妆 / 中端" },
};

export function getBrandProfile(name: string): BrandProfile {
  return PROFILES[name] || {
    name,
    country: "品牌资料待核验",
    segment: "Skincare brand",
    description: "该品牌已进入产品目录，但品牌国家、定位和核心技术仍需经过可靠来源补充。",
    knownFor: "请以已核验产品配方为准",
    bestFor: "先查看具体产品的配方与个人匹配依据",
    pricePositioning: "价格待补充",
  };
}
