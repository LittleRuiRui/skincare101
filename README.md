# SkinContext

可解释的肤质建档、成分匹配和产品推荐 Web App。生产网站使用 GitHub Pages，审核产品库、用户投稿和私有图片使用 Supabase；SQLite 是可重复生成的离线备份。

## 300 款试验产品库

当前产品库使用 300 款产品作为分类、配方分析、推荐排序和页面性能的验证样本：100 款来自 YesStyle 2026 上半年按品类销量排列的亚洲护肤榜单，其余来自 Open Beauty Facts 的热度候选。缺少可核验配料表的热门产品仍可搜索，但不会获得证据型推荐分数。

第一轮已补强 50 款热门产品：保存有顺序的前 10–15 位成分（短配方保存完整列表），并区分 `top15_formula_verified` 与 `full_formula_verified`。推荐列表从轻量视图读取最多 15 位成分；完整审核数据仍保留在原视图，避免把大段分析 JSON 一次性传到浏览器。

Open Beauty Facts 产品数据由其社区贡献者提供，采用 Open Database License（ODbL 1.0）。本仓库保留条码、来源链接、热门度口径和质量标记，并按相同数据库许可重新发布衍生数据。YesStyle 排名事实均链接并注明其 2026 年 6 月榜单来源。

## 开发

```bash
npm ci
npm run typecheck
npm test
npm run data:enrichment-sql
npm run dev
```

Supabase 浏览器配置使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。仓库内只允许 publishable key；不要将 secret key 或 `service_role` key 放入前端、环境样例或 GitHub Pages 构建。

## 数据库

迁移文件位于 `supabase/migrations/`，包含：

- 审核后的产品、配方版本、标准成分和配方顺序；
- 用户投稿、私有成分照片和审核记录；
- 所有公开表的 RLS、最小权限 GRANT 和审核 RPC；
- 8 款初始审核产品、300 款候选试验数据的来源字段，以及首批 50 款配方补强数据。

投稿状态：`draft → pending → reviewing → approved / rejected`。普通用户只能读取和修改自己的草稿；匿名访客只能读取公开审核目录及其轻量摘要视图；审核身份来自不可由用户修改的 `app_metadata.role`。

### 登录回调

在 Supabase Dashboard 的 **Authentication → URL Configuration** 中设置：

- Site URL：`https://littleruirui.github.io/skincare101/`
- Redirect URL：`https://littleruirui.github.io/skincare101/`
- 本地开发可额外加入：`http://localhost:5173/skincare101/`

### 指定审核员

用户至少登录一次后，在 Supabase SQL Editor 由项目管理员执行（替换邮箱）：

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"reviewer"}'::jsonb
where email = 'reviewer@example.com';
```

该用户需要退出并重新登录，以刷新 JWT 中的 `app_metadata`。

## SQLite 离线备份

```bash
npm run backup:sqlite
```

脚本只通过公开审核视图读取数据，并生成 `data/skincare.db`。它不会导出用户资料、投稿草稿、审核内部备注或私有照片。
