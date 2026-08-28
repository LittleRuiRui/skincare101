import test from"node:test";
import assert from"node:assert/strict";
import{readFileSync}from"node:fs";

function source(path:string){return readFileSync(new URL(`../${path}`,import.meta.url),"utf8")}

test("production entry uses the single app shell",()=>{
 const v6=source("src/V6App.tsx");
 const shell=source("src/AppShell.tsx");
 assert.match(v6,/AppShell/);
 assert.doesNotMatch(v6,/V5App|V4App|\.\/App["']/);
 assert.doesNotMatch(shell,/V5App|V4App|LegacyApp|\.\/App["']/);
});

test("product context actions do not infer state from the DOM",()=>{
 for(const path of["src/components/ProductCollectionActions.tsx","src/components/FloatingContextActions.tsx"]){
  const text=source(path);
  assert.doesNotMatch(text,/MutationObserver/);
  assert.doesNotMatch(text,/querySelector\s*\(/);
  assert.doesNotMatch(text,/loadSharedProductCatalog/);
  assert.match(text,/useAppRuntime/);
 }
});

test("analytics consumes navigation events instead of DOM mutation scans",()=>{
 const analytics=source("src/components/AnalyticsBootstrap.tsx");
 assert.doesNotMatch(analytics,/MutationObserver/);
 assert.match(analytics,/skincare101:navigation/);
});

test("catalog loading is centralized in app runtime",()=>{
 const runtime=source("src/lib/appRuntime.tsx");
 assert.match(runtime,/loadSharedProductCatalog/);
 const shell=source("src/AppShell.tsx");
 assert.doesNotMatch(shell,/loadSharedProductCatalog|loadMySkinProfiles|loadShelfSynced/);
});
