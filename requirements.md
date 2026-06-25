# 需求文档

## 项目概述

Expense Tracker 是一个智能记账助手，用户通过一句话（文本或语音）即可完成记账，系统自动解析、确认并保存。

## 核心用户故事

用户输入一句话，例如：

- "昨天中午吃饭 35"
- "今天打车去公司 28"
- "工资到账 12000"

系统需要完成：

1. 理解用户意图（记账 / 查账 / 改账）
2. 提取结构化字段（金额、类别、日期、备注）
3. 字段缺失时提示补充
4. 低置信度时请求确认
5. 保存账单并给出自然语言回复

## 功能范围

### 已实现

1. 一句话文本记账
2. 语音录音转写记账
3. 基于 LLM 的意图识别和字段提取
4. 智能助手工具调用（创建、查询、修改、确认、删除）
5. 账单列表查看
6. 月度收支汇总
7. 分类支出占比图表

### 暂未实现

1. 预算管理
2. 多人共享账本
3. OCR 票据识别
4. 多币种支持
5. 高级数据分析
6. 多轮对话纠错

## 技术架构

### 当前实现

| 层 | 技术 |
|---|---|
| 前端框架 | React 19 + Vite + TypeScript |
| 样式 | Tailwind CSS 4 + PostCSS |
| UI 组件 | Radix UI (Slot) + Lucide 图标 + Recharts 图表 |
| 后端框架 | FastAPI (Python) |
| 智能助手 | Deep Agents（LangChain 出品的 Agent 框架） |
| 数据库 ORM | SQLAlchemy |
| 数据库 | PostgreSQL（Docker）/ SQLite（本地回退） |
| LLM | DeepSeek / 兼容 OpenAI API |
| 语音 | MediaRecorder API（前端）+ STT API（后端） |
| 容器 | Docker Compose |

### 智能助手架构

后端使用 Deep Agents 框架构建记账助手，包含 6 个专用工具：

| 工具 | 功能 |
|------|------|
| `create_transaction` | 创建账单（自动分类：餐饮/交通/购物/娱乐/工资/其他） |
| `query_monthly_summary` | 月度收支汇总 |
| `list_recent_transactions` | 最近账单列表 |
| `update_existing_transaction` | 修改账单 |
| `confirm_pending_transaction` | 确认待入账账单 |
| `delete_existing_transaction` | 删除账单 |

LLM 自动判断用户意图并调用对应工具，无需手动路由。

### 历史架构说明

最初版本基于 LangGraph 自建了多节点工作流（Intent → Parse → Validate → Persist），后重构为 Deep Agents。当前代码已全部迁移至 Deep Agents，旧文件已清理。

## 数据库设计

### 账单表（Transaction）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| type | String | expense（支出）/ income（收入） |
| amount | Float | 金额 |
| category | String | 类别：餐饮/交通/购物/娱乐/工资/其他 |
| date | String | 日期（ISO 格式） |
| note | Text | 备注 |
| merchant | String? | 商户名称 |
| source | String | 来源：text / voice |
| status | String | 状态：confirmed / pending |
| createdAt | DateTime | 创建时间 |

### Agent 运行日志表（AgentRunRecord）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| userId | String? | 用户 ID |
| sessionId | String? | 会话 ID |
| rawInput | Text | 原始输入 |
| intent | String? | 识别到的意图 |
| parsedResult | JSON? | 解析结果 |
| confidence | Float? | 置信度 |
| decision | String? | 决策结果 |
| createdAt | DateTime | 创建时间 |

## 前端页面

### 首页（/）

- 一句话文本输入框 + 示例按钮
- 语音录音按钮
- AI 回复展示区
- 近期待确认账单一览
- 月度收支概览卡片

### 账单页（/transactions）

- 按时间排序的账单列表
- 编辑账单（类型、金额、类别、日期、备注、商户）
- 确认入账（待确认 → 已确认）
- 删除账单

### 统计页（/insights）

- 月度收入 / 支出 / 待确认卡片
- 分类支出占比环形图

## 开发原则

1. UI 保持简洁、温暖、质感（暖色调 + 圆角卡片 + 颗粒纹理）
2. 优先使用结构化工具调用，而非自由文本回复
3. 文本和语音复用同一套处理流程
4. 所有待确认记录对用户可见，不静默处理
5. 错误信息明确展示，不静默失败

## 构建优先级

1. ✅ 文本记账
2. ✅ LLM 意图识别 + 字段提取
3. ✅ 确认入账流程
4. ✅ 最近账单列表
5. ✅ 语音输入
6. ✅ 月度统计
7. ✅ 编辑 / 删除账单
