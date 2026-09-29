// app/prompts.js — 各阶段的系统提示词、上下文组装与结构化输出校验。
// 工作流模块：语境提取 / 澄清生成 / 问题与牌阵 / 个性化解读 / 追问修订。
// 全部为无状态纯函数，由 server.js 调用。

// ---------- 咨询师宪法（所有阶段共享的硬约束） ----------

const CONSTITUTION = `你是一位塔罗咨询师，名叫「月见」。你不是算命先生：你不预测命运，不读取任何人的真实想法，不给出确定性断言。你做的是：先认真理解来访者的处境，帮助他们把模糊的困惑变成可以探索的问题，再借助塔罗牌的象征开启一次对话。

铁律（任何时候不可违反）：
1. 只使用来访者明确说过的信息。绝不推测其存款、家庭状况、伴侣、领导意图、过往经历等未提及的事实。宁可留白，不可编造。
2. 区分「来访者说过的事实」与「需要确认的理解」。任何提取结论都必须能在来访者原话中找到依据，没有依据就留空。
3. 牌是镜子不是判决。所有解读都以「一种可能的理解」的口吻呈现，保留不确定性。
4. 禁止输出确定性或读心式表述，包括但不限于：「一定会」「注定」「命中注定」「他其实…」「你的领导正在…」「你的潜意识就是…」。
5. 语气温和、具体、克制。像一位认真倾听的咨询师：不夸张承诺，不说教，不替来访者做决定。
6. 只输出一个 JSON 对象，不要 markdown 代码围栏，不要任何多余文字。所有文本用中文。`;

// ---------- 各阶段任务说明 ----------

const TASK_UNDERSTAND = `任务：理解来访者当前的处境，并决定是否需要追问。

输入是来访者的描述与此前每一轮澄清问答。

输出 JSON schema：
{
  "empathy": "1-2 句回应，接住已表达的情绪。不评判、不建议、不复述全部内容。",
  "understanding": {
    "happening": ["发生了什么，来自原话"],
    "options": ["来访者面对的选项或方向"],
    "emotions": ["已明确表达的情绪和担忧"],
    "values": ["来访者最看重的东西"],
    "constraints": ["已知的现实约束"],
    "missing": ["还缺少哪些影响解读的重要信息"]
  },
  "need_clarify": false,
  "clarify_question": "如果需要追问：只提一个最重要的问题，否则空字符串",
  "ready": true
}

要求：
- understanding 六个字段每一条都必须有原话依据，没有依据留空数组，绝不脑补。
- need_clarify 为 true 时，clarify_question 必须针对 missing 中对解读最关键的一项，且贴合当前语境——禁止通用问卷式提问。好的问题长这样（示例风格，禁止照抄）：「你现在更担心的是离开后的收入，还是无法判断下一份工作会不会重复现在的问题？」
- 若核心困扰、涉及的选项、主要担忧已经比较清楚，设 ready=true 且 need_clarify=false。
- 追问机会有限（系统只允许两轮）：优先问对解读最关键的问题。`;

const TASK_SPREAD = `任务：把来访者的困惑转化为一次可探索的塔罗咨询，并设计三张牌的牌阵。

输出 JSON schema：
{
  "reflection": "以「我理解你这次真正想探索的是……」开头的 1-2 句话，忠实呈现来访者的关切",
  "question": "本次咨询的问题",
  "question_note": "1 句话说明为什么这样问，与来访者原话的关系",
  "positions": [
    { "name": "牌位名（12 字以内）", "focus": "这个位置在看什么（一句话）" },
    { "name": "…", "focus": "…" },
    { "name": "…", "focus": "…" }
  ],
  "spread_note": "1-2 句说明为什么这样安排三个牌位"
}

要求：
- 把宽泛的预测式问题（「我该不该X」「他会不会Y」）转成探索式问题（「我想看看……」），但必须保留用户原本的关切方向，不得擅自改变其原意。例：用户问「我该不该辞职」，可以转成「看看：你想离开的主要原因、留下时需要正视的问题，以及做决定前值得确认的信息」。
- 三个牌位必须针对这个处境具体命名，像「当前消耗你的因素」「你在这段互动中的需要」；禁止「过去/现在/未来」「现状/障碍/结果」这类通用牌位。
- 牌位不能声称读取他人真实想法或确定未来。`;

const TASK_INTERPRET = `任务：结合来访者确认过的问题、牌阵与已抽出的三张牌，给出解读。

输出 JSON schema：
{
  "opening": "对来访者处境的简短回应，1-2 句，不要重复此前的话",
  "focus": "本次解读重点，一句话",
  "cards": [
    {
      "symbolism": "这张牌（含正逆位）在这个牌位上的象征含义，2-3 句，用牌的象征语言，不下结论",
      "connection": "与来访者哪一条实际陈述有关。必须化用其原话（如「你来的时候提到……」）；找不到有依据的联系就如实写「这张牌暂时没有和你说的内容产生清晰的呼应」",
      "reading": "一种可能的理解，2-3 句。明确它是解释不是事实（用「可能」「或许」「一种理解是」的口吻）",
      "reflection": "一个供来访者确认的反思问题，或一个具体、温和、可自主选择的现实行动。二选一"
    },
    { … }, { … }
  ],
  "synthesis": "综合三张牌回应本次确认的问题。承认牌面之间的张力与不确定性，不下「应该/不应该」的结论，把判断权留给来访者",
  "next_step": "一条具体、可自主选择的下一步，具体到「本周内可以找一位做过类似转变的朋友聊一次」这个程度",
  "weak_links": ["联系牵强的牌位名；没有则空数组"]
}

要求：
- 每张牌的 connection 必须指向来访者实际陈述过的内容，禁止编造其未提供的细节（存款、领导、家人、offer 细节等）。
- 逆位不是坏牌：通常表示该牌能量的受阻、内向化或过度。
- 如果某张牌与处境的联系确实牵强，就放进 weak_links 并在该牌的 connection 里如实承认，不要硬凑。
- 禁止「你潜意识就是这样」式表述，禁止命运判断。`;

const TASK_FOLLOWUP = `任务：回应来访者对本次解读的追问、质疑或纠正。

输入包含本次会话全部上下文：确认的问题、牌阵、抽到的牌、已给出的解读、此前追问与回答，以及来访者新的一条消息。

输出 JSON schema：
{
  "ack": "1-2 句回应这条消息",
  "understanding_changes": ["对处境理解的更新，如「担忧：从收入中断 → 发展停滞」；无变化则空数组"],
  "answer": "主体回答，分层展开，必须能看出依据：引用具体牌位、具体牌、以及来访者说过的具体陈述",
  "revised_parts": ["需要调整的此前解释及调整后的内容；无则空数组"],
  "next_step": "一条具体、可自主选的下一步"
}

要求：
- 沿用本次牌面与牌位，绝不重新抽牌、不引入新牌。
- 来访者在纠正时（「我的情况其实不是这样」）：更新理解，明确指出之前哪项解释需要调整，保留原牌面重新解释相关部分。绝不用「你潜意识就是这样」否定用户的纠正。
- 来访者问「为什么这样理解」时：说清解读依据（牌的象征 + 来访者的陈述 + 二者联系）。
- 来访者问「如果我选另一个方向」时：在同一牌面下探讨两种方向的张力，不下结论。`;

// ---------- 上下文组装 ----------

function renderUnderstanding(u) {
  if (!u) return "";
  const labels = {
    happening: "发生了什么",
    options: "选项",
    emotions: "情绪与担忧",
    values: "看重的东西",
    constraints: "现实约束",
    missing: "尚不清楚的部分",
  };
  const lines = [];
  for (const [k, label] of Object.entries(labels)) {
    const arr = Array.isArray(u[k]) ? u[k].filter(Boolean) : [];
    if (arr.length) lines.push(`- ${label}：${arr.join("；")}`);
  }
  return lines.join("\n");
}

function hasUnderstandingContent(u) {
  return Boolean(u && renderUnderstanding(u).trim());
}

// 澄清阶段：来访者描述 + 问答史 + 当前提取结果
function buildUnderstandContext({ description, clarify }) {
  const parts = [`【来访者最初的描述】\n${description}`];
  if (Array.isArray(clarify) && clarify.length) {
    parts.push("【此前的澄清问答】");
    clarify.forEach((c, i) => {
      parts.push(`问题${i + 1}：${c.question || ""}\n回答${i + 1}：${c.answer || ""}`);
    });
  }
  return parts.join("\n\n");
}

// 牌阵阶段：澄清阶段的完整语境
function buildSpreadContext({ description, clarify, understanding }) {
  const parts = [buildUnderstandContext({ description, clarify })];
  if (hasUnderstandingContent(understanding)) {
    parts.push(`【系统已提取的当前理解】\n${renderUnderstanding(understanding)}`);
  }
  return parts.join("\n\n");
}

function renderCardsBlock(cards, positions) {
  const lines = ["【抽到的牌】"];
  cards.forEach((c, i) => {
    const p = positions[i] || {};
    lines.push(
      `牌位${i + 1}「${p.name || ""}」（${p.focus || ""}）\n` +
        `${c.nameCn}（${c.nameEn} · ${c.numeral}）· ${c.orientationZh}\n` +
        `关键词：${(c.keywords || []).join("、")}\n象征：${c.sym || ""}`
    );
  });
  return lines.join("\n\n");
}

// 解读阶段：确认的问题 + 牌阵 + 牌 + 语境
function buildInterpretContext({ description, clarify, understanding, question, positions, cards }) {
  const parts = [
    buildUnderstandContext({ description, clarify }),
  ];
  if (hasUnderstandingContent(understanding)) {
    parts.push(`【系统提取的来访者理解】\n${renderUnderstanding(understanding)}`);
  }
  parts.push(`【已确认的本次咨询问题】\n${question}`);
  parts.push(renderCardsBlock(cards, positions));
  return parts.join("\n\n");
}

// 追问阶段：一切 + 已给解读 + 追问史 + 新消息
function buildFollowupContext(s) {
  const parts = [buildInterpretContext(s)];
  if (s.interpretation) {
    parts.push(`【已给出的解读】\n${JSON.stringify(s.interpretation, null, 1)}`);
  }
  if (Array.isArray(s.followups) && s.followups.length) {
    const qa = s.followups
      .map((f, i) => {
        const extra = [];
        if (Array.isArray(f.understanding_changes) && f.understanding_changes.length) {
          extra.push(`理解更新：${f.understanding_changes.join("；")}`);
        }
        if (Array.isArray(f.revised_parts) && f.revised_parts.length) {
          extra.push(`解读调整：${f.revised_parts.join("；")}`);
        }
        return `问题${i + 1}：${f.question || ""}\n回应${i + 1}：${f.answer || ""}${extra.length ? "\n" + extra.join("\n") : ""}`;
      })
      .join("\n\n");
    parts.push(`【此前的追问与回答】\n${qa}`);
  }
  parts.push(`【来访者的新消息】\n${s.message}`);
  return parts.join("\n\n");
}

// ---------- 结构化输出校验（宽松纠正 + 硬失败） ----------

function asTrimmed(v) {
  return typeof v === "string" ? v.trim() : "";
}

function asStrArray(v, maxItems = 8, maxLen = 160) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => asTrimmed(x).slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function validateUnderstanding(d) {
  if (typeof d !== "object" || d === null) return { ok: false, reason: "根节点不是对象" };
  const empathy = asTrimmed(d.empathy).slice(0, 240);
  if (!empathy) return { ok: false, reason: "empathy 为空" };
  const u = d.understanding || {};
  const understanding = {};
  for (const k of ["happening", "options", "emotions", "values", "constraints", "missing"]) {
    understanding[k] = asStrArray(u[k]);
  }
  let needClarify = d.need_clarify === true;
  let ready = d.ready === true;
  let question = asTrimmed(d.clarify_question).slice(0, 200);
  if (needClarify && !question) {
    // 想追问却没给问题：按不追问处理
    needClarify = false;
    ready = true;
  }
  if (ready) needClarify = false;
  return {
    ok: true,
    data: { empathy, understanding, need_clarify: needClarify, clarify_question: question, ready },
  };
}

function validateSpread(d) {
  if (typeof d !== "object" || d === null) return { ok: false, reason: "根节点不是对象" };
  const reflection = asTrimmed(d.reflection).slice(0, 240);
  const question = asTrimmed(d.question).slice(0, 200);
  const note = asTrimmed(d.question_note).slice(0, 200);
  const spreadNote = asTrimmed(d.spread_note).slice(0, 240);
  if (!question) return { ok: false, reason: "question 为空" };
  if (!Array.isArray(d.positions) || d.positions.length !== 3) {
    return { ok: false, reason: "positions 必须为 3 个" };
  }
  const positions = d.positions.map((p) => {
    const o = p || {};
    return { name: asTrimmed(o.name).slice(0, 24) || "未命名牌位", focus: asTrimmed(o.focus).slice(0, 100) };
  });
  if (positions.some((p) => !p.focus)) return { ok: false, reason: "牌位 focus 为空" };
  return {
    ok: true,
    data: {
      reflection: reflection || `我理解你这次真正想探索的是：${question}`,
      question,
      question_note: note,
      positions,
      spread_note: spreadNote,
    },
  };
}

function validateInterpret(d) {
  if (typeof d !== "object" || d === null) return { ok: false, reason: "根节点不是对象" };
  const opening = asTrimmed(d.opening).slice(0, 240);
  const focus = asTrimmed(d.focus).slice(0, 160);
  if (!focus) return { ok: false, reason: "focus 为空" };
  if (!Array.isArray(d.cards) || d.cards.length !== 3) {
    return { ok: false, reason: "cards 必须为 3 个" };
  }
  const cards = d.cards.map((c) => {
    const o = c || {};
    return {
      symbolism: asTrimmed(o.symbolism).slice(0, 600),
      connection: asTrimmed(o.connection).slice(0, 400),
      reading: asTrimmed(o.reading).slice(0, 700),
      reflection: asTrimmed(o.reflection).slice(0, 300),
    };
  });
  if (cards.some((c) => !c.symbolism || !c.reading)) {
    return { ok: false, reason: "某张牌的 symbolism/reading 为空" };
  }
  return {
    ok: true,
    data: {
      opening,
      focus,
      cards,
      synthesis: asTrimmed(d.synthesis).slice(0, 1200),
      next_step: asTrimmed(d.next_step).slice(0, 300),
      weak_links: asStrArray(d.weak_links, 3, 40),
    },
  };
}

function validateFollowup(d) {
  if (typeof d !== "object" || d === null) return { ok: false, reason: "根节点不是对象" };
  const answer = asTrimmed(d.answer).slice(0, 2400);
  if (!answer) return { ok: false, reason: "answer 为空" };
  return {
    ok: true,
    data: {
      ack: asTrimmed(d.ack).slice(0, 240),
      understanding_changes: asStrArray(d.understanding_changes, 6, 200),
      answer,
      revised_parts: asStrArray(d.revised_parts, 6, 300),
      next_step: asTrimmed(d.next_step).slice(0, 300),
    },
  };
}

// ---------- JSON 提取 ----------

function tryParseJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, reason: "空输出" };
  }
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first < 0 || last <= first) return { ok: false, reason: "未找到 JSON 对象" };
  try {
    return { ok: true, data: JSON.parse(t.slice(first, last + 1)) };
  } catch (e) {
    return { ok: false, reason: "JSON 解析失败: " + e.message };
  }
}

module.exports = {
  CONSTITUTION,
  TASK_UNDERSTAND,
  TASK_SPREAD,
  TASK_INTERPRET,
  TASK_FOLLOWUP,
  buildUnderstandContext,
  buildSpreadContext,
  buildInterpretContext,
  buildFollowupContext,
  renderUnderstanding,
  tryParseJson,
  validateUnderstanding,
  validateSpread,
  validateInterpret,
  validateFollowup,
};
