# Expense Tracker

智能记账助手，支持一句话文本记账和语音记账。

## 功能

- **一句话记账** — 输入"昨天中午吃饭 35"，自动识别金额、类别、日期
- **语音记账** — 录音后自动转写成文字并记账
- **智能识别** — 基于 LLM 的意图识别和字段提取，低置信度自动提醒
- **账单管理** — 查看、编辑、确认、删除账单记录
- **数据统计** — 月度收支汇总和分类占比图表

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| 后端 | FastAPI + Deep Agents (LangChain) |
| 数据库 | PostgreSQL (Docker) / SQLAlchemy |
| AI | DeepSeek / 兼容 OpenAI API 的 LLM |
| 容器 | Docker Compose |

## 项目结构

```
expense-tracker/
├── frontend/              # React + Vite 前端
│   ├── components/        # UI 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # API 客户端和工具
│   ├── src/
│   │   ├── pages/         # 路由页面
│   │   └── styles/        # 全局样式
│   └── types/             # TypeScript 类型
├── backend/               # FastAPI 后端
│   ├── app/
│   │   ├── agent/         # Deep Agents 智能助手
│   │   │   ├── tools.py   # 6 个自定义工具函数
│   │   │   ├── agent.py   # Agent 构建
│   │   │   └── services/  # 业务编排
│   │   ├── routes/        # HTTP 路由
│   │   ├── repositories.py # 数据库操作
│   │   └── db.py          # 数据库连接
│   └── tests/
├── requirements.md        # 需求文档
└── docker-compose.yml     # 一键启动
```

## 快速开始

### 前置要求

- Docker Desktop
- LLM API Key（DeepSeek / OpenAI 兼容）

### 配置

编辑 `.env` 文件：

```env
LLM_API_KEY="你的 API Key"
```

### 启动

```bash
docker compose up --build
```

然后访问：

- 前端：http://localhost:3000
- 后端健康检查：http://localhost:8000/health

## 本地开发

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 测试

```bash
# 前端类型检查
npm run typecheck

# 前端构建
npm run build

# 后端测试
python3 -m unittest discover -s backend/tests
```

## 需求文档

详细需求、技术架构、数据库设计、前端页面说明见 [requirements.md](./requirements.md)。

## 智能助手

后端使用 Deep Agents（LangChain 出品的 Agent 框架）构建记账助手，包含 6 个专用工具：

| 工具 | 功能 |
|------|------|
| `create_transaction` | 创建账单（自动分类） |
| `query_monthly_summary` | 月度收支汇总 |
| `list_recent_transactions` | 最近账单列表 |
| `update_existing_transaction` | 修改账单 |
| `confirm_pending_transaction` | 确认待入账 |
| `delete_existing_transaction` | 删除账单 |

LLM 自动判断用户意图并调用对应工具，无需手动路由。
