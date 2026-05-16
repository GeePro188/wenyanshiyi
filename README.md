# 文言拾遗

面向高中文言文学习的渐进式 Web 应用。内置高考核心实词与虚词词库，支持每日一练、词语搜索、一词多义辨析、古今异义对比等功能。

## 功能

- **每日一练** — 自选 5/10/15 题，实词虚词按比例穿插出题，完成后显示成绩结算
- **词语搜索** — 全文模糊搜索（分词/释义/例句/同义词），精准结果优先排序
- **一词多义** — 每个义项独立出题，关联词语悬浮预览 + 查看详解
- **古今异义** — 古义/今义对照卡片，配例句出处
- **多例句支持** — 每个义项支持多条例句，出题时随机选取，搜索/详情页展示全部例句
- **我的墨盒** — 词典式浏览，内置/导入词库切换，实词/虚词筛选
- **错题回顾** — 点击错题进入专项刷题页，逐义项检测
- **等级系统** — 10 级文言文等级（蒙童→文宗），基于刷题量自动晋级
- **数据持久化** — 所有练习记录、错题、等级、主题偏好保存在 localStorage
- **主题色切换** — 设置页面提供朱砂红、竹青绿、靛青蓝、琥珀橙、墨黑五种主题色
- **词库导入** — 支持标准 JSON 格式自定义词库导入，兼容 v1/v2 两种词库格式

## 词库格式

```json
{
  "meta": { "format_version": "2.0", "updated": "2026-05-04" },
  "vocabularies": [
    {
      "id": "my_vocab",
      "name": "自定义词库",
      "description": "描述",
      "words": [
        {
          "word": "字",
          "basic_meaning": "基本释义",
          "polysemy": [
            {
              "meaning": "义项",
              "examples": [
                { "sentence": "例句1", "source": "出处1" },
                { "sentence": "例句2", "source": "出处2" }
              ]
            }
          ],
          "ancient_modern_diff": {
            "ancient": "古义", "modern": "今义",
            "examples": [
              { "sentence": "例句", "source": "出处" }
            ]
          },
          "synonyms": ["同义词"],
          "near_synonyms": ["近义词"],
          "antonyms": ["反义词"],
          "notes": "补充说明"
        }
      ]
    }
  ]
}
```

> `ancient_modern_diff` 可为 `null`；`synonyms`、`near_synonyms`、`antonyms`、`notes` 可为空数组或空字符串。
> `examples` 数组支持多个例句，出题时随机选取一个；兼容旧版 `example`/`source` 单例句格式。

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | Composition API (`<script setup>`) |
| Vite 6 | 开发/构建 |
| Tailwind CSS 3 | class 暗色模式，自定义主题色 |
| lucide-vue-next | 图标库 |
| localStorage | 数据持久化 |

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
wenyanshiyi/
├── design/
│   ├── design.html                           # 原始 HTML 原型
│   ├── example.json                          # 词库格式示例
│   ├── high_school_classical_chinese_vocabulary.json  # 主词库 v2（108 词）
│   └── high_school_all_vocabularies.json     # 原始全词库数据
├── src/
│   ├── main.js                                # 应用入口
│   ├── style.css                              # 全局样式 + Tailwind
│   ├── App.vue                                # 主布局 + 路由 + 主题
│   ├── composables/
│   │   └── useVocabulary.js                   # 核心状态管理（词库/刷题/统计/持久化/等级）
│   └── views/
│       ├── PracticeView.vue                   # 每日一练
│       ├── SearchView.vue                     # 词语搜索
│       ├── CollectionView.vue                 # 我的墨盒
│       ├── ProfileView.vue                    # 个人中心
│       ├── WordQuizView.vue                   # 词语专项刷题
│       └── SettingsView.vue                   # 设置（主题/关于）
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 等级体系

| 等级 | 称号 | 需刷题数 |
|------|------|---------|
| 1 | 蒙童 | 0–9 |
| 2 | 童生 | 10–29 |
| 3 | 秀才 | 30–79 |
| 4 | 举人 | 80–199 |
| 5 | 贡士 | 200–499 |
| 6 | 进士 | 500–999 |
| 7 | 翰林 | 1000–1999 |
| 8 | 学士 | 2000–4999 |
| 9 | 太傅 | 5000–9999 |
| 10 | 文宗 | 10000+ |
