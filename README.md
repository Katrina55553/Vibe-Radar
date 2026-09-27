# Vibe Coding 雷达

基于 React 19、Vite 8 和 TypeScript 的静态项目榜单。

## 开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
npm run build
```

## GitHub 动态榜数据

```bash
# 只预览抓取结果，不改文件
npm run update:github:dry

# 更新快照与历史数据
npm run update:github
```

`.github/workflows/update-github-radar.yml` 会在每周五 08:07（Asia/Shanghai）抓取新候选，计算与约 7 天前快照的 Star 增长，验证项目后自动提交数据文件。也可以在 GitHub Actions 页面手动运行。

## 目录

- `src/components`：页面与交互组件
- `src/data`：项目榜、明星项目和筛选选项
- `scripts`：GitHub 候选发现、快照与增长计算
- `src/domain`：分类、评分、搜索和推荐规则
- `src/hooks`：浏览器持久化 Hook
- `src/styles`：全局视觉样式
