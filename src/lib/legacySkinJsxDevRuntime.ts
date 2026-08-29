// @ts-nocheck
import{Fragment,jsxDEV as reactJsxDEV}from"../../node_modules/react/jsx-dev-runtime.js";
import{legacySkinLanguage,localizeLegacySkinValue,shouldLocalizeLegacySkin}from"./legacySkinText";
const DISPLAY_PROPS=new Set(["children","label","sub","title","body","placeholder","aria-label","alt"]);
function localizedProps(props:any){if(!props||!shouldLocalizeLegacySkin())return props;const language=legacySkinLanguage();let changed=false;const next={...props};for(const key of DISPLAY_PROPS){if(!(key in props))continue;const value=localizeLegacySkinValue(props[key],language);if(value!==props[key]){next[key]=value;changed=true}}return changed?next:props}
export{Fragment};
export function jsxDEV(type:any,props:any,key:any,isStaticChildren:any,source:any,self:any){return reactJsxDEV(type,localizedProps(props),key,isStaticChildren,source,self)}
