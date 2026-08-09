# SkinContext

可解释的肤质建档、成分匹配和产品推荐 Web App。生产网站使用 GitHub Pages，审核产品库、用户投稿和私有图片使用 Supabase；SQLite 是可重复生成的离线备份。

## 开发

```bash
npm ci
npm run typecheck
npm test
npm run dev
```

Supabase 浏览器配置使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。仓库内只允许 publishable key；不要将 secret key 或 `service_role` key 放入前端、环境样例或 GitHub Pages 构建。

## 数据库

迁移文件位于 `supabase/migrations/`，包含：

- 审核后的产品、配方版本、标准成分和配方顺序；
- 用户投稿、私有成分照片和审核记录；
- 所有公开表的 RLS、最小权限 GRANT 和审核 RPC；
- 8 款初始审核产品。

投稿状态：`draft → pending → reviewing → approved / rejected`。普通用户只能读取和修改自己的草稿；匿名访客只能读取 `approved_product_catalog`；审核身份来自不可由用户修改的 `app_metadata.role`。

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
