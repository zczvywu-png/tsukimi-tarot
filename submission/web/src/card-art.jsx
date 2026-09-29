// web/src/card-art.jsx — 原创抽象卡面：卡背（月相纹样）+ 22 张大阿卡纳的线描徽记。
// 统一视觉语言：哑光金线描 + 深墨紫点缀，象牙底。

import React from "react";

const GOLD = "#B89A67";
const INK = "#302938";

// ---- 通用小元素 ----

function Star4({ cx, cy, r = 3, fill = GOLD, opacity = 0.9 }) {
  return (
    <path
      d={`M${cx} ${cy - r} L${cx + r * 0.32} ${cy - r * 0.32} L${cx + r} ${cy} L${cx + r * 0.32} ${cy + r * 0.32} L${cx} ${cy + r} L${cx - r * 0.32} ${cy + r * 0.32} L${cx - r} ${cy} L${cx - r * 0.32} ${cy - r * 0.32} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

function Crescent({ cx, cy, r = 12, dir = "right", fill = GOLD }) {
  // dir: "right" 开口朝右（盈月），"left" 开口朝左（亏月）
  const inner = r * 0.78;
  const dx = dir === "right" ? r * 0.42 : -r * 0.42;
  return (
    <path
      fillRule="evenodd"
      d={`M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy + r} A${r} ${r} 0 1 0 ${cx} ${cy - r} Z M${cx + dx} ${cy - inner} A${inner} ${inner} 0 1 0 ${cx + dx} ${cy + inner} A${inner} ${inner} 0 1 0 ${cx + dx} ${cy - inner} Z`}
      fill={fill}
    />
  );
}

// ---- 卡背：深墨紫底 + 哑光金月相 ----

export function CardBackArt() {
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true">
      <rect width="200" height="300" rx="12" fill="#302938" />
      {/* 内框双线 */}
      <rect x="11" y="11" width="178" height="278" rx="8" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.8" />
      <rect x="17" y="17" width="166" height="266" rx="6" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.45" />
      {/* 顶部星点 */}
      <Star4 cx={58} cy={48} r={3} />
      <Star4 cx={100} cy={36} r={2} opacity={0.6} />
      <Star4 cx={142} cy={48} r={3} />
      {/* 三月相 */}
      <Crescent cx={52} cy={150} r={20} dir="right" />
      <circle cx={100} cy={150} r={24} fill="none" stroke={GOLD} strokeWidth="1.2" />
      <circle cx={100} cy={150} r={2.5} fill={GOLD} />
      <Crescent cx={148} cy={150} r={20} dir="left" />
      {/* 月轨弧线 */}
      <path d="M40 92 Q100 70 160 92" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.5" />
      <path d="M40 208 Q100 230 160 208" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.5" />
      {/* 底部星点 */}
      <Star4 cx={100} cy={250} r={3.5} />
      <circle cx={70} cy={252} r={1.4} fill={GOLD} opacity="0.7" />
      <circle cx={130} cy={252} r={1.4} fill={GOLD} opacity="0.7" />
    </svg>
  );
}

// ---- 22 张大阿卡纳线描徽记（viewBox 0 0 100 100）----

const S = { stroke: GOLD, fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const S2 = { ...S, strokeWidth: 1 };

export function CardEmblem({ id }) {
  switch (id) {
    case 0: // 愚者：悬崖边的一步，头顶未知的星
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M14 74 H56 L74 56" {...S} />
          <circle cx={76} cy={24} r={7} {...S2} />
          <circle cx={48} cy={66} r={2.6} fill={GOLD} />
          <path d="M48 66 Q40 60 30 62" {...S2} strokeDasharray="3 4" opacity={0.7} />
          <Star4 cx={24} cy={30} r={3} />
        </svg>
      );
    case 1: // 魔术师：无限符号 + 通道
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M26 32 C26 24 36 24 50 32 C64 40 74 40 74 32 C74 24 64 24 50 32 C36 40 26 40 26 32" {...S} />
          <path d="M50 44 V72" {...S} />
          <circle cx={50} cy={78} r={2.5} fill={GOLD} />
          <path d="M32 88 H68" {...S2} />
        </svg>
      );
    case 2: // 女祭司：两柱之间的新月
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M28 22 V80" {...S} />
          <path d="M72 22 V80" {...S} />
          <Crescent cx={50} cy={52} r={13} dir="right" />
          <path d="M38 84 H62" {...S2} opacity={0.6} />
        </svg>
      );
    case 3: // 女皇：圆融生长的巢
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={50} cy={52} r={18} {...S} />
          <circle cx={50} cy={52} r={10} {...S2} />
          <circle cx={50} cy={52} r={2.5} fill={GOLD} />
          <path d="M30 30 Q50 14 70 30" {...S2} opacity={0.7} />
          <circle cx={38} cy={80} r={1.6} fill={GOLD} opacity={0.8} />
          <circle cx={50} cy={82} r={1.6} fill={GOLD} opacity={0.8} />
          <circle cx={62} cy={80} r={1.6} fill={GOLD} opacity={0.8} />
        </svg>
      );
    case 4: // 皇帝：稳固的方与基座
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <rect x={32} y={28} width={36} height={36} {...S} />
          <rect x={41} y={37} width={18} height={18} {...S2} opacity={0.7} />
          <path d="M26 76 H74" {...S} />
          <path d="M32 76 V84 M68 76 V84" {...S2} />
        </svg>
      );
    case 5: // 教皇：拱门与三道刻痕
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M34 78 V52 A16 16 0 0 1 66 52 V78" {...S} />
          <path d="M42 60 H58" {...S2} />
          <path d="M44 68 H56" {...S2} />
          <path d="M46 76 H54" {...S2} />
          <circle cx={50} cy={44} r={2} fill={GOLD} />
        </svg>
      );
    case 6: // 恋人：交叠的双环
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={41} cy={54} r={16} {...S} />
          <circle cx={59} cy={54} r={16} {...S} />
          <Star4 cx={50} cy={26} r={5} />
          <path d="M36 84 H64" {...S2} opacity={0.6} />
        </svg>
      );
    case 7: // 战车：向前的双箭头与轮
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M34 26 L52 44 L34 62" {...S} />
          <path d="M44 26 L62 44 L44 62" {...S2} />
          <circle cx={58} cy={70} r={9} {...S} />
          <path d="M58 61 V79 M49 70 H67 M52 64 L64 76 M64 64 L52 76" {...S2} opacity={0.7} />
        </svg>
      );
    case 8: // 力量：温柔的弧与火苗
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M26 58 Q50 30 74 58" {...S} />
          <path d="M50 52 C56 60 54 70 50 70 C46 70 44 60 50 52" {...S2} />
          <circle cx={50} cy={78} r={1.8} fill={GOLD} />
          <path d="M20 76 Q50 68 80 76" {...S2} opacity={0.5} />
        </svg>
      );
    case 9: // 隐者：灯与杖
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M40 24 L52 32 V54 L40 62 L28 54 V32 Z" {...S} />
          <circle cx={40} cy={43} r={4} {...S2} />
          <circle cx={40} cy={43} r={1.4} fill={GOLD} />
          <path d="M70 24 V82" {...S} />
          <path d="M34 74 L30 84 M46 74 L50 84" {...S2} opacity={0.6} />
        </svg>
      );
    case 10: // 命运之轮：轮辐与时针
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={50} cy={50} r={24} {...S} />
          <path d="M50 26 V74 M26 50 H74 M33 33 L67 67 M67 33 L33 67" {...S2} opacity={0.7} />
          <circle cx={50} cy={50} r={3} fill={GOLD} />
          <path d="M50 50 L62 38" {...S} stroke={INK} strokeWidth={2} />
          <circle cx={50} cy={17} r={1.8} fill={GOLD} />
          <circle cx={50} cy={83} r={1.8} fill={GOLD} />
        </svg>
      );
    case 11: // 正义：天平
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M50 20 V66" {...S} />
          <path d="M28 28 H72" {...S} />
          <path d="M28 28 L20 42 M28 28 L36 42" {...S2} />
          <path d="M18 42 A10 6 0 0 0 38 42" {...S2} />
          <path d="M72 28 L64 42 M72 28 L80 42" {...S2} />
          <path d="M62 42 A10 6 0 0 0 82 42" {...S2} />
          <path d="M40 74 H60" {...S} />
          <path d="M50 74 V82" {...S2} />
        </svg>
      );
    case 12: // 倒吊人：悬线与倒三角
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M24 24 H76" {...S} />
          <path d="M50 24 V44" {...S} />
          <path d="M50 44 L36 66 L64 66 Z" {...S} />
          <circle cx={50} cy={78} r={5} {...S} />
          <Star4 cx={50} cy={12} r={3} opacity={0.6} />
        </svg>
      );
    case 13: // 死神：地平线与新生
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M22 70 H78" {...S} />
          <path d="M38 70 A12 12 0 0 1 62 70" {...S} />
          <path d="M50 70 V56" {...S} />
          <path d="M50 60 Q44 54 38 57 M50 60 Q56 54 62 57" {...S2} />
          <Star4 cx={50} cy={28} r={4} opacity={0.8} />
        </svg>
      );
    case 14: // 节制：双杯与流转
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M30 38 V50 A9 9 0 0 0 48 50 V38" {...S} />
          <path d="M52 38 V50 A9 9 0 0 0 70 50 V38" {...S} />
          <path d="M36 34 Q50 18 66 40" {...S2} strokeDasharray="4 3" />
          <path d="M50 44 L46 50 L50 56 L54 50 Z" fill={GOLD} opacity={0.85} />
        </svg>
      );
    case 15: // 恶魔：倒三角与松链
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M50 20 L34 44 L66 44 Z" {...S} />
          <path d="M34 44 L66 44" {...S2} opacity={0.5} />
          <circle cx={38} cy={60} r={5} {...S2} />
          <circle cx={62} cy={60} r={5} {...S2} />
          <path d="M43 60 Q50 68 57 60" {...S2} strokeDasharray="3 3" />
          <circle cx={50} cy={80} r={2} fill={GOLD} />
        </svg>
      );
    case 16: // 塔：雷击与坠落
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <rect x={42} y={42} width={16} height={40} {...S} />
          <path d="M44 40 L50 32 L56 40" {...S2} />
          <path d="M28 14 L48 30 L36 40 L60 58" {...S} stroke={INK} />
          <circle cx={34} cy={64} r={1.8} fill={GOLD} />
          <circle cx={67} cy={52} r={1.8} fill={GOLD} />
          <path d="M30 88 H70" {...S2} opacity={0.5} />
        </svg>
      );
    case 17: // 星星：大星与陪伴
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <Star4 cx={50} cy={40} r={14} />
          <Star4 cx={28} cy={58} r={5} opacity={0.8} />
          <Star4 cx={72} cy={56} r={5} opacity={0.8} />
          <path d="M34 78 q6 4 12 0 t12 0 q6 4 12 0" {...S2} opacity={0.6} />
        </svg>
      );
    case 18: // 月亮：新月与迷雾
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <Crescent cx={50} cy={38} r={16} dir="right" />
          <path d="M30 66 q6 4 12 0 t12 0 t12 0 t6 0" {...S2} opacity={0.65} />
          <path d="M36 76 q6 4 12 0 t12 0 t6 0" {...S2} opacity={0.45} />
          <circle cx={30} cy={44} r={1.5} fill={GOLD} opacity={0.7} />
          <circle cx={70} cy={48} r={1.5} fill={GOLD} opacity={0.7} />
        </svg>
      );
    case 19: // 太阳：光与暖
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={50} cy={48} r={15} {...S} />
          <circle cx={50} cy={48} r={2.2} fill={GOLD} />
          <path d="M50 26 V18 M50 78 V70 M28 48 H20 M80 48 H72 M34 32 L28 26 M66 32 L72 26 M34 64 L28 70 M66 64 L72 70" {...S} />
          <path d="M38 88 H62" {...S2} opacity={0.5} />
        </svg>
      );
    case 20: // 审判：向上被唤醒
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M26 32 Q50 14 74 32" {...S} />
          <path d="M34 72 V54 M50 72 V38 M66 72 V58" {...S} />
          <circle cx={34} cy={48} r={1.8} fill={GOLD} />
          <circle cx={50} cy={32} r={1.8} fill={GOLD} />
          <circle cx={66} cy={52} r={1.8} fill={GOLD} />
          <path d="M30 82 H70" {...S2} opacity={0.5} />
        </svg>
      );
    case 21: // 世界：圆满之环
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={50} cy={50} r={24} {...S} strokeDasharray="1 4" />
          <circle cx={50} cy={50} r={17} {...S2} opacity={0.8} />
          <Star4 cx={50} cy={22} r={3} />
          <Star4 cx={50} cy={78} r={3} />
          <Star4 cx={22} cy={50} r={3} />
          <Star4 cx={78} cy={50} r={3} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx={50} cy={50} r={20} {...S} />
        </svg>
      );
  }
}

// ---- 头部 / 装饰用小月相 ----

export function MoonMark({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <Crescent cx={13} cy={12} r={9} dir="right" />
    </svg>
  );
}

// 首页 / 抽牌页的星点装饰
export function StarField({ variant = 0 }) {
  const dots = [
    [8, 12, 2.4], [22, 30, 1.4], [14, 52, 1.8], [30, 74, 1.2],
    [88, 16, 1.6], [78, 40, 2.2], [92, 60, 1.3], [70, 80, 1.7], [50, 90, 1.2],
  ];
  return (
    <svg className="star-field" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {dots.map(([x, y, r], i) => (
        <Star4 key={i} cx={x + (variant * 37) % 8} cy={y} r={r} opacity={0.5 + (i % 3) * 0.15} />
      ))}
    </svg>
  );
}

// ---- 界面小图标（线描风格，继承 currentColor）----

export function SpeakerIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 L6 9 H3 v6 h3 l5 4 Z" />
      <path d="M15.5 8.5 a5 5 0 0 1 0 7" />
      <path d="M18.5 6 a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

export function MicIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11 a7 7 0 0 0 14 0" />
      <path d="M12 18 v3" />
    </svg>
  );
}

export function MusicIcon({ size = 15, playing = false }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      className={playing ? "music-note playing" : "music-note"}>
      <path d="M9 18 V5 l10 -2 v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
    </svg>
  );
}
