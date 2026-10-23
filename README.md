# IE / 反复思考

Astro + 自定义界面的个人安全研究博客。纯静态构建，不需要数据库或后台服务。

## 本地运行

需要 Node.js 24。

```sh
npm ci
npm run dev
```

打开终端给出的本地地址。生产检查：

```sh
npm run build
npm run check
npm run verify
npm run preview
```

## 已完成

- 自定义响应式首页、文章归档、关于、404。
- 冷蓝色强调色、置顶漏洞分析、作者侧栏、CVE/比赛/技术类型标识。
- Apache Shiro、Web 组件漏洞、SSRF 三个研究专题。专题在 `src/lib/topics.ts` 中维护。
- 标题、摘要、标签、正文搜索，快捷键 Ctrl/Cmd + K。
- 分类、标签、关键词组合筛选；筛选条件保存在网址中。
- 深浅色主题；文章目录、阅读进度、代码复制。
- RSS、站点地图、canonical、Open Graph、robots.txt。
- 迁移 8 篇技术文章与原 About Me，保留原文日期路径。
- About Me 与其余文章一样出现在首页、归档、搜索和 RSS；导航“关于我”直接打开原文。
- 为原归档、分类、标签与分页提供 30 条兼容跳转，覆盖本地旧站与远程线上旧站的地址。
- 原「迷茫」无正文，保存在 `migration/drafts/`，未发布。

## 写文章

在 `src/content/posts/` 新建 Markdown：

```yaml
---
title: 文章标题
date: "2026-10-23"
categories: 安全研究
tags:
  - Web
description: 用一两句话说明文章解决的问题。
legacyPath: /2026/10/23/my-new-note/
---
```

`legacyPath` 为文章的正式地址。迁移文章沿用旧地址，新文章可自定义，不要与已有地址重复。分类建议：安全研究、CTF、实验记录、工具与环境、随笔。

图片放在 `public/images/`，通过 `/images/文件名.png` 引用。正文代码块请标明语言；例如 `javascript`、`python`、`bash`、`http`、`text`。代码复制依赖安全上下文（localhost 或 HTTPS）。

`src/styles/global.css` 顶部是颜色、字体变量；`src/pages/index.astro` 是首页；`src/layouts/Article.astro` 是文章模板。

## 部署到原 GitHub Pages

此目录是独立的新源码项目。原 Hexo 目录 `../ydnd` 保持原样。**不要在旧生成目录中直接混入新项目文件。**

1. 备份远程 `ydnd/ydnd.github.io` 的当前分支，以及旧 Hexo 源码。
2. 将本目录的源码作为该仓库的根目录（不包含 `node_modules`、`dist`）。提交 `package-lock.json` 与 `.github/workflows/deploy.yml`。
3. 在 GitHub 仓库 Settings → Pages 中将 Source 设置为 GitHub Actions。
4. 推送 main 分支，工作流会构建、检查链接，再部署到 `https://ydnd.github.io/`。

工作流在每次推送 `main` 后自动检查、构建并发布。首次切换前保留旧站点分支 `backup/hexo-before-astro-20261023`，方便回退。

## 迁移说明

`migration/manifest.json` 列出保留的文章地址。`scripts/migrate.mjs` 为首次迁移工具，会重写迁入文章，开始编辑后不要重复运行。

迁移清单中的 `bodySha256` 保存原文正文的校验值，CI 无需旧 Hexo 目录即可验证迁移完整性。主动修订历史文章后，需要同步更新对应校验值；新增文章无需加入迁移清单。

文章保留原始标题与完整正文，技术文章摘要依据原文内容概括；About Me 的摘要摘自原文。站内分类显示为安全研究、CTF、实验分析、工具与环境、个人文章，原分类标识保留以兼容旧链接。`scripts/restore-authored-content.mjs` 为迁移校正工具，开始编辑新项目后不要重复运行。原截图按现有资源目录复制，未使用原二次元头图。技术内容仍为原文的历史研究记录，未进行漏洞结论或版本范围的重新审计。
