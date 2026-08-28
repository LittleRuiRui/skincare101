import { describe, expect, it } from "vitest";
import { assessPregnancySafety, isPregnancySafetyMode } from "../src/lib/pregnancySafety";
import type { SkinProfileRecord } from "../src/lib/skinProfile";

function product(ingredients:string[],ingredientListType:"full"|"partial"="full",dataCompleteness=95){
  return {ingredients,ingredientListType,dataCompleteness};
}

describe("pregnancy safety engine",()=>{
  it("marks topical retinoids as avoid",()=>{
    const result=assessPregnancySafety(product(["Water","Glycerin","Retinol"]));
    expect(result.level).toBe("avoid");
    expect(result.triggers.some(x=>x.family.includes("维A"))).toBe(true);
  });

  it("marks hydroquinone as avoid",()=>{
    const result=assessPregnancySafety(product(["Water","Hydroquinone"]));
    expect(result.level).toBe("avoid");
  });

  it("treats salicylic acid conservatively as caution when concentration is unknown",()=>{
    const result=assessPregnancySafety(product(["Water","Salicylic Acid"]));
    expect(result.level).toBe("caution");
  });

  it("does not call a complete non-triggering formula pregnancy-safe",()=>{
    const result=assessPregnancySafety(product(["Water","Glycerin","Niacinamide","Panthenol"]));
    expect(result.level).toBe("no-known-trigger");
    expect(result.labelEn).not.toMatch(/^safe$/i);
  });

  it("returns insufficient data for a partial ingredient list without triggers",()=>{
    const result=assessPregnancySafety(product(["Glycerin","Panthenol"],"partial",55));
    expect(result.level).toBe("insufficient-data");
  });

  it("activates from the saved pregnancy profile answer",()=>{
    const profile:SkinProfileRecord={
      id:"p1",name:"test",isActive:true,skinAnswers:{},profileAnswers:{pregnancy:"yes"},selectedSymptoms:[],symptomAnswers:{},multiSelectAnswers:{},redFlag:null,
    };
    expect(isPregnancySafetyMode(profile)).toBe(true);
  });
});
