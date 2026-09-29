// web/src/voice.js — 语音输入（SpeechRecognition）与朗读（speechSynthesis）。
// 平台网关不覆盖 TTS/ASR，因此全部使用浏览器原生能力；不支持的浏览器自动降级为纯文字。

// ---------- 朗读 ----------

const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

export const speechSynthSupported = Boolean(synth);

let zhVoice = null;
function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices() || [];
  zhVoice =
    voices.find((v) => v.lang && v.lang.replace("-", "").toLowerCase().startsWith("zh")) || null;
}
if (synth) {
  pickVoice();
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", pickVoice);
  }
}

// 长文本按句子切分（部分浏览器对超长 utterance 会截断）
function splitSegments(text) {
  if (!text) return [];
  const src = String(text);
  const out = [];
  let buf = "";
  const breakers = "。！？；\n";
  for (const ch of src) {
    buf += ch;
    if (breakers.includes(ch) && buf.trim().length > 2) {
      out.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  const final = [];
  for (const seg of out) {
    if (seg.length <= 110) {
      final.push(seg);
      continue;
    }
    let cur = "";
    for (const piece of seg.split(/([，、：])/)) {
      if ((cur + piece).length > 90 && cur) {
        final.push(cur);
        cur = piece;
      } else {
        cur += piece;
      }
    }
    if (cur) final.push(cur);
  }
  return final;
}

let queueToken = 0;

export function stopSpeaking() {
  if (!synth) return;
  queueToken++;
  try {
    synth.cancel();
  } catch (e) {
    /* ignore */
  }
}

export function speakTexts(texts, { onDone } = {}) {
  if (!synth) return;
  stopSpeaking();
  const token = queueToken;
  const segs = (Array.isArray(texts) ? texts : [texts])
    .filter(Boolean)
    .flatMap((t) => splitSegments(t))
    .filter(Boolean);
  let i = 0;
  const next = () => {
    if (token !== queueToken || i >= segs.length) {
      if (onDone) onDone();
      return;
    }
    const u = new SpeechSynthesisUtterance(segs[i++]);
    u.lang = "zh-CN";
    if (zhVoice) u.voice = zhVoice;
    u.rate = 0.96;
    u.pitch = 1;
    u.onend = next;
    u.onerror = next;
    synth.speak(u);
  };
  next();
}

// ---------- 语音输入 ----------

const RecCls =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const recognitionSupported = Boolean(RecCls);

// 一次听写会话：start(baseText) 开始，识别中的实时文本通过 onLive 回调，
// 结束（手动 stop 或自动断句结束）时以 onFinal 提交完整文本。
export function createDictation({ onLive, onFinal, onError }) {
  if (!RecCls) return null;
  let rec = null;
  let listening = false;
  let committed = "";
  let base = "";
  const finish = () => {
    listening = false;
    onLive && onLive(base + committed);
    onFinal && onFinal(base + committed);
  };
  return {
    start(baseText = "") {
      base = baseText;
      committed = "";
      rec = new RecCls();
      rec.lang = "zh-CN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const t = r[0] ? r[0].transcript : "";
          if (r.isFinal) committed += t;
          else interim += t;
        }
        onLive && onLive(base + committed + interim);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          onError && onError("麦克风权限被拒绝了，可以在浏览器地址栏的权限设置里开启。");
          listening = false;
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          onError && onError("刚才没有听清，可以再试一次。");
        }
      };
      rec.onend = () => {
        if (listening) finish();
      };
      try {
        rec.start();
        listening = true;
      } catch (e) {
        listening = false;
        onError && onError("语音识别暂时不可用。");
      }
    },
    stop() {
      if (rec && listening) {
        try {
          rec.stop();
        } catch (e) {
          finish();
        }
      } else {
        finish();
      }
    },
  };
}
