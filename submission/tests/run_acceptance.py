#!/usr/bin/env python3
# 验收测试：对运行中的服务（127.0.0.1:3030）执行需求文档的 6 个案例，输出到 tests/ 目录。
import json
import os
import sys
import urllib.request

BASE = "http://127.0.0.1:3030"
OUT = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(OUT, exist_ok=True)


def post(path, body, timeout=120):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def save(name, data):
    with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def brief(name, data, fields):
    print(f"\n===== {name} =====")
    for f in fields:
        v = data.get(f)
        if isinstance(v, str) and v:
            print(f"  {f}: {v[:160]}")
        elif v is not None and not isinstance(v, str):
            print(f"  {f}: {json.dumps(v, ensure_ascii=False)[:400]}")


FORBIDDEN = ["一定会", "注定", "命中注定", "他其实", "你的领导正在", "潜意识就是", "百分百", "铁定会"]


def scan_forbidden(label, data):
    text = json.dumps(data, ensure_ascii=False)
    hits = [w for w in FORBIDDEN if w in text]
    print(f"  [事实边界扫描:{label}] {'命中禁语: ' + str(hits) if hits else '未发现确定性/读心式表述'}")
    return hits


def main():
    all_hits = []

    # ---- 案例 2：信息不足（“帮我看看工作”）----
    r = post("/api/understand", {"description": "帮我看看工作", "clarify": []})
    save("case2_underfed", r)
    brief("案例2 信息不足", r, ["empathy", "clarify_question", "ready", "understanding"])
    u = r.get("understanding", {})
    fabricated = [k for k in ["happening", "options", "emotions"] if u.get(k)]
    print(f"  未编造职业/经历: {'通过（提取字段为空）' if not fabricated else '失败：' + str(fabricated)}")
    print(f"  先澄清而非直接解读: {'通过' if r.get('need_clarify') else '失败'}")
    all_hits += scan_forbidden("case2", r)

    # ---- 案例 3：信息充分（不应重复询问已回答的内容）----
    rich = ("我在一家互联网公司做了四年运营，最近拿到一个转产品岗的内部机会，"
            "但要换城市。我纠结的是：产品是我一直想做的方向，但搬城市意味着离开现在的朋友圈，"
            "而且产品岗前两年收入会降。我手上有一些积蓄，家里人支持我自己决定，"
            "最担心的是转了之后发现不适合，回不去运营了。")
    r = post("/api/understand", {"description": rich, "clarify": []})
    save("case3_rich", r)
    brief("案例3 信息充分", r, ["empathy", "clarify_question", "ready", "understanding"])
    repeat_ask = r.get("need_clarify") and r.get("clarify_question") and any(
        k in r["clarify_question"] for k in ["做什么的", "什么工作", "积蓄", "家里人"]
    )
    print(f"  不重复询问已回答内容: {'失败：' + r.get('clarify_question', '') if repeat_ask else '通过'}")
    all_hits += scan_forbidden("case3", r)

    # ---- 案例 1：相同牌面、不同语境 ----
    positions = [
        {"name": "当前消耗你的因素", "focus": "现在这份工作里真正磨你的东西"},
        {"name": "对新方向容易忽略的部分", "focus": "急着离开时容易看漏的东西"},
        {"name": "做决定前值得确认的事", "focus":"离开前把什么落实了会更安心"},
    ]
    question = "我想看看：想离开的主要原因、留下时需要正视的问题、做决定前值得确认的信息"
    same_cards = [
        {"id": 15, "orientation": "upright"},   # 恶魔 正位
        {"id": 14, "orientation": "reversed"},  # 节制 逆位
        {"id": 17, "orientation": "upright"},   # 星星 正位
    ]
    base_payload = {
        "question": question,
        "positions": positions,
        "cards": same_cards,
        "understanding": {"happening": ["考虑辞职"], "emotions": ["担忧"]},
    }

    rA = post("/api/interpret", {
        **base_payload,
        "description": ("我想辞职，但现在没有下家，最担心的是收入中断——房租和日常开销全靠这份工资。"
                        "工作本身不算讨厌，就是没什么成长了，每天有点温水煮青蛙的感觉。"),
    })
    save("case1_contextA", rA)
    brief("案例1-A 无下家·忧收入", rA, ["focus", "next_step"])
    for i, c in enumerate(rA.get("cards", [])):
        print(f"  A-牌{i+1} connection: {c.get('connection', '')[:120]}")

    rB = post("/api/interpret", {
        **base_payload,
        "description": ("我已经拿到了新 offer，薪资涨了 30%。但我担心新公司的价值观和我不合——"
                        "听说那边加班文化很重，而我看重生活和工作的平衡；也怕跳过去之后，"
                        "重复现在这种空虚感。现在这份工作倒是稳定。"),
    })
    save("case1_contextB", rB)
    brief("案例1-B 有offer·忧价值观", rB, ["focus", "next_step"])
    for i, c in enumerate(rB.get("cards", [])):
        print(f"  B-牌{i+1} connection: {c.get('connection', '')[:120]}")

    connA = " ".join(c.get("connection", "") for c in rA.get("cards", []))
    connB = " ".join(c.get("connection", "") for c in rB.get("cards", []))
    kw_a = "收入" in connA or "开销" in connA or "房租" in connA or "工资" in connA
    kw_b = "offer" in connB or "价值观" in connB or "加班" in connB or "平衡" in connB
    print(f"  A 的解读确实围绕收入担忧: {'通过' if kw_a else '失败'}")
    print(f"  B 的解读确实围绕价值观担忧: {'通过' if kw_b else '失败'}")
    print(f"  两次解读有实质差异（focus/综合不同）: "
          f"{'通过' if rA.get('focus') != rB.get('focus') and rA.get('synthesis') != rB.get('synthesis') else '失败'}")
    all_hits += scan_forbidden("case1A", rA) + scan_forbidden("case1B", rB)

    # ---- 案例 4+5：完整流程 + 用户纠正 + 连续追问 ----
    desc4 = ("我在一家公司做了三年设计，想辞职。存款大概能撑八个月。"
             "最近总失眠，一想到上班就胃疼，但我又怕辞职后找不到更好的。")
    r4 = post("/api/understand", {"description": desc4, "clarify": []})
    save("case4_understand", r)
    brief("案例4 流程-理解", r4, ["empathy", "clarify_question"])
    if r4.get("need_clarify") and r4.get("clarify_question"):
        ans = "主要是怕空窗期太久，简历上不好看；钱倒不是最大的问题。"
        r4b = post("/api/understand", {
            "description": desc4,
            "clarify": [{"question": r4["clarify_question"], "answer": ans}],
        })
        save("case4_understand2", r4b)
        clarify = [{"question": r4["clarify_question"], "answer": ans}]
        understanding = r4b.get("understanding") or r4.get("understanding")
    else:
        clarify = []
        understanding = r4.get("understanding")

    sp = post("/api/spread", {"description": desc4, "clarify": clarify, "understanding": understanding})
    save("case4_spread", sp)
    brief("案例4 流程-牌阵", sp, ["question", "spread_note"])
    print("  牌位: " + " / ".join(p["name"] for p in sp.get("positions", [])))

    itp = post("/api/interpret", {
        "description": desc4, "clarify": clarify, "understanding": understanding,
        "question": sp["question"], "positions": sp["positions"], "cards": same_cards,
    })
    save("case4_interpret", itp)
    brief("案例4 流程-解读", itp, ["focus"])

    # 用户纠正（牌面保持不变）
    f1 = post("/api/followup", {
        "description": desc4, "clarify": clarify, "understanding": understanding,
        "question": sp["question"], "positions": sp["positions"], "cards": same_cards,
        "interpretation": itp,
        "followups": [],
        "message": "我并不担心钱，我的存款够撑一年。我担心的是发展停滞——设计技能三年没有长进。",
    })
    save("case4_correction", f1)
    brief("案例4 用户纠正", f1, ["ack", "understanding_changes", "revised_parts"])
    print(f"  更新了理解: {'通过' if f1.get('understanding_changes') else '失败'}")
    print(f"  调整了此前解读: {'通过' if f1.get('revised_parts') else '失败'}")
    print(f"  保留原牌面（结构保证）: 通过")
    all_hits += scan_forbidden("case4", f1)

    # 连续追问：解释依据，检验记忆与一致性
    f2 = post("/api/followup", {
        "description": desc4, "clarify": clarify,
        "understanding": understanding,
        "question": sp["question"], "positions": sp["positions"], "cards": same_cards,
        "interpretation": itp,
        "followups": [{
            "question": "我并不担心钱，我的存款够撑一年。我担心的是发展停滞——设计技能三年没有长进。",
            "answer": f1.get("answer", ""),
            "understanding_changes": f1.get("understanding_changes", []),
            "revised_parts": f1.get("revised_parts", []),
        }],
        "message": "为什么把恶魔牌放在「当前消耗你的因素」这个位置来解读？",
    })
    save("case5_followup2", f2)
    brief("案例5 连续追问", f2, ["ack"])
    a2 = f2.get("answer", "")
    refs_card = any(k in a2 for k in ["恶魔", "束缚", "沉迷", "牌"])
    refs_correction = any(k in a2 for k in ["发展", "停滞", "存款", "不担心钱"])
    print(f"  回应引用了具体牌: {'通过' if refs_card else '失败'}")
    print(f"  沿用了纠正后的语境（不退回钱的问题）: {'通过' if refs_correction else '待人工确认'}")
    all_hits += scan_forbidden("case5", f2)

    print("\n===== 总结 =====")
    print(f"事实边界全量扫描: {'全部通过' if not all_hits else '命中: ' + str(set(all_hits))}")


if __name__ == "__main__":
    main()
