# 年轮

长期资产，慢慢长出自己的时间刻度。

年轮是一个本地优先的长期资产仪表盘 PWA。它不做账号、不做登录、不连接服务器、不上传用户数据，用来记录预计持有 1 年以上的资产、持有天数、日均净成本、当前估值、月现金流和长期持有复盘。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Dexie.js / IndexedDB
- vite-plugin-pwa
- Recharts

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址由 Vite 输出。当前项目配置了 `base: /duoshou-app/`，本地访问时通常是：

```text
http://localhost:5173/duoshou-app/
```

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物在 `dist/` 目录。

## 部署

这是纯静态 PWA，可以部署到：

- GitHub Pages
- Cloudflare Pages
- Vercel
- Netlify
- 任意静态文件服务器

如果部署路径不是 `/duoshou-app/`，需要同步调整 `vite.config.ts` 中的 `base`、PWA `start_url` 和 `scope`。

## Android Chrome 安装

1. 用 Android Chrome 打开部署后的网址。
2. 点击右上角菜单。
3. 选择“安装应用”或“添加到主屏幕”。
4. 桌面出现「年轮」图标。
5. 以后从桌面图标打开。
6. 数据保存在手机本地。
7. 定期在设置页导出 JSON 备份。
8. 将 JSON 文件手动保存到百度网盘、NAS、电脑或其他网盘。
9. 换手机或清空浏览器数据前，必须先导出备份。

## 数据存储

所有核心数据保存在当前浏览器的 IndexedDB 中，数据库名为 `duoshou`。应用不会把资产、价格、备注、图片路径、标签或估值上传到任何服务器。

浏览器数据被清除、站点存储被删除或更换手机时，本地数据会丢失。请定期导出 JSON 备份。

## 导出和导入

进入：

```text
设置 -> 备份与恢复
```

可执行：

- 导出全部数据：生成 JSON 备份文件
- 导入备份：读取 JSON 并覆盖当前数据
- 本地快照恢复：导入或清空前自动保存最近 10 个快照

导入前会校验 `appName`、`schemaVersion`、`assets`、`categories`、`tags` 等字段。导入失败不会覆盖当前数据。

## 常用命令

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## 产品边界

本项目不是传统记账软件，也不是交易仓或投资组合软件，不记录银行卡流水、微信账单、支付宝账单、现金流水、短线交易或预算。核心目标是长期回答：

我长期持有什么。持有多久。每天净成本多少。现在估值多少。能不能带来稳定现金流。
