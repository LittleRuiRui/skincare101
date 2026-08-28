import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const UI_DIRS=[path.join(ROOT,"src","components"),path.join(ROOT,"src")];
const legacyAllowlist=new Set([
 "src/App.tsx","src/V4App.tsx","src/V5App.tsx",
 "src/components/EmailAccountPanel.tsx","src/components/FirstRunOnboarding.tsx","src/components/MyProductHistory.tsx","src/components/MyShelf.tsx","src/components/OnboardingComplete.tsx","src/components/ProductContributionPanel.tsx","src/components/ProductPurchaseLinks.tsx","src/components/ProfileSavePanel.tsx","src/components/ReviewerQueue.tsx","src/components/SkincareKnowledgeCards.tsx","src/components/UserCenter.tsx","src/components/V3Explore.tsx","src/components/V3Home.tsx","src/components/V3IngredientCheck.tsx","src/components/V3MatchHub.tsx","src/components/V3MySkin.tsx","src/components/V3ProductDetail.tsx","src/components/V3ProductScanner.tsx","src/components/V3RoutineBuilder.tsx","src/components/V3RoutineCheckins.tsx","src/components/V3RoutineCommunity.tsx","src/components/V3RoutineHub.tsx","src/components/V3SkinGuidance.tsx","src/components/WatercolorConcernPreview.tsx","src/components/WatercolorMotifs.tsx"
]);
const exempt=new Set(["src/components/LanguageConsistencyGuard.tsx","src/components/BilingualProductName.tsx","src/components/BilingualIngredientList.tsx"]);

function walk(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const p=path.join(dir,entry.name);return entry.isDirectory()?walk(p):[p]}):[]}
const files=[...new Set(UI_DIRS.flatMap(walk))].filter(f=>/\.tsx$/.test(f));
const failures=[];
for(const file of files){
 const rel=path.relative(ROOT,file).replaceAll("\\","/");
 if(exempt.has(rel)||legacyAllowlist.has(rel))continue;
 const text=fs.readFileSync(file,"utf8");
 const hasCjk=/[\u3400-\u9fff]/.test(text);
 const hasLanguageApi=/useLanguage\s*\(|\bt\s*\(|localizeDynamic|display(Category|SkinLabel|Goal|RoutineStep|RoutineNote|FormulaLabel|Confidence)/.test(text);
 if(hasCjk&&!hasLanguageApi)failures.push(`${rel}: contains Chinese UI copy but does not use the language/localization API`);
 if(/[\u3400-\u9fff][^\n"']{0,36}·[^\n"']{0,36}[A-Za-z]|[A-Za-z][^\n"']{0,36}·[^\n"']{0,36}[\u3400-\u9fff]/.test(text))failures.push(`${rel}: contains a mixed Chinese/English display literal; render one locale at a time`);
 if(/\.category\s*\}/.test(text)&&!/displayCategory/.test(text))failures.push(`${rel}: renders product.category directly; use displayCategory(value, language)`);
}
if(failures.length){console.error("i18n audit failed:\n- "+failures.join("\n- "));process.exit(1)}
console.log(`i18n audit passed for ${files.length} UI files. Existing legacy files are explicitly allowlisted; any new UI file must use locale APIs and cannot introduce mixed-language literals.`);
