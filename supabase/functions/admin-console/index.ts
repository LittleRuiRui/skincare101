import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")!,serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 if(!token) return json({error:"Unauthorized"},401);
 const {data:{user},error:userError}=await admin.auth.getUser(token);
 if(userError||!user) return json({error:"Unauthorized"},401);
 const {data:adminRow}=await admin.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
 if(!adminRow) return json({error:"Forbidden"},403);
 const body=await req.json().catch(()=>({}));
 if(body.action==="listUsers"){
   const page=Math.max(1,Number(body.page)||1),perPage=Math.min(100,Math.max(1,Number(body.perPage)||50));
   const {data,error}=await admin.auth.admin.listUsers({page,perPage});
   if(error) return json({error:error.message},400);
   return json({users:data.users.map(u=>({id:u.id,email:u.email||"",created_at:u.created_at,last_sign_in_at:u.last_sign_in_at||null}))});
 }
 if(body.action==="sendPasswordReset"){
   const email=String(body.email||"").trim();
   if(!email||!email.includes("@")) return json({error:"Valid email required"},400);
   const redirectTo=String(body.redirectTo||"").trim()||undefined;
   const {error}=await admin.auth.resetPasswordForEmail(email,redirectTo?{redirectTo}:undefined);
   if(error) return json({error:error.message},400);
   return json({ok:true});
 }
 return json({error:"Unknown action"},400);
});