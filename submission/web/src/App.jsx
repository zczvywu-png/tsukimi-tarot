// web/src/App.jsx — 月见塔罗主流程状态机。
// 会话状态结构化保存在 localStorage，随请求传给服务端（服务端无状态）；
// 只有成功的响应才写入会话，失败/重试不丢输入与牌面。

import React, { useEffect, useRef, useState } from "react";
import { post, sessionPayload } from "./api.js";
import {
  IntroView,
  ClarifyView,
  ConfirmView,
  DrawView,
  ReadingView,
  SummaryView,
  ProgressSteps,
} from "./components.jsx";
import { MoonMark, MusicIcon, SpeakerIcon } from "./card-art.jsx";
import { speakTexts, speechSynthSupported, stopSpeaking } from "./voice.js";
import { startAmbient, stopAmbient } from "./music.js";

const STORAGE_KEY = "yuejian-tarot-session-v1";

const EMPTY_SESSION = {
  version: 1,
  stage: "intro", // intro | clarify | confirm | draw | reading | summary
  description: "",
  clarify: [], // 已完成的问答 [{question, answer}]
  dialogue: [], // 展示用对话 [{who, text, kind?}]
  understanding: null,
  question: null, // {text}
  questionNote: "",
  reflection: "",
  positions: null, // [{name, focus}]
  spreadNote: "",
  spread: null, // 洗好的整副牌（22 张，服务端随机）
  picks: [], // 用户在牌桌上亲手选中的三个下标（按选择顺序）
  drawPhase: "pause", // pause | pick | reveal
  cards: null, // 确认后：picks 对应的三张牌
  revealed: [false, false, false],
  interpretation: null,
  followups: [],
  demo: false,
};

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_SESSION };
    const s = JSON.parse(raw);
    if (!s || s.version !== 1) return { ...EMPTY_SESSION };
    const merged = { ...EMPTY_SESSION, ...s };
    // 旧版本会话兼容：无 drawPhase 时按有无牌面推断
    if (merged.stage === "draw" && !merged.drawPhase) {
      merged.drawPhase = merged.cards ? "reveal" : "pause";
    }
    return merged;
  } catch (e) {
    return { ...EMPTY_SESSION };
  }
}

const STAGE_STEP = { intro: 0, clarify: 1, confirm: 2, draw: 3, reading: 4, summary: 4 };

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const [editingQ, setEditingQ] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [busy, setBusy] = useState(null); // understand | spread | draw | interpret | followup
  const [error, setError] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const retryFn = useRef(null);
  const voiceOutRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      /* 存储失败不阻断流程 */
    }
  }, [session]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [session.stage]);

  const patch = (p) => setSession((s) => ({ ...s, ...p }));

  function setErr(msg, fn) {
    setError(msg);
    retryFn.current = fn || null;
  }

  // ---------- 语音回应 / 背景音乐 ----------

  function speakIfOn(texts) {
    const arr = (Array.isArray(texts) ? texts : [texts]).filter(Boolean);
    if (voiceOutRef.current && speechSynthSupported && arr.length) {
      speakTexts(arr);
    }
  }

  function toggleVoiceOut() {
    const v = !voiceOut;
    setVoiceOut(v);
    voiceOutRef.current = v;
    if (!v) stopSpeaking();
  }

  function toggleMusic() {
    if (musicOn) {
      stopAmbient();
      setMusicOn(false);
    } else {
      startAmbient();
      setMusicOn(true);
    }
  }

  // ---------- 理解语境（首次 / 追问后） ----------

  async function handleUnderstand(payload, prePatch) {
    setBusy("understand");
    setError(null);
    try {
      const res = await post("api/understand", payload);
      if (res.mode === "demo") prePatch = { ...(prePatch || {}), demo: true };
      const base = { ...session, ...(prePatch || {}) };
      let next = {
        ...base,
        understanding: res.understanding,
        dialogue: [...base.dialogue, { who: "counselor", text: res.empathy }],
      };
      const rounds = payload.clarify.length;
      if (res.need_clarify && res.clarify_question && rounds < 2) {
        next = {
          ...next,
          dialogue: [...next.dialogue, { who: "counselor", kind: "question", text: res.clarify_question }],
          stage: "clarify",
        };
        setSession(next);
        setBusy(null);
        speakIfOn([res.empathy, res.clarify_question]);
      } else {
        setSession(next);
        await doSpread(next);
      }
      return true;
    } catch (e) {
      setBusy(null);
      setErr(e.message || "这次生成暂时没有成功，请稍后重试。", () => handleUnderstand(payload, prePatch));
      return false;
    }
  }

  async function startConsultation() {
    const text = draft.trim();
    if (text.length < 10) return;
    const payload = { description: text, clarify: [] };
    const ok = await handleUnderstand(payload, { description: text, dialogue: [], stage: "clarify" });
    if (ok) setDraft("");
  }

  async function answerClarify() {
    const text = answer.trim();
    if (!text) return;
    const question =
      [...session.dialogue].reverse().find((m) => m.kind === "question")?.text || "（你补充的说明）";
    const clarify = [...session.clarify, { question, answer: text }];
    const ok = await handleUnderstand(
      { description: session.description, clarify },
      {
        clarify,
        dialogue: [...session.dialogue, { who: "user", text }],
        stage: "clarify",
      }
    );
    if (ok) setAnswer("");
  }

  function skipClarify() {
    doSpread(session);
  }

  // ---------- 问题 + 牌阵 ----------

  async function doSpread(src) {
    const s = src || session;
    setBusy("spread");
    setError(null);
    setSession((cur) => ({ ...cur, stage: "confirm" }));
    try {
      const res = await post("api/spread", {
        description: s.description,
        clarify: s.clarify,
        understanding: s.understanding,
      });
      if (res.mode === "demo") patch({ demo: true });
      patch({
        question: { text: res.question },
        questionNote: res.question_note || "",
        reflection: res.reflection || "",
        positions: res.positions,
        spreadNote: res.spread_note || "",
      });
      setBusy(null);
      speakIfOn([res.reflection, `本次的问题，我们定为：${res.question}`]);
    } catch (e) {
      setBusy(null);
      setErr(e.message || "牌阵生成暂时没有成功，请稍后重试。", () => doSpread());
    }
  }

  function enterEditQuestion() {
    setDraftQuestion(session.question.text);
    setEditingQ(true);
  }

  function leaveEditQuestion(save) {
    if (save) {
      const t = draftQuestion.trim();
      if (t) patch({ question: { text: t } });
    }
    setEditingQ(false);
  }

  // ---------- 洗牌与亲手选牌 ----------

  async function drawCards() {
    setBusy("draw");
    setError(null);
    try {
      const res = await post("api/draw", {});
      patch({
        spread: res.deck,
        picks: [],
        cards: null,
        revealed: [false, false, false],
        drawPhase: "pick",
      });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setErr(e.message || "洗牌暂时没有成功，请重试。", drawCards);
    }
  }

  async function reshuffle() {
    setBusy("draw");
    setError(null);
    try {
      const res = await post("api/draw", {});
      patch({ spread: res.deck, picks: [], cards: null });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setErr(e.message || "重新洗牌没有成功，请重试。", reshuffle);
    }
  }

  function togglePick(i) {
    setSession((s) => {
      if (!s.spread) return s;
      let picks = s.picks.includes(i) ? s.picks.filter((p) => p !== i) : s.picks;
      if (!picks.includes(i) && picks.length < 3) picks = [...picks, i];
      return { ...s, picks };
    });
  }

  function autoPick() {
    setSession((s) => {
      if (!s.spread) return s;
      const idx = [...Array(s.spread.length).keys()];
      const picks = [];
      while (picks.length < 3) {
        picks.push(idx.splice(Math.floor(Math.random() * idx.length), 1)[0]);
      }
      return { ...s, picks };
    });
  }

  function confirmPicks() {
    setSession((s) =>
      s.picks.length === 3 && s.spread
        ? { ...s, cards: s.picks.map((i) => s.spread[i]), revealed: [false, false, false], drawPhase: "reveal" }
        : s
    );
  }

  function repick() {
    stopSpeaking();
    patch({ drawPhase: "pick", cards: null, revealed: [false, false, false] });
  }

  function reveal(i) {
    setSession((s) => {
      const revealed = [...s.revealed];
      revealed[i] = true;
      return { ...s, revealed };
    });
  }

  // ---------- 解读 ----------

  async function doInterpret() {
    setBusy("interpret");
    setError(null);
    try {
      const res = await post("api/interpret", sessionPayload(session));
      if (res.mode === "demo") patch({ demo: true });
      patch({ interpretation: res, stage: "reading" });
      setBusy(null);
      speakIfOn([res.opening, `本次解读的重点：${res.focus}`]);
    } catch (e) {
      setBusy(null);
      setErr("这次解读暂时没有生成成功，你的输入和牌面已保留。", doInterpret);
    }
  }

  // ---------- 追问 ----------

  async function sendFollowup() {
    const text = followupInput.trim();
    if (!text) return;
    setBusy("followup");
    setError(null);
    try {
      const res = await post("api/followup", sessionPayload(session, { message: text }));
      if (res.mode === "demo") patch({ demo: true });
      setSession((s) => ({
        ...s,
        followups: [
          ...s.followups,
          {
            question: text,
            ack: res.ack,
            answer: res.answer,
            understanding_changes: res.understanding_changes || [],
            revised_parts: res.revised_parts || [],
            next_step: res.next_step || "",
          },
        ],
      }));
      setFollowupInput("");
      setBusy(null);
      speakIfOn([res.ack]);
    } catch (e) {
      setBusy(null);
      setErr("这条回应暂时没有生成成功，你的问题已保留。", sendFollowup);
    }
  }

  // ---------- 导航 ----------

  function restartDescription() {
    stopSpeaking();
    setDraft(session.description || "");
    setSession({ ...EMPTY_SESSION });
    setError(null);
    setBusy(null);
  }

  function backToClarify() {
    stopSpeaking();
    setError(null);
    patch({ stage: "clarify", question: null, positions: null });
  }

  function backToConfirm() {
    stopSpeaking();
    setError(null);
    patch({ stage: "confirm" });
  }

  function startNew() {
    stopSpeaking();
    setSession({ ...EMPTY_SESSION });
    setDraft("");
    setAnswer("");
    setFollowupInput("");
    setError(null);
    setConfirmNew(false);
  }

  const onRetry = () => retryFn.current && retryFn.current();

  // ---------- 渲染 ----------

  const step = STAGE_STEP[session.stage] ?? 0;

  return (
    <div className="page">
      <div className="moon-glow" aria-hidden="true" />
      <header className="site-head">
        <div className="head-row">
          <div className="brand">
            <MoonMark size={20} />
            <span className="brand-name">月见塔罗</span>
            {session.demo && (
              <span className="demo-badge" title="当前未连接真实模型，内容为流程演示">
                演示模式
              </span>
            )}
          </div>
          <div className="head-tools">
            <button
              type="button"
              className={`tool-btn ${voiceOut ? "on" : ""}`}
              onClick={toggleVoiceOut}
              aria-pressed={voiceOut}
              title="开启后，我会把回应读给你听（也可以随时关掉）"
            >
              <SpeakerIcon size={15} />
              <span className="tool-label">语音回应</span>
            </button>
            <button
              type="button"
              className={`tool-btn ${musicOn ? "on" : ""}`}
              onClick={toggleMusic}
              aria-pressed={musicOn}
              title="舒缓的背景音乐（生成式环境音）"
            >
              <MusicIcon size={15} playing={musicOn} />
              <span className="tool-label">{musicOn ? "音乐播放中" : "背景音乐"}</span>
            </button>
          </div>
        </div>
        {session.stage !== "intro" && <ProgressSteps current={step} />}
      </header>

      <main className="content">
        {session.stage === "intro" && (
          <IntroView
            draft={draft}
            setDraft={setDraft}
            onStart={startConsultation}
            busy={busy}
            error={error}
            onRetry={onRetry}
          />
        )}

        {session.stage === "clarify" && (
          <ClarifyView
            dialogue={session.dialogue}
            understanding={session.understanding}
            round={session.clarify.length}
            answer={answer}
            setAnswer={setAnswer}
            onAnswer={answerClarify}
            onSkip={skipClarify}
            busy={busy}
            error={error}
            onRetry={onRetry}
            onRestart={restartDescription}
          />
        )}

        {session.stage === "confirm" && (
          <ConfirmView
            reflection={session.reflection}
            question={session.question ? session.question.text : ""}
            questionNote={session.questionNote}
            positions={session.positions || []}
            spreadNote={session.spreadNote}
            editing={editingQ}
            setEditing={(editing, save) => (editing ? enterEditQuestion() : leaveEditQuestion(save))}
            draftQuestion={draftQuestion}
            setDraftQuestion={setDraftQuestion}
            onConfirm={() => patch({ stage: "draw" })}
            onRegenerate={doSpread}
            onBack={backToClarify}
            busy={busy}
            error={error}
            onRetry={onRetry}
          />
        )}

        {session.stage === "draw" && (
          <DrawView
            question={session.question ? session.question.text : ""}
            spread={session.spread || []}
            picks={session.picks || []}
            drawPhase={session.drawPhase || "pause"}
            cards={session.cards}
            positions={session.positions || []}
            revealed={session.revealed}
            onEnterPick={drawCards}
            onTogglePick={togglePick}
            onReshuffle={reshuffle}
            onAutoPick={autoPick}
            onConfirmPicks={confirmPicks}
            onRepick={repick}
            onReveal={reveal}
            onRead={doInterpret}
            onBack={backToConfirm}
            busy={busy}
            error={error}
            onRetry={onRetry}
          />
        )}

        {session.stage === "reading" && (
          <ReadingView
            question={session.question ? session.question.text : ""}
            interpretation={session.interpretation}
            cards={session.cards || []}
            positions={session.positions || []}
            followups={session.followups}
            followupInput={followupInput}
            setFollowupInput={setFollowupInput}
            onSendFollowup={sendFollowup}
            onSummary={() => patch({ stage: "summary" })}
            onRegenerate={doInterpret}
            busy={busy}
            error={error}
            onRetry={onRetry}
            onNew={() => setConfirmNew(true)}
          />
        )}

        {session.stage === "summary" && (
          <SummaryView
            question={session.question ? session.question.text : ""}
            cards={session.cards || []}
            positions={session.positions || []}
            interpretation={session.interpretation || { focus: "", next_step: "" }}
            followups={session.followups}
            onBack={() => patch({ stage: "reading" })}
            onNew={() => setConfirmNew(true)}
          />
        )}
      </main>

      {confirmNew && (
        <div className="modal-mask" role="dialog" aria-label="确认开始新咨询">
          <div className="modal">
            <p className="modal-title">开始一次新的咨询？</p>
            <p className="modal-text">
              本次的问题、牌面和对话将被清空，重新从描述困惑开始。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmNew(false)}>
                先不，继续这次
              </button>
              <button type="button" className="btn btn-primary" onClick={startNew}>
                开始新的咨询
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="site-foot">
        <p>月见塔罗 · 塔罗不预测命运，只帮助你看清自己</p>
      </footer>
    </div>
  );
}
