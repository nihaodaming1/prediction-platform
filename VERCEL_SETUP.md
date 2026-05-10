# Vercel 部署配置指南

## 1. 创建 Vercel Postgres 数据库

1. 登录 [Vercel](https://vercel.com)
2. 进入你的项目：`prediction-platform`
3. 点击左侧菜单 **"Storage"**
4. 点击 **"Create Database"**
5. 选择 **"Postgres"**
6. 填写信息：
   - **Name**: `prediction-platform-db`
   - **Region**: 选择最近的地区（如：Washington D.C.）
7. 点击 **"Create"**

## 2. 自动环境变量配置

创建数据库后，Vercel 会**自动添加**环境变量：
- `DATABASE_URL` 会自动添加到你的项目环境变量中
- **不需要手动复制**任何 `.env.local` 文件

## 3. 验证环境变量

在项目设置中检查：
1. 进入 **"Settings"** → **"Environment Variables"**
2. 确认 `DATABASE_URL` 已存在
3. 它应该类似：`postgresql://username:password@host:port/database`

## 4. 重新部署

添加数据库后：
1. Vercel 会自动触发重新部署
2. 或者手动触发：**"Deployments"** → **"Redeploy"**

## 5. 初始化数据库

部署成功后，需要运行数据库迁移：

```bash
# 在本地测试时运行
npx prisma generate
npx prisma db push
```

## 常见问题

### 如果看不到环境变量：
- 刷新页面
- 检查是否在正确的项目中

### 如果部署失败：
- 检查 `DATABASE_URL` 格式是否正确
- 确认数据库区域设置

### Token Label 是什么？
Vercel Postgres **不需要** Token Label，它会自动配置所有必要的连接信息。

## 验证部署

部署成功后，访问你的 Vercel URL 测试 API：
```bash
curl https://your-app.vercel.app/api/admin/reconcile?userId=1
```