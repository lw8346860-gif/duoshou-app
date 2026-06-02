# 剁手

买的时候冲动，以后慢慢算账。

剁手是一个本地优先的个人消费资产管理 PWA。它不做账号、不做登录、不连接服务器、不上传用户数据，用来记录买过的东西、使用天数、日均成本、当前估值、卖出损益、闲置风险和消费复盘。

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
4. 桌面出现「剁手」图标。
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

- 导出全部数据：生成 `duoshou-backup-YYYY-MM-DD-HH-mm.json`
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

本项目不是传统记账软件，不记录银行卡流水、微信账单、支付宝账单、收入、预算或投资收益。核心目标是长期回答：

买过什么。用了多久。每天多少钱。现在还值多少。最后值不值。
