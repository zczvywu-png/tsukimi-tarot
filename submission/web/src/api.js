// web/src/api.js — 后端接口封装。所有路径相对（不带前导 /）。

export class ApiError extends Error {
  constructor(code, message) {
    super(message || "请求失败");
    this.code = code;
  }
}

export async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    throw new ApiError("network", "网络连接失败，请稍后重试。");
  }
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok || !data || data.ok === false) {
    throw new ApiError((data && data.code) || "bad_response", (data && data.message) || "请求失败");
  }
  return data;
}

// 发送给后端的会话切片（结构化会话状态 → 服务端无状态消费）
export function sessionPayload(session, extra = {}) {
  return {
    description: session.description,
    clarify: session.clarify,
    understanding: session.understanding,
    question: session.question && session.question.text,
    positions: session.positions,
    cards: session.cards,
    interpretation: session.interpretation,
    followups: (session.followups || []).map((f) => ({
      question: f.question,
      answer: f.answer,
      understanding_changes: f.understanding_changes,
      revised_parts: f.revised_parts,
    })),
    ...extra,
  };
}
