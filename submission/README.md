# 月见塔罗 — 理解语境的 AI 塔罗咨询

一个已完成并通过部署校验的全栈 Web 应用（Node/Express + React + AI）。

## 产品是什么

不是"抽牌看运势"的玩具，而是一次**结构化的 AI 咨询对话**：

1. 用户描述自己的困扰（换工作、感情抉择、家庭矛盾……）
2. AI 提取语境（发生了什么 / 选项 / 情绪 / 价值观 / 顾虑），不足时**先反问澄清**（最多两轮）
3. AI 基于语境生成**定制的咨询问题**和三牌位牌阵（每个位置的"看什么"随处境变化）
4. **用户亲手**从 22 张洗好的塔罗牌中选 3 张（程序随机洗牌、用户自由挑选，AI 不干预抽牌）
5. AI 结合语境 + 牌面 symbolism 做**个性化解读**，明确保留不确定性，不替用户做决定
6. 用户可继续**追问、纠正、修订**解读，多轮对话沿同一牌面展开

会话状态由前端 localStorage 持有，服务端完全无状态，随时可清空重来。

## 技术架构

```
web/            React 单页前端（Vite 构建，产物输出到 static/）
app/            Express 后端
  server.js     5 个 API 路由 + 静态服务
  deck.js       22 张塔罗牌库（牌义为服务端权威数据，不信任客户端）
  prompts.js    提示词模板 + JSON schema 输出校验
guard_sdk/      AI 调用 SDK（凭据走工程根目录 ai.properties，绝不下发前端）
static/         前端构建产物（npm run build 生成）
```

### API

| 路由 | 作用 | AI |
|---|---|---|
| POST /api/understand | 语境提取 + 澄清问题 | ✅ |
| POST /api/spread | 咨询问题 + 定制牌阵 | ✅ |
| POST /api/draw | 洗牌（22 张随机排列，用户选 3 张） | ❌ 纯程序随机 |
| POST /api/interpret | 结合语境的个性化解读 | ✅ |
| POST /api/followup | 追问 / 纠正 / 修订（沿用原牌面） | ✅ |

### 工程亮点

- **AI 输出强校验**：所有模型输出必须通过 JSON schema 校验，失败自动带上下文重试一次，再失败返回明确错误——前端永远拿到结构化数据
- **演示模式兜底**：未配置 AI 凭据时全流程可走通（返回演示数据），配置后无缝切换真实模型
- **服务端无状态**：会话在前端；牌义数据按 id 在服务端重新取权威数据，客户端无法伪造解读输入
- **输入清洗**：所有用户输入限长、类型校验，拒绝超限与畸形 payload
- **洗牌与解读解耦**：抽牌是纯随机（不信"AI 手气"），解读才用 AI——把"仪式感"还给用户，把"理解"交给模型

## 本地运行

```sh
npm install        # 安装依赖
npm run build      # 构建前端到 static/
sh start.sh        # 启动（默认 3000，可用 APP_PORT 覆盖；监听 0.0.0.0）
```

访问 `http://localhost:3000/`，`/healthz` 返回 `{"status":"ok"}`。

AI 能力需要 OpenAI-compatible 端点凭据（`ai.properties`，由部署环境注入，不入库不分发）。
未配置时应用以演示模式运行，全流程可体验。

## 在 CoWork 平台部署

本工程为 CoWork Guard 子应用格式，通过 guard CLI 校验与打包：

```sh
python3 <guard-skill>/cli/guard.py verify .   # 依赖安装 + 构建 + 烟测（全 [OK]）
python3 <guard-skill>/cli/guard.py pack .     # 产出可部署 zip
```

本次交付的 `tarot.zip` 即 verify + pack 双全绿后的产物（install/start/health 脚本位于 zip 顶层，AI 凭据已排除，由平台运行时注入）。
