import fs from"node:fs";
const migration="supabase/migrations/20260828190000_admin_qa_data_governance.sql";
const required=["canonical_key","canonical_product_id","brand_profiles","govern_product_write","admin_duplicate_candidates","admin_formula_version_conflicts","admin_product_write_gaps","is_admin"];
if(!fs.existsSync(migration)){console.error(`catalog governance audit failed: missing ${migration}`);process.exit(1)}
const sql=fs.readFileSync(migration,"utf8");const missing=required.filter(x=>!sql.includes(x));if(missing.length){console.error("catalog governance audit failed; missing rules: "+missing.join(", "));process.exit(1)}
const admin=fs.readFileSync("src/components/AdminDashboard.tsx","utf8");if(!admin.includes("admin_qa_summary")||!admin.includes("admin-console")){console.error("catalog governance audit failed: admin QA console is not wired to database/auth controls");process.exit(1)}
const recovery=fs.readFileSync("src/components/PasswordRecoveryPanel.tsx","utf8");if(!recovery.includes("updateUser({password:")){console.error("catalog governance audit failed: password recovery UI missing");process.exit(1)}
console.log("catalog governance audit passed: canonical products, brand profiles, QA queues, admin auth and recovery controls are present.");