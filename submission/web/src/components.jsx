// web/src/components.jsx — 流程各阶段的视图组件。

import React, { useRef, useState } from "react";
import { CardBackArt, CardEmblem, MoonMark, StarField, MicIcon, SpeakerIcon } from "./card-art.jsx";
import { createDictation, recognitionSupported, speakTexts, speechSynthSupported, stopSpeaking } from "./voice.js";

// ---------- 通用 ----------

const STEPS = ["表达困惑", "澄清", "确认问题", "揭牌", "解读"];

export function ProgressSteps({ current }) {
  return (
    <div className="progress" aria-label={`咨询进度：${STEPS[current]}`}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span className={`progress-line ${i <= current ? "done" : ""}`} />}
          <span className={`progress-step ${i < current ? "done" : ""} ${i === current ? "current" : ""}`}>
            <span className="progress-dot" />
            <span className="progress-label">{s}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function LoadingCard({ text }) {
  return (
    <div className="loading-card" role="status" aria-live="polite">
      <span className="breath-moon">
        <MoonMark size={22} />
      </span>
      <p>{text}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry, retryLabel = "重新生成" }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// ---------- 语音 ----------

// 带麦克风的输入框：可以说话，也可以打字。
export function VoiceInput({ id, value, onChange, placeholder, rows = 3, maxLength = 2000, disabled, className = "" }) {
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const dictRef = useRef(null);

  const toggleMic = () => {
    if (listening) {
      dictRef.current && dictRef.current.stop();
      return;
    }
    setMicError(null);
    const d = createDictation({
      onLive: onChange,
      onFinal: (full) => {
        onChange(full);
        setListening(false);
      },
      onError: (msg) => setMicError(msg),
    });
    if (!d) return;
    dictRef.current = d;
    d.start(value || "");
    setListening(true);
  };

  return (
    <div className={`voice-input ${className}`}>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || listening}
      />
      {recognitionSupported && (
        <div className="vi-foot">
          <button
            type="button"
            className={`mic-btn ${listening ? "listening" : ""}`}
            onClick={toggleMic}
            aria-pressed={listening}
          >
            {listening ? (
              <>
                <MicIcon size={14} />
                <span className="mic-live">
                  <i />正在聆听 · 点击结束
                </span>
              </>
            ) : (
              <>
                <MicIcon size={14} />
                <span>说不方便写，就对着它说</span>
              </>
            )}
          </button>
          {micError && <span className="mic-error">{micError}</span>}
        </div>
      )}
    </div>
  );
}

// 朗读按钮：icon 小按钮或带文字的 ghost 按钮
export function SpeakerButton({ texts, label = "朗读", big = false, className = "" }) {
  const [reading, setReading] = useState(false);
  if (!speechSynthSupported) return null;
  const list = (texts || []).filter(Boolean);
  if (!list.length) return null;
  const handle = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else {
      setReading(true);
      speakTexts(list, { onDone: () => setReading(false) });
    }
  };
  if (big) {
    return (
      <button
        type="button"
        className={`btn btn-ghost btn-sm speak-big ${reading ? "active" : ""} ${className}`}
        onClick={handle}
      >
        <SpeakerIcon />
        {reading ? "停止朗读" : label}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`icon-speak ${reading ? "on" : ""} ${className}`}
      title={label}
      aria-label={label}
      onClick={handle}
    >
      <SpeakerIcon size={14} />
    </button>
  );
}

export function ExpandableText({ text, clampChars = 110, className = "" }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > clampChars;
  return (
    <div className={`expandable ${className}`}>
      <p className={long && !open ? "clamped" : ""}>{text}</p>
      {long && (
        <button
          type="button"
          className="expand-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "收起" : "展开全文"}
        </button>
      )}
    </div>
  );
}

function ExampleChips({ onPick }) {
  const examples = [
    "我想辞职，但又害怕找不到更好的工作。",
    "和家里介绍的人相处还行，但总感觉少了点什么，不知道该不该继续。",
    "领导总在会上否定我的方案，我开始怀疑自己适不适合这份工作。",
  ];
  return (
    <div className="example-chips">
      {examples.map((e) => (
        <button key={e} type="button" className="chip" onClick={() => onPick(e)}>
          {e}
        </button>
      ))}
    </div>
  );
}

// ---------- 首页 ----------

export function IntroView({ draft, setDraft, onStart, busy, error, onRetry }) {
  const valid = draft.trim().length >= 10;
  return (
    <section className="stage intro-stage">
      <div className="hero-ornament">
        <StarField variant={1} />
        <svg viewBox="0 0 200 90" className="hero-arc" aria-hidden="true">
          <path d="M10 85 A 90 90 0 0 1 190 85" fill="none" stroke="#B89A67" strokeWidth="0.8" opacity="0.5" />
          <path d="M35 85 A 65 65 0 0 1 165 85" fill="none" stroke="#B89A67" strokeWidth="0.6" opacity="0.35" />
          <circle cx="100" cy="34" r="7" fill="none" stroke="#B89A67" strokeWidth="0.9" opacity="0.8" />
          <circle cx="100" cy="34" r="1.6" fill="#B89A67" />
        </svg>
      </div>
      <h1 className="hero-title">有什么事，<br />让你一直放在心上？</h1>
      <p className="hero-sub">
        在这里慢慢说。我会先听懂你的处境，再和你一起把问题看清楚，
        最后借三张牌开启一次对话——不预测命运，只帮你看见自己。
      </p>
      <div className="input-block">
        <label htmlFor="confusion-input" className="input-label">
          可以说说发生了什么，以及你最纠结的地方。
        </label>
        <VoiceInput
          id="confusion-input"
          value={draft}
          onChange={setDraft}
          rows={5}
          placeholder="比如：最近在考虑要不要换个方向，心里很乱……（也可以点下方按钮说出来）"
          disabled={busy === "understand"}
        />
        <div className="input-meta">
          <span>{draft.trim().length < 10 ? "再多写几个字，我好听懂你" : `${draft.length} / 2000`}</span>
        </div>
        <ExampleChips onPick={(t) => setDraft(t)} />
        {busy === "understand" ? (
          <LoadingCard text="正在认真听你说的话……" />
        ) : (
          <>
            <ErrorBox message={error} onRetry={onRetry} retryLabel="重试" />
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={!valid}
              onClick={onStart}
            >
              从这件事开始
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// ---------- 澄清 ----------

const U_LABELS = {
  happening: "发生了什么",
  options: "你面对的选项",
  emotions: "情绪与担忧",
  values: "你在意的东西",
  constraints: "现实约束",
  missing: "我还想确认的",
};

export function UnderstandingPanel({ understanding }) {
  const [open, setOpen] = useState(false);
  if (!understanding) return null;
  const entries = Object.entries(U_LABELS)
    .map(([k, label]) => [label, (understanding[k] || []).filter(Boolean)])
    .filter(([, arr]) => arr.length > 0);
  if (!entries.length) return null;
  return (
    <div className="understanding-panel">
      <button type="button" className="up-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <MoonMark size={13} />
        我目前的理解（都来自你说的话）
        <span className="up-arrow">{open ? "收起" : "展开"}</span>
      </button>
      {open && (
        <dl className="up-body">
          {entries.map(([label, arr]) => (
            <div key={label} className="up-row">
              <dt>{label}</dt>
              <dd>{arr.join("；")}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function DialogueThread({ dialogue }) {
  return (
    <div className="dialogue">
      {dialogue.map((m, i) => {
        if (m.who === "user") {
          return (
            <div key={i} className="msg user">
              <p>{m.text}</p>
            </div>
          );
        }
        if (m.kind === "question") {
          return (
            <div key={i} className="msg counselor question-card">
              <span className="counselor-mark">
                <MoonMark size={14} />
              </span>
              <p className="question-label">我想再了解一点</p>
              <p className="question-text">{m.text}</p>
              <SpeakerButton texts={[m.text]} label="朗读这个问题" className="question-speak" />
            </div>
          );
        }
        return (
          <div key={i} className="msg counselor">
            <span className="counselor-mark">
              <MoonMark size={14} />
            </span>
            <p>{m.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ClarifyView({
  dialogue,
  understanding,
  round,
  answer,
  setAnswer,
  onAnswer,
  onSkip,
  busy,
  error,
  onRetry,
  onRestart,
}) {
  const canAnswer = answer.trim().length > 0;
  return (
    <section className="stage clarify-stage">
      <DialogueThread dialogue={dialogue} />
      <UnderstandingPanel understanding={understanding} />
      {round < 2 ? (
        <>
          <div className="clarify-hint">
            {round === 0 ? "回答之后，如果还不清楚我会再问一次（最多两次）。" : "这是最后一个问题，之后我们就开始。"}
          </div>
          {busy === "understand" ? (
            <LoadingCard text="正在整理我还需要了解的……" />
          ) : (
            <div className="answer-block">
              <VoiceInput
                value={answer}
                onChange={setAnswer}
                rows={3}
                placeholder="想到什么写什么，不用组织语言。（也可以直接说）"
              />
              <div className="answer-actions">
                <button type="button" className="btn btn-primary" disabled={!canAnswer} onClick={onAnswer}>
                  回答
                </button>
                <button type="button" className="btn btn-text" onClick={onSkip}>
                  先按现有信息开始
                </button>
              </div>
              <ErrorBox message={error} onRetry={onRetry} retryLabel="重试" />
            </div>
          )}
        </>
      ) : (
        <div className="answer-block">
          <p className="clarify-hint">我对你的处境已经有了基本了解。</p>
          {busy === "spread" ? (
            <LoadingCard text="正在为这件事设计牌阵……" />
          ) : (
            <button type="button" className="btn btn-primary" onClick={onSkip}>
              继续设计这次的问题
            </button>
          )}
          <ErrorBox message={error} onRetry={onRetry} retryLabel="重试" />
        </div>
      )}
      <div className="back-row">
        <button type="button" className="btn btn-text" onClick={onRestart}>
          重新描述这件事
        </button>
      </div>
    </section>
  );
}

// ---------- 确认问题与牌阵 ----------

export function ConfirmView({
  reflection,
  question,
  questionNote,
  positions,
  spreadNote,
  editing,
  setEditing,
  draftQuestion,
  setDraftQuestion,
  onConfirm,
  onRegenerate,
  onBack,
  busy,
  error,
  onRetry,
}) {
  if (busy === "spread") {
    return (
      <section className="stage confirm-stage">
        <LoadingCard text="正在为这件事设计牌阵……" />
        <ErrorBox message={error} onRetry={onRetry} retryLabel="重新设计" />
      </section>
    );
  }
  if (!question) {
    return (
      <section className="stage confirm-stage">
        <ErrorBox message={error || "牌阵还没有生成。"} onRetry={onRetry} retryLabel="重新设计" />
        <div className="back-row">
          <button type="button" className="btn btn-text" onClick={onBack}>
            返回补充说明
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="stage confirm-stage">
      <div className="confirm-card">
        <p className="confirm-lead">我理解你这次真正想探索的是——</p>
        {editing ? (
          <div className="question-edit">
            <textarea value={draftQuestion} maxLength={160} rows={2} onChange={(e) => setDraftQuestion(e.target.value)} autoFocus />
            <div className="question-edit-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(false, true)}>
                保存修改
              </button>
              <button type="button" className="btn btn-text btn-sm" onClick={() => setEditing(false, false)}>
                取消
              </button>
            </div>
            <p className="edit-hint">修改之后，牌阵含义不变，解读会以你改后的问题为准。</p>
          </div>
        ) : (
          <blockquote className="confirm-question">{question}</blockquote>
        )}
        {questionNote && <p className="confirm-note">{questionNote}</p>}
        <div className="divider" />
        <p className="positions-lead">这次我们借三张牌看三件事：</p>
        <ol className="positions-list">
          {positions.map((p, i) => (
            <li key={i}>
              <span className="pos-num">{["Ⅰ", "Ⅱ", "Ⅲ"][i]}</span>
              <div>
                <p className="pos-name">{p.name}</p>
                <p className="pos-focus">{p.focus}</p>
              </div>
            </li>
          ))}
        </ol>
        {spreadNote && <p className="spread-note">{spreadNote}</p>}
      </div>
      <div className="confirm-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={onConfirm}>
          就是这样，开始抽牌
        </button>
        <div className="confirm-sub-actions">
          <button type="button" className="btn btn-text" onClick={() => setEditing(true)}>
            调整这个问题
          </button>
          <button type="button" className="btn btn-text" onClick={onRegenerate}>
            换一种问法
          </button>
          <button type="button" className="btn btn-text" onClick={onBack}>
            返回补充说明
          </button>
        </div>
      </div>
      <ErrorBox message={error} onRetry={onRetry} retryLabel="重新设计" />
    </section>
  );
}

// ---------- 抽牌 ----------

export function TarotCard({ card, position, index, revealed, onReveal, interactive, size = "md" }) {
  const clickable = interactive && !revealed;
  return (
    <div
      className={`tarot-slot ${size} ${clickable ? "clickable" : ""}`}
      onClick={clickable ? () => onReveal(index) : undefined}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? `翻开第 ${index + 1} 张牌` : undefined}
    >
      <div className={`tarot-card ${revealed ? "revealed" : ""}`}>
        <div className="tarot-inner">
          <div className="tarot-face tarot-back">
            <CardBackArt />
          </div>
          <div className="tarot-face tarot-front">
            {card ? (
              <>
                <p className="tf-numeral">{card.numeral}</p>
                <p className="tf-name">{card.nameCn}</p>
                <div className="tf-emblem">
                  <CardEmblem id={card.id} />
                </div>
                <p className="tf-en">{card.nameEn}</p>
                <p className={`tf-orientation ${card.orientation === "reversed" ? "reversed" : ""}`}>
                  {card.orientationZh}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {position && (
        <p className="tarot-position">
          <span className="pos-badge">{["Ⅰ", "Ⅱ", "Ⅲ"][index]}</span>
          {position.name}
        </p>
      )}
    </div>
  );
}

export function DrawView({
  question,
  spread,
  picks,
  drawPhase,
  cards,
  positions,
  revealed,
  onEnterPick,
  onTogglePick,
  onReshuffle,
  onAutoPick,
  onConfirmPicks,
  onRepick,
  onReveal,
  onRead,
  onBack,
  busy,
  error,
  onRetry,
}) {
  const pickCount = picks ? picks.length : 0;
  const allRevealed = cards && revealed && revealed.every(Boolean);

  return (
    <section className="stage draw-stage">
      <div className="draw-question-echo">
        <p className="echo-label">本次探索</p>
        <p className="echo-text">{question}</p>
      </div>

      {drawPhase === "pause" && (
        <div className="pause-block">
          <StarField variant={2} />
          <h2 className="pause-title">开始之前，停一下。</h2>
          <p className="pause-sub">
            深呼吸，回想一下刚才确认的问题。<br />
            洗牌之后，22 张牌背面朝上摊开——<br />
            接下来由你亲手选出三张。
          </p>
          <div className="deck-stack" aria-hidden="true">
            <div className="deck-card c3"><CardBackArt /></div>
            <div className="deck-card c2"><CardBackArt /></div>
            <div className="deck-card c1"><CardBackArt /></div>
          </div>
          {busy === "draw" ? (
            <LoadingCard text="洗牌中……" />
          ) : (
            <>
              <ErrorBox message={error} onRetry={onRetry} retryLabel="重试" />
              <button type="button" className="btn btn-primary btn-lg" onClick={onEnterPick}>
                洗牌，开始选牌
              </button>
            </>
          )}
          <div className="back-row">
            <button type="button" className="btn btn-text" onClick={onBack}>
              回到问题确认
            </button>
          </div>
        </div>
      )}

      {drawPhase === "pick" && (
        <div className="pick-block">
          <p className="pick-hint">
            {pickCount < 3
              ? `已选 ${pickCount} / 3 —— 不用想太多，手会先于头脑做出选择。`
              : "就这三张，还是想再看一眼？"}
          </p>
          <div className="pick-slots" aria-label="已选的牌位">
            {[0, 1, 2].map((slot) => {
              const pi = picks ? picks[slot] : undefined;
              return (
                <div key={slot} className={`pick-slot ${pi !== undefined ? "filled" : ""}`}>
                  <div className="slot-card">
                    {pi !== undefined ? <CardBackArt /> : <span className="slot-dash" />}
                  </div>
                  <p className="slot-pos">
                    <span className="pos-badge">{["Ⅰ", "Ⅱ", "Ⅲ"][slot]}</span>
                    {positions[slot] ? positions[slot].name : ""}
                  </p>
                </div>
              );
            })}
          </div>
          {busy === "draw" ? (
            <LoadingCard text="重新洗牌中……" />
          ) : (
            <>
              <div className="card-table" role="listbox" aria-label="背面朝上的牌堆，点选三张">
                {spread.map((c, i) => {
                  const order = picks && picks.includes(i) ? picks.indexOf(i) + 1 : 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`table-card ${order ? "picked" : ""}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                      onClick={() => onTogglePick(i)}
                      aria-label={order ? `已选为第 ${order} 张，点击取消` : "选择这张牌"}
                    >
                      <CardBackArt />
                      {order > 0 && <span className="pick-order">{order}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="pick-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={pickCount !== 3}
                  onClick={onConfirmPicks}
                >
                  就选这三张
                </button>
                <div className="confirm-sub-actions">
                  <button type="button" className="btn btn-text" onClick={onReshuffle}>
                    重新洗牌
                  </button>
                  <button type="button" className="btn btn-text" onClick={onAutoPick}>
                    让我替你抽
                  </button>
                </div>
              </div>
              <ErrorBox message={error} onRetry={onRetry} retryLabel="重试" />
              <div className="back-row">
                <button type="button" className="btn btn-text" onClick={onBack}>
                  回到问题确认
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {drawPhase === "reveal" && cards && (
        <div className="drawn-block">
          <p className="drawn-hint">
            {allRevealed ? "三张牌都翻开了——是你亲手选的这三张。" : "轻触每一张牌，翻开它。"}
          </p>
          <div className="drawn-cards">
            {cards.map((c, i) => (
              <TarotCard
                key={i}
                card={c}
                position={positions[i]}
                index={i}
                revealed={revealed[i]}
                onReveal={onReveal}
                interactive
                size="draw"
              />
            ))}
          </div>
          {allRevealed &&
            (busy === "interpret" ? (
              <LoadingCard text="正在结合你的描述整理牌面解读" />
            ) : (
              <>
                <ErrorBox message={error} onRetry={onRetry} />
                <button type="button" className="btn btn-primary btn-lg" onClick={onRead}>
                  看看解读
                </button>
              </>
            ))}
          <div className="back-row">
            <button type="button" className="btn btn-text" onClick={onRepick}>
              重新选牌
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- 解读（咨询手记） ----------

function CardReadingBlock({ cardInfo, card, position, index }) {
  return (
    <article className="card-reading">
      <header className="cr-head">
        <div className="cr-card">
          <TarotCard card={card} index={index} revealed />
        </div>
        <div className="cr-title">
          <p className="cr-position">{position.name}</p>
          <p className="cr-cardname">
            {card.nameCn} · {card.orientationZh}
          </p>
          <p className="cr-keywords">{(card.keywords || []).join(" · ")}</p>
        </div>
      </header>
      <div className="cr-body">
        {cardInfo.symbolism && (
          <div className="cr-part">
            <span className="cr-label">象征</span>
            <ExpandableText text={cardInfo.symbolism} />
          </div>
        )}
        {cardInfo.connection && (
          <div className="cr-part highlight">
            <span className="cr-label">与你有关</span>
            <ExpandableText text={cardInfo.connection} />
          </div>
        )}
        {cardInfo.reading && (
          <div className="cr-part">
            <span className="cr-label">一种理解</span>
            <ExpandableText text={cardInfo.reading} />
          </div>
        )}
        {cardInfo.reflection && (
          <div className="cr-part reflect">
            <span className="cr-label">{cardInfo.reflection.endsWith("？") ? "想一想" : "可以试试"}</span>
            <ExpandableText text={cardInfo.reflection} clampChars={80} />
          </div>
        )}
      </div>
    </article>
  );
}

export function ReadingView({
  question,
  interpretation,
  cards,
  positions,
  followups,
  followupInput,
  setFollowupInput,
  onSendFollowup,
  onSummary,
  onRegenerate,
  busy,
  error,
  onRetry,
  onNew,
}) {
  if (!interpretation) return null;
  const sending = busy === "followup";
  const readAll = [
    interpretation.opening,
    interpretation.focus,
    ...interpretation.cards.flatMap((ci, i) => [
      `第${["一", "二", "三"][i]}张，牌位：${positions[i] ? positions[i].name : ""}。${cards[i] ? cards[i].nameCn : ""}，${cards[i] ? cards[i].orientationZh : ""}。`,
      ci.symbolism,
      ci.connection,
      ci.reading,
      ci.reflection,
    ]),
    interpretation.synthesis,
    interpretation.next_step ? `下一步：${interpretation.next_step}` : "",
  ].filter(Boolean);
  return (
    <section className="stage reading-stage">
      <div className="note-paper">
        <div className="note-head">
          <p className="echo-label">本次问题</p>
          <p className="echo-text">{question}</p>
          <div className="note-tools">
            <SpeakerButton big texts={readAll} label="朗读本次解读" />
          </div>
        </div>
        {interpretation.opening && <p className="note-opening">{interpretation.opening}</p>}
        <p className="note-focus">
          <span className="focus-mark" />
          {interpretation.focus}
        </p>
        <div className="note-cards">
          {interpretation.cards.map((ci, i) => (
            <CardReadingBlock
              key={i}
              cardInfo={ci}
              card={cards[i]}
              position={positions[i]}
              index={i}
            />
          ))}
        </div>
        {interpretation.weak_links && interpretation.weak_links.length > 0 && (
          <div className="weak-links">
            <p>
              说句实话：{interpretation.weak_links.join("、")} 与你说的内容联系并不清晰——
              与其硬解，不如承认牌面这次没有提供新的视角。
            </p>
          </div>
        )}
        <div className="synthesis-block">
          <p className="syn-label">与你的处境有关</p>
          {interpretation.synthesis && <ExpandableText text={interpretation.synthesis} clampChars={180} />}
          {interpretation.next_step && (
            <div className="next-step">
              <span className="ns-label">下一步，你可以</span>
              <ExpandableText text={interpretation.next_step} clampChars={90} />
            </div>
          )}
        </div>
      </div>

      <div className="followup-block">
        <p className="fu-lead">这一点，我想再聊聊</p>
        {(followups || []).length > 0 && (
          <div className="followup-thread">
            {followups.map((f, i) => (
              <div key={i} className="fu-exchange">
                <div className="msg user">
                  <p>{f.question}</p>
                </div>
                <div className="msg counselor fu-answer">
                  <span className="counselor-mark">
                    <MoonMark size={14} />
                  </span>
                  <SpeakerButton
                    texts={[f.ack, f.answer]}
                    label="朗读这条回应"
                    className="fu-speak"
                  />
                  {f.ack && <p className="fu-ack">{f.ack}</p>}
                  {f.understanding_changes && f.understanding_changes.length > 0 && (
                    <div className="fu-changes">
                      <p className="fu-changes-label">我更新了对你的理解</p>
                      <ul>
                        {f.understanding_changes.map((c, j) => (
                          <li key={j}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <ExpandableText text={f.answer} clampChars={160} />
                  {f.revised_parts && f.revised_parts.length > 0 && (
                    <div className="fu-revised">
                      <p className="fu-changes-label">调整了之前的解读</p>
                      <ul>
                        {f.revised_parts.map((c, j) => (
                          <li key={j}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.next_step && (
                    <p className="fu-next">接下来：{f.next_step}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {sending ? (
          <LoadingCard text="正在结合这次牌面回应你……" />
        ) : (
          <div className="fu-input">
            <VoiceInput
              value={followupInput}
              onChange={setFollowupInput}
              rows={2}
              placeholder="例如：为什么这样理解？/ 我的情况其实不是这样……（也可以直接说）"
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!followupInput.trim()}
              onClick={onSendFollowup}
            >
              聊聊这一点
            </button>
          </div>
        )}
        <ErrorBox message={error} onRetry={onRetry} retryLabel="重新发送" />
      </div>

      <div className="reading-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={onSummary}>
          查看咨询小结
        </button>
        <div className="confirm-sub-actions">
          {busy === "interpret" ? (
            <span className="regen-hint">正在重新生成解读……</span>
          ) : (
            <button type="button" className="btn btn-text" onClick={onRegenerate}>
              重新生成解读
            </button>
          )}
          <button type="button" className="btn btn-text" onClick={onNew}>
            开始新的咨询
          </button>
        </div>
        <p className="reading-footer">
          牌面是一种视角，不是命运本身。任何决定，都由你自己做出。
        </p>
      </div>
    </section>
  );
}

// ---------- 小结 ----------

export function SummaryView({ question, cards, positions, interpretation, followups, onBack, onNew }) {
  const changes = (followups || []).flatMap((f) => [
    ...(f.understanding_changes || []),
    ...(f.revised_parts || []),
  ]);
  const lastNext =
    followups && followups.length && followups[followups.length - 1].next_step
      ? followups[followups.length - 1].next_step
      : interpretation.next_step;
  return (
    <section className="stage summary-stage">
      <div className="summary-paper">
        <h2 className="summary-title">咨询小结</h2>
        <div className="summary-section">
          <p className="echo-label">你带来的问题</p>
          <p className="echo-text">{question}</p>
        </div>
        <div className="summary-section">
          <p className="echo-label">这次翻开的牌</p>
          <ul className="summary-cards">
            {cards.map((c, i) => (
              <li key={i}>
                <span className="sc-pos">{positions[i].name}</span>
                <span className="sc-name">{c.nameCn}</span>
                <span className="sc-ori">{c.orientationZh}</span>
              </li>
            ))}
          </ul>
        </div>
        {interpretation.focus && (
          <div className="summary-section">
            <p className="echo-label">这次的解读重点</p>
            <p className="summary-text">{interpretation.focus}</p>
          </div>
        )}
        {changes.length > 0 && (
          <div className="summary-section">
            <p className="echo-label">过程中你修正的</p>
            <ul className="summary-changes">
              {changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {lastNext && (
          <div className="summary-section">
            <p className="echo-label">走出这一页之后</p>
            <p className="summary-text">{lastNext}</p>
          </div>
        )}
        <p className="summary-closing">
          把判断权收回自己手里——牌没有替你做任何决定，
          它只是陪你把这件事又看了一遍。
        </p>
      </div>
      <div className="confirm-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={onNew}>
          开始新的咨询
        </button>
        <div className="confirm-sub-actions">
          <button type="button" className="btn btn-text" onClick={onBack}>
            回看完整解读
          </button>
        </div>
      </div>
    </section>
  );
}
