import test from "node:test";
import assert from "node:assert/strict";
import { assessPregnancySafety, isPregnancySafetyMode } from "../src/lib/pregnancySafety.ts";
import type { SkinProfileRecord } from "../src/lib/skinProfile.ts";

function product(ingredients:string[],ingredientListType:"full"|"partial"="full",dataCompleteness=95){
  return {ingredients,ingredientListType,dataCompleteness};
}

test("retinoids are classified as pregnancy risk products",()=>{
  const result=assessPregnancySafety(product(["Water","Glycerin","Retinol"]));
  assert.equal(result.level,"risk");
  assert.ok(result.triggers.some(x=>x.family.includes("维A")));
});

test("hydroquinone is classified as a pregnancy risk product",()=>{
  const result=assessPregnancySafety(product(["Water","Hydroquinone"]));
  assert.equal(result.level,"risk");
});

test("salicylic acid is conservatively classified as pregnancy risk",()=>{
  const result=assessPregnancySafety(product(["Water","Salicylic Acid"]));
  assert.equal(result.level,"risk");
});

test("a complete non-triggering formula is not described as safe",()=>{
  const result=assessPregnancySafety(product(["Water","Glycerin","Niacinamide","Panthenol"]));
  assert.equal(result.level,"no-known-trigger");
  assert.doesNotMatch(result.labelEn,/^safe$/i);
});

test("partial ingredient lists return insufficient data without triggers",()=>{
  const result=assessPregnancySafety(product(["Glycerin","Panthenol"],"partial",55));
  assert.equal(result.level,"insufficient-data");
});

test("saved pregnancy profile answer activates pregnancy safety mode",()=>{
  const profile:SkinProfileRecord={id:"p1",name:"test",isActive:true,skinAnswers:{},profileAnswers:{pregnancy:"yes"},selectedSymptoms:[],symptomAnswers:{},multiSelectAnswers:{},redFlag:null};
  assert.equal(isPregnancySafetyMode(profile),true);
});
