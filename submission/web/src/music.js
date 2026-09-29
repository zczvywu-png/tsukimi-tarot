// web/src/music.js — 生成式环境背景音乐（Web Audio 实时合成）。
// 无外部音频文件：缓慢的和弦垫 + 五声音阶偶发铃声，低通滤波，音量克制。
// 默认关闭；用户点击开启（浏览器也要求用户手势后才能出声）。

let ctx = null;
let master = null;
let running = false;
let timers = [];

// 和弦进行（低音区，缓慢呼吸感）
const CHORDS = [
  [110.0, 164.81, 246.94, 261.63], // Am add9
  [87.31, 130.81, 164.81, 220.0], // Fmaj7
  [98.0, 146.83, 196.0, 293.66], // Gsus
  [130.81, 196.0, 246.94, 329.63], // Cmaj add9
];
// 铃声：A 五声音阶（A4 C5 D5 E5 G5）
const BELLS = [440.0, 523.25, 587.33, 659.25, 783.99];

const CHORD_DUR = 16; // 秒

function playChord(freqs) {
  const t0 = ctx.currentTime;
  const dur = CHORD_DUR + 5;
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f * (idx % 2 ? 1.0012 : 0.9988); // 轻微失谐
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.028, t0 + 6);
    g.gain.setValueAtTime(0.028, t0 + dur - 6);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.2);
  });
}

function playBell() {
  const t0 = ctx.currentTime;
  const f = BELLS[Math.floor(Math.random() * BELLS.length)];
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = f;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5 + Math.random() * 1.5);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + 6);
}

export function startAmbient() {
  if (running) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  ctx.resume && ctx.resume();

  master = ctx.createGain();
  master.gain.value = 0.0001;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1300;
  lp.Q.value = 0.4;
  master.connect(lp);
  lp.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 3);

  let ci = Math.floor(Math.random() * CHORDS.length);
  const chordLoop = () => {
    playChord(CHORDS[ci % CHORDS.length]);
    ci++;
  };
  chordLoop();
  timers.push(setInterval(chordLoop, CHORD_DUR * 1000));

  const bellLoop = () => {
    playBell();
    timers.push(setTimeout(bellLoop, (4.5 + Math.random() * 7) * 1000));
  };
  timers.push(setTimeout(bellLoop, 2200 + Math.random() * 2600));

  running = true;
}

export function stopAmbient() {
  if (!running) return;
  running = false;
  timers.forEach((t) => {
    clearInterval(t);
    clearTimeout(t);
  });
  timers = [];
  if (master && ctx) {
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    } catch (e) {
      /* ignore */
    }
  }
  setTimeout(() => {
    if (!running && ctx) {
      try {
        ctx.close();
      } catch (e) {
        /* ignore */
      }
      ctx = null;
      master = null;
    }
  }, 1600);
}

export function ambientRunning() {
  return running;
}
