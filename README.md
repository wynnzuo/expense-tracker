# 记账助手

智能记账助手，支持一句话记账、语音录入、AI 自动分类和统计。

## 功能

- **聊天式记账** — 输入"中午吃饭 35"，AI 自动识别金额、类别、日期
- **语音录入** — 点击麦克风录音，自动转写并识别
- **HITL 确认流程** — AI 解析后展示结构化数据，确认后才保存
- **账单管理** — 查看、编辑、删除历史账单
- **数据统计** — 月度收支、本周对比、日均支出、分类占比图表

## 截图

```
😎 中午吃饭 35
🤖 请确认：

┌─ 📋 确认记账 ──────────────┐
│  中午吃饭          -¥35    │
│  餐饮 · 支出 · 2026-06-25  │
│                             │
│  [✓确认记账]  [✏️修改]  [✕不要] │
└─────────────────────────────┘
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| 后端 | FastAPI + Deep Agents (LangChain) |
| 数据库 | PostgreSQL (Docker) / SQLite（本地回退） |
| LLM | DeepSeek / 兼容 OpenAI API |
| 语音 | DashScope Recognition API (`paraformer-realtime-v2`) |
| 容器 | Docker Compose |

## 快速开始

### 前置要求

- Docker Desktop
- LLM API Key（DeepSeek / OpenAI 兼容）

### 配置

复制 `.env.example` 为 `.env`，填入 API Key：

```env
LLM_API_KEY="sk-xxx"
```

### Docker 启动

```bash
docker compose up --build
```

- 前端：http://localhost:3000
- 后端：http://localhost:8000/docs

### 本地开发

**前端：**
```bash
cd frontend
npm install
npm run dev
```

**后端：**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 项目结构

```
expense-tracker/
├── frontend/               # React + Vite
│   ├── components/         # UI 组件
│   │   ├── chat-message.tsx    # 聊天气泡
│   │   ├── home-client.tsx     # 对话界面 + HITL 卡片
│   │   ├── insight-chart.tsx   # 饼图组件
│   │   ├── site-shell.tsx      # 导航框架
│   │   └── ui/                 # 基础 UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/api.ts          # API 客户端
│   ├── src/pages/          # 路由页面
│   └── types/              # TypeScript 类型
├── backend/                # FastAPI + Deep Agents
│   ├── app/
│   │   ├── agent/          # 智能助手
│   │   │   ├── tools.py    # 6 个工具函数
│   │   │   ├── agent.py    # Agent 构建
│   │   │   └── services/   # 业务编排
│   │   ├── routes/         # HTTP 路由
│   │   ├── stt.py          # 语音转写（DashScope）
│   │   ├── repositories.py # 数据库操作
│   │   └── db.py           # 数据库连接
│   └── tests/
├── requirements.md         # 需求文档
└── docker-compose.yml
```

## 智能助手

后端使用 [Deep Agents](https://github.com/langchain-ai/deepagents)（LangChain 出品的 Agent 框架）构建，包含 6 个工具：

| 工具 | 说明 |
|------|------|
| `create_transaction` | 解析输入，返回结构化预览（不自动保存） |
| `query_monthly_summary` | 本月收支 + 日均支出汇总 |
| `list_recent_transactions` | 最近账单列表 |
| `update_existing_transaction` | 修改账单 |
| `confirm_pending_transaction` | 确认入账 |
| `delete_existing_transaction` | 删除账单 |

LLM 自动识别用户意图并调用对应工具。

## 需求文档

详见 [requirements.md](./requirements.md)。
