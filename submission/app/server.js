// app/server.js — 月见塔罗：理解语境的 AI 塔罗咨询后端。
//
// 路由：
//   POST /api/understand  语境提取 + 澄清问题生成（AI）
//   POST /api/spread      咨询问题 + 定制牌阵生成（AI）
//   POST /api/draw        程序抽牌（随机 3 张不重复，与语境无关，非 AI）
//   POST /api/interpret   结合语境的个性化解读（AI）
//   POST /api/followup    追问 / 纠正 / 修订（AI，沿用原牌面）
//   GET  /api/health/modules  模块自检
//
// 服务端无状态：会话状态由前端持有并随请求传入；
// 抽到的牌按 id 从服务端牌库重新取权威数据，不信任客户端牌义文本。
// 模型经 guard_sdk/ai 调用，密钥只存在于 ai.properties，绝不下发前端。

const path = require("path");
const express = require("express");
const ai = require("../guard_sdk/ai");
const deck = require("./deck");
const P = require("./prompts");

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "256kb" }));

const STATIC_DIR = path.resolve(__dirname, "..", "static");

// ---------- 通用工具 ----------

const AI_TIMEOUT_MS = 90_000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("ai_timeout")), ms)),
  ]);
}

function fail(res, status, code, message) {
  res.status(status).json({ ok: false, code, message });
}

// 输入校验（轻量）
function cleanStr(v, maxLen) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > maxLen) return null;
  return t;
}

function readSessionSlice(req) {
  const b = req.body || {};
  const description = cleanStr(b.description, 3000);
  const clarify = Array.isArray(b.clarify)
    ? b.clarify
        .slice(0, 4)
        .map((c) => ({
          question: cleanStr(c && c.question, 300) || "",
          answer: cleanStr(c && c.answer, 3000) || "",
        }))
        .filter((c) => c.question)
    : [];
  return { description, clarify };
}

// ---------- AI 调用：JSON 输出 + 单次重试 + 校验 ----------

async function chatValidated({ task, context, validate, maxTokens }) {
  const system = `${P.CONSTITUTION}\n\n${task}`;
  const messages = [{ role: "user", content: context }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const round = attempt === 0 ? messages : [
      ...messages,
      { role: "assistant", content: "（上一次输出被系统拒绝，本次重新输出）" },
      {
        role: "user",
        content:
          "你上一次的输出不是合法 JSON 或不符合 schema。请重新输出：只输出一个符合 schema 的 JSON 对象，不要任何解释、markdown 围栏或多余文字。",
      },
    ];
    let raw;
    try {
      raw = await withTimeout(ai.chat(round, { system, maxTokens }), AI_TIMEOUT_MS);
    } catch (e) {
      throw new Error("ai_call_failed: " + (e && e.message ? e.message : String(e)));
    }
    const parsed = P.tryParseJson(raw);
    if (!parsed.ok) {
      if (attempt === 1) throw new Error("model_json_invalid: " + parsed.reason);
      continue;
    }
    const v = validate(parsed.data);
    if (!v.ok) {
      if (attempt === 1) throw new Error("model_schema_invalid: " + v.reason);
      continue;
    }
    return v.data;
  }
  throw new Error("unreachable");
}

// ---------- 演示模式兜底（仅在 ai.properties 缺失时） ----------

function demoUnderstanding({ description, clarify }) {
  return {
    mode: "demo",
    empathy: "我听到了你说的这件事。（演示模式：尚未连接真实模型）",
    understanding: {
      happening: [description.slice(0, 60)],
      options: [],
      emotions: [],
      values: [],
      constraints: [],
      missing: ["整件事的具体处境", "你面对的选项", "最主要的担忧"],
    },
    need_clarify: true,
    clarify_question: "在这件事里，最让你放不下的具体是什么？",
    ready: false,
  };
}

function demoSpread() {
  return {
    mode: "demo",
    reflection: "我理解你这次真正想探索的是这件事里最让你为难的部分。（演示模式）",
    question: "我们看看：牵动你的部分、你还没看清的部分、现在可以做的事",
    question_note: "演示模式下使用通用问题。",
    positions: [
      { name: "牵动你的部分", focus: "这件事里真正消耗或吸引你的东西" },
      { name: "你还没看清的部分", focus: "目前被迷雾遮住、值得多看一眼的东西" },
      { name: "现在可以做的事", focus: "不替你做决定，但可以着手的下一步" },
    ],
    spread_note: "演示模式下的通用三牌位。",
  };
}

function demoInterpret({ cards, positions }) {
  return {
    mode: "demo",
    opening: "（演示模式：以下为流程演示，接入真实模型后解读将结合你的描述展开。）",
    focus: "先看看三张牌各自在说什么。",
    cards: cards.map((c, i) => ({
      symbolism: `${c.nameCn}（${c.orientationZh}）在此处的象征：${c.sym} 关键词：${(c.keywords || []).join("、")}。`,
      connection: "演示模式未连接模型，暂无法与你说的内容建立具体联系。",
      reading: "一种可能的理解：这张牌提示了「" + (c.keywords || []).join("、") + "」的主题在你的处境中可能以某种方式出现。",
      reflection: `可以想一想：「${(positions[i] || {}).name || "这个位置"}」对你来说意味着什么？`,
    })),
    synthesis: "演示模式：接入真实模型后，这里会综合三张牌回应你确认的问题，并保留不确定性。",
    next_step: "等待接入真实模型后再试一次。",
    weak_links: [],
  };
}

function demoFollowup() {
  return {
    mode: "demo",
    ack: "（演示模式）",
    understanding_changes: [],
    answer: "演示模式尚未连接真实模型。接入后，这条追问会结合本次牌面与你的处境得到回应。",
    revised_parts: [],
    next_step: "",
  };
}

// ---------- 路由 ----------

app.get(["/health", "/healthz"], (_req, res) => res.json({ status: "ok" }));

app.get("/api/health/modules", (_req, res) => {
  const textOk = ai.isAiEnabled();
  res.json({
    db: { status: "not_configured", detail: "本应用会话状态在前端，不使用数据库" },
    ai: textOk
      ? { status: "ok", detail: "文本对话已配置" }
      : { status: "not_configured", detail: "无 ai.properties，AI 接口将返回演示模式" },
  });
});

// 1) 语境提取 + 澄清
app.post("/api/understand", async (req, res) => {
  const { description, clarify } = readSessionSlice(req);
  if (!description) return fail(res, 400, "bad_input", "缺少描述文本");
  const round = clarify.length; // 已完成的追问轮数
  try {
    if (!ai.isAiEnabled()) return res.json(demoUnderstanding({ description, clarify }));
    const data = await chatValidated({
      task: P.TASK_UNDERSTAND,
      context:
        P.buildUnderstandContext({ description, clarify }) +
        (round >= 2 ? "\n\n（系统提示：追问机会已用完，本轮请直接给出提取结果并设 ready=true。）" : ""),
      validate: P.validateUnderstanding,
      maxTokens: 1600,
    });
    // 服务端兜底：最多两轮追问
    if (round >= 2) {
      data.need_clarify = false;
      data.ready = true;
      data.clarify_question = "";
    }
    res.json({ mode: "ai", ...data });
  } catch (e) {
    console.error("[understand]", e.message);
    fail(res, 502, "ai_failed", "生成暂时没有成功，请稍后重试。");
  }
});

// 2) 咨询问题 + 牌阵
app.post("/api/spread", async (req, res) => {
  const ctx = readSessionSlice(req);
  if (!ctx.description) return fail(res, 400, "bad_input", "缺少描述文本");
  const b = req.body || {};
  const understanding = b.understanding && typeof b.understanding === "object" ? b.understanding : null;
  try {
    if (!ai.isAiEnabled()) return res.json(demoSpread());
    const data = await chatValidated({
      task: P.TASK_SPREAD,
      context: P.buildSpreadContext({ ...ctx, understanding }),
      validate: P.validateSpread,
      maxTokens: 1600,
    });
    res.json({ mode: "ai", ...data });
  } catch (e) {
    console.error("[spread]", e.message);
    fail(res, 502, "ai_failed", "生成暂时没有成功，请稍后重试。");
  }
});

// 3) 程序洗牌（与语境无关）：返回 22 张的随机排列，用户亲手选 3 张
app.post("/api/draw", (_req, res) => {
  const deckOrder = deck.drawSpread();
  res.json({ mode: "ai", deck: deckOrder, drawnAt: Date.now() });
});

// 4) 个性化解读
app.post("/api/interpret", async (req, res) => {
  const ctx = readSessionSlice(req);
  if (!ctx.description) return fail(res, 400, "bad_input", "缺少描述文本");
  const b = req.body || {};
  const question = cleanStr(b.question, 400);
  const positions = Array.isArray(b.positions) && b.positions.length === 3
    ? b.positions.map((p) => ({
        name: cleanStr(p && p.name, 40) || "未命名牌位",
        focus: cleanStr(p && p.focus, 120) || "",
      }))
    : null;
  const cards = deck.hydrateForReading(b.cards);
  if (!question || !positions || !cards) {
    return fail(res, 400, "bad_input", "缺少已确认的问题、牌阵或牌面");
  }
  try {
    if (!ai.isAiEnabled()) return res.json(demoInterpret({ cards, positions }));
    const data = await chatValidated({
      task: P.TASK_INTERPRET,
      context: P.buildInterpretContext({
        description: ctx.description,
        clarify: ctx.clarify,
        understanding: b.understanding && typeof b.understanding === "object" ? b.understanding : null,
        question,
        positions,
        cards,
      }),
      validate: P.validateInterpret,
      maxTokens: 4000,
    });
    res.json({ mode: "ai", ...data });
  } catch (e) {
    console.error("[interpret]", e.message);
    fail(res, 502, "ai_failed", "这次解读暂时没有生成成功。");
  }
});

// 5) 追问 / 纠正（沿用原牌面）
app.post("/api/followup", async (req, res) => {
  const ctx = readSessionSlice(req);
  if (!ctx.description) return fail(res, 400, "bad_input", "缺少描述文本");
  const b = req.body || {};
  const message = cleanStr(b.message, 2000);
  const question = cleanStr(b.question, 400);
  const positions = Array.isArray(b.positions) && b.positions.length === 3
    ? b.positions.map((p) => ({
        name: cleanStr(p && p.name, 40) || "未命名牌位",
        focus: cleanStr(p && p.focus, 120) || "",
      }))
    : null;
  const cards = deck.hydrateForReading(b.cards);
  const interpretation = b.interpretation && typeof b.interpretation === "object" ? b.interpretation : null;
  const followups = Array.isArray(b.followups)
    ? b.followups.slice(0, 12).map((f) => ({
        question: cleanStr(f && f.question, 2000) || "",
        answer: cleanStr(f && f.answer, 3000) || "",
        understanding_changes: Array.isArray(f && f.understanding_changes) ? f.understanding_changes.slice(0, 6) : [],
        revised_parts: Array.isArray(f && f.revised_parts) ? f.revised_parts.slice(0, 6) : [],
      }))
    : [];
  if (!message || !question || !positions || !cards || !interpretation) {
    return fail(res, 400, "bad_input", "缺少本次咨询上下文或追问内容");
  }
  try {
    if (!ai.isAiEnabled()) return res.json(demoFollowup());
    const data = await chatValidated({
      task: P.TASK_FOLLOWUP,
      context: P.buildFollowupContext({
        description: ctx.description,
        clarify: ctx.clarify,
        understanding: b.understanding && typeof b.understanding === "object" ? b.understanding : null,
        question,
        positions,
        cards,
        interpretation,
        followups,
        message,
      }),
      validate: P.validateFollowup,
      maxTokens: 3000,
    });
    res.json({ mode: "ai", ...data });
  } catch (e) {
    console.error("[followup]", e.message);
    fail(res, 502, "ai_failed", "这条回应暂时没有生成成功。");
  }
});

// 静态前端（必须在所有 /api 路由之后挂载）
app.use(express.static(STATIC_DIR, { index: "index.html" }));

const PORT = parseInt(process.env.APP_PORT || "3000", 10);
const HOST = process.env.APP_HOSTNAME || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`listening on ${HOST}:${PORT}`);
});
