// app/deck.js — 22 张大阿卡纳（第一版牌库）。
// kw / kwR 供前端展示与解读参考；sym 是给模型的象征锚点。
// 牌义措辞保持处境中立，个性化只发生在「问题、牌阵与解释」中。

const DECK = [
  {
    id: 0, numeral: "0", nameCn: "愚者", nameEn: "The Fool",
    kw: ["开始", "未知的信任", "轻装上路"],
    kwR: ["准备不足", "鲁莽", "逃避落地"],
    sym: "旅程尚未展开的一段空白与可能。带着天真的信任迈出一步，脚下是什么还看不清。",
  },
  {
    id: 1, numeral: "I", nameCn: "魔术师", nameEn: "The Magician",
    kw: ["创造", "资源在手", "聚焦"],
    kwR: ["空转", "力量分散", "华而不实"],
    sym: "把想法变成现实的通道感——工具就在桌上，重要的是意图是否清晰。",
  },
  {
    id: 2, numeral: "II", nameCn: "女祭司", nameEn: "The High Priestess",
    kw: ["直觉", "内在知晓", "静待"],
    kwR: ["忽视内在声音", "被外界噪音带走"],
    sym: "幕布后的安静知晓。答案不在外部信息里，而在尚未被说出口的感受里。",
  },
  {
    id: 3, numeral: "III", nameCn: "女皇", nameEn: "The Empress",
    kw: ["滋养", "丰盛", "允许生长"],
    kwR: ["过度付出", "忽略自身需要"],
    sym: "一种让事物生长的土壤感——被照顾、被允许舒展，也包括照顾自己。",
  },
  {
    id: 4, numeral: "IV", nameCn: "皇帝", nameEn: "The Emperor",
    kw: ["秩序", "责任", "建立框架"],
    kwR: ["僵化", "过度控制", "被规则压住"],
    sym: "结构与边界。框架带来安全和效率，过紧则变成束缚。",
  },
  {
    id: 5, numeral: "V", nameCn: "教皇", nameEn: "The Hierophant",
    kw: ["传统", "体制", "寻求指引"],
    kwR: ["教条", "走出自己的路"],
    sym: "既有的体系与经验路径。有人在其中找到归属，有人感到窒息。",
  },
  {
    id: 6, numeral: "VI", nameCn: "恋人", nameEn: "The Lovers",
    kw: ["选择", "价值对齐", "真诚连接"],
    kwR: ["摇摆", "价值冲突", "回避选择"],
    sym: "不只是爱情，更是一次价值观层面的选择：什么对自己真正重要。",
  },
  {
    id: 7, numeral: "VII", nameCn: "战车", nameEn: "The Chariot",
    kw: ["前进", "掌控方向", "意志"],
    kwR: ["用力过猛", "失控", "疲惫冲刺"],
    sym: "前进的势头。方向明确时势不可挡，方向不清时变成硬撑。",
  },
  {
    id: 8, numeral: "VIII", nameCn: "力量", nameEn: "Strength",
    kw: ["温柔的坚持", "内在勇气", "耐心"],
    kwR: ["自我怀疑", "强撑", "力量感低"],
    sym: "不是蛮力，是用温和的方式驯服内心的不安。",
  },
  {
    id: 9, numeral: "IX", nameCn: "隐者", nameEn: "The Hermit",
    kw: ["独处", "内省", "寻找自己的光"],
    kwR: ["孤立", "逃避", "拒绝联结"],
    sym: "主动退到安静处，举灯照路。答案需要一段独处才能浮现。",
  },
  {
    id: 10, numeral: "X", nameCn: "命运之轮", nameEn: "Wheel of Fortune",
    kw: ["时机", "周期转折", "顺势"],
    kwR: ["抗拒变化", "被动打转"],
    sym: "情况在移动，不是静止的。周期有自己的节奏，人能做的是识别时机。",
  },
  {
    id: 11, numeral: "XI", nameCn: "正义", nameEn: "Justice",
    kw: ["权衡", "清晰", "如实面对"],
    kwR: ["失衡", "偏颇", "逃避结论"],
    sym: "天平摆在中间——把两边如实称重，包括不愿承认的那部分。",
  },
  {
    id: 12, numeral: "XII", nameCn: "倒吊人", nameEn: "The Hanged Man",
    kw: ["暂停", "换角度", "主动悬置"],
    kwR: ["停滞", "无谓消耗", "悬而不决"],
    sym: "暂时不动，让视角翻转。悬置可以是沉淀，也可以是拖延，区别在主动与否。",
  },
  {
    id: 13, numeral: "XIII", nameCn: "死神", nameEn: "Death",
    kw: ["结束与新生", "放手", "蜕变"],
    kwR: ["抓着不放", "拒绝结束"],
    sym: "某个阶段需要真正结束，新的东西才有空间。很少指字面意义的事。",
  },
  {
    id: 14, numeral: "XIV", nameCn: "节制", nameEn: "Temperance",
    kw: ["平衡", "调和", "慢慢兑"],
    kwR: ["失衡", "极端", "急于求成"],
    sym: "两种东西慢慢调和成第三种。急不得，但每一步都在融合。",
  },
  {
    id: 15, numeral: "XV", nameCn: "恶魔", nameEn: "The Devil",
    kw: ["束缚", "沉迷", "明知故犯"],
    kwR: ["察觉枷锁", "开始松绑"],
    sym: "锁链往往松松地挂着——困住人的常常是可以摘下却没摘的东西。",
  },
  {
    id: 16, numeral: "XVI", nameCn: "塔", nameEn: "The Tower",
    kw: ["突变", "旧结构松动", "剧烈清醒"],
    kwR: ["险险避过", "延迟的松动"],
    sym: "建在不稳地基上的东西塌了。痛，但也把真相摊开。",
  },
  {
    id: 17, numeral: "XVII", nameCn: "星星", nameEn: "The Star",
    kw: ["希望", "修复", "长远愿景"],
    kwR: ["信心低落", "暂时失联"],
    sym: "风暴后的第一颗星。不是立刻变好，是重新看见方向。",
  },
  {
    id: 18, numeral: "XVIII", nameCn: "月亮", nameEn: "The Moon",
    kw: ["迷雾", "尚未看清", "不安"],
    kwR: ["雾渐散", "走出困惑"],
    sym: "路还在，但月光不足——很多不安来自看不清，而不是路本身。",
  },
  {
    id: 19, numeral: "XIX", nameCn: "太阳", nameEn: "The Sun",
    kw: ["清朗", "活力", "被照亮"],
    kwR: ["暂时阴霾", "活力受阻"],
    sym: "事情摊在阳光下，清晰、温暖、有生气。",
  },
  {
    id: 20, numeral: "XX", nameCn: "审判", nameEn: "Judgement",
    kw: ["召唤", "重新评估", "醒来"],
    kwR: ["忽视召唤", "苛责自己"],
    sym: "一个更大的方向在呼唤重新整理人生排序。像被叫醒的时刻。",
  },
  {
    id: 21, numeral: "XXI", nameCn: "世界", nameEn: "The World",
    kw: ["完成", "整合", "告一段落"],
    kwR: ["差一步", "未完成感"],
    sym: "一个循环走完的圆满感。值得停下来承认已经走了多远。",
  },
];

function byId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 0 || n >= DECK.length) return null;
  return DECK[n];
}

// 程序抽牌：3 张互不重复，每张随机正逆位。
// 与用户语境完全无关——个性化只发生在问题、牌阵与解释中。
const { randomInt } = require("crypto");

function drawThree() {
  const picked = new Set();
  const cards = [];
  while (cards.length < 3) {
    const idx = randomInt(0, DECK.length);
    if (picked.has(idx)) continue;
    picked.add(idx);
    const c = DECK[idx];
    const reversed = randomInt(0, 2) === 1;
    cards.push({
      id: c.id,
      numeral: c.numeral,
      nameCn: c.nameCn,
      nameEn: c.nameEn,
      orientation: reversed ? "reversed" : "upright",
      orientationZh: reversed ? "逆位" : "正位",
      keywords: reversed ? c.kwR : c.kw,
    });
  }
  return cards;
}

// 整副洗牌：返回 22 张的随机排列（含正逆位）。
// 用户从这副牌里亲手选 3 张——牌序由程序随机，选择权归用户。
function drawSpread() {
  const deck = DECK.map((c) => {
    const reversed = randomInt(0, 2) === 1;
    return {
      id: c.id,
      numeral: c.numeral,
      nameCn: c.nameCn,
      nameEn: c.nameEn,
      orientation: reversed ? "reversed" : "upright",
      orientationZh: reversed ? "逆位" : "正位",
      keywords: reversed ? c.kwR : c.kw,
    };
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 供解读用：根据客户端传回的 {id, orientation} 从牌库重新取权威数据，
// 不信任客户端提供的牌义文本。
function hydrateForReading(list) {
  if (!Array.isArray(list) || list.length !== 3) return null;
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const c = byId(item && item.id);
    if (!c || seen.has(c.id)) return null;
    seen.add(c.id);
    const reversed = item.orientation === "reversed";
    out.push({
      id: c.id,
      nameCn: c.nameCn,
      nameEn: c.nameEn,
      numeral: c.numeral,
      orientation: reversed ? "reversed" : "upright",
      orientationZh: reversed ? "逆位" : "正位",
      keywords: reversed ? c.kwR : c.kw,
      sym: c.sym,
    });
  }
  return out;
}

module.exports = { DECK, byId, drawThree, drawSpread, hydrateForReading };
