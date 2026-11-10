"""Blind Spot Lab share cards and app icons.

Output:
  cards/og/<slug>.png    1200x630 link preview (atlas entries + philosophy)
  cards/post/<slug>.png  1080x1350 social post
  cards/og/site.png      site preview
  cards/og/g-<page>.png  game / section previews (picked up by build.py automatically)
  static/icons/*.png     app icons
Run: python3 tools/cards.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
ART = ROOT / "tools" / "art"
SITE = "tahawi0.github.io/blindspotlab"
KIND = {"fallacy": "FALLACY", "bias": "COGNITIVE BIAS", "tool": "THINKING TOOL", "philosopher": "PHILOSOPHER", "school": "SCHOOL OF THOUGHT"}
PAPER, LEAF, INK, MUTED, TEAL, AMBER, AMBER_SOFT, RULE = "#F6F6F2", "#FFFFFF", "#1A1F24", "#5B636C", "#14625E", "#D9962B", "#F6E7CC", "#DCDDD6"


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


HEAD = lambda s: font("Fraunces-Bold.ttf", s)
SEMI = lambda s: font("Inter-SemiBold.ttf", s)
BODY = lambda s: font("Inter-Regular.ttf", s)


def tw(d, s, f):
    return d.textlength(s, font=f)


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in str(text).split():
        t = (cur + " " + w).strip()
        if tw(d, t, f) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit(d, text, maxw, start, lines=2, step=4, minsize=40):
    size = start
    while size > minsize:
        f = HEAD(size)
        if len(wrap(d, text, f, maxw)) <= lines:
            return f
        size -= step
    return HEAD(minsize)


def eye(d, cx, cy, s, col=INK, dot=AMBER):
    """The Blind Spot Lab mark: an eye with a missing patch (amber dot)."""
    w = max(2, int(s / 12))
    d.arc([cx - s, cy - s * .62, cx + s, cy + s * .62], 200, 340, fill=col, width=w)
    d.arc([cx - s, cy - s * .62, cx + s, cy + s * .62], 20, 125, fill=col, width=w)
    d.ellipse([cx - s * .3, cy - s * .3, cx + s * .3, cy + s * .3], outline=col, width=w)
    d.ellipse([cx - s * .12, cy - s * .12, cx + s * .12, cy + s * .12], fill=col)
    r = s * .17
    d.ellipse([cx - s * .7 - r, cy + s * .34 - r, cx - s * .7 + r, cy + s * .34 + r], fill=dot)


def brand(d, x, y, size=30, col=INK):
    eye(d, x + size * .7, y + size * .55, size * .62, col)
    d.text((x + size * 1.6, y), "Blind Spot Lab", font=HEAD(size), fill=col)


def base(W, H):
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    # soft teal glow top-right + amber "blind spot" bottom-left
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    for i in range(14, 0, -1):
        a = int(5 * (15 - i))
        g.ellipse([W - i * 60, -i * 45, W + i * 40, i * 45], fill=(20, 98, 94, max(0, 18 - a // 6)))
    im.paste(Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB"))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 10], fill=TEAL)
    return im, d


def mascot(name, h):
    p = ROOT / "assets" / "zina" / f"{name}.webp"
    if not p.exists():
        return None
    im = Image.open(ART / "zina" / f"{name}.webp" if (ART / "zina" / f"{name}.webp").exists() else p).convert("RGBA")
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)


def card(e, W, H, out):
    portrait = H > W
    im, d = base(W, H)
    m = 72
    inner = W - 2 * m - (0 if portrait else 300)
    y = m
    kind = KIND.get(e.get("kind"), "")
    kf = SEMI(26 if portrait else 24)
    d.rounded_rectangle([m, y, m + tw(d, kind, kf) + 36, y + 46], radius=23, fill=AMBER_SOFT)
    d.text((m + 18, y + 9), kind, font=kf, fill="#8A5A0F")
    y += 80
    tf = fit(d, e["name"], inner, 104 if portrait else 86)
    for ln in wrap(d, e["name"], tf, inner)[:2]:
        d.text((m, y), ln, font=tf, fill=INK)
        y += int(tf.size * 1.12)
    y += 18
    d.line([(m, y), (m + 110, y)], fill=AMBER, width=5)
    y += 34
    bf = BODY(44 if portrait else 34)
    for ln in wrap(d, e["oneLine"], bf, inner)[: (6 if portrait else 4)]:
        d.text((m, y), ln, font=bf, fill=INK)
        y += int(bf.size * 1.45)
    exs = e.get("examples") or ([{"where": "In real life", "text": e["life"]}] if e.get("life") else [])
    if portrait and exs:
        y += 30
        ex = exs[0]
        d.text((m, y), str(ex["where"]).upper(), font=SEMI(26), fill=TEAL)
        y += 50
        ef = BODY(36)
        top = y
        for ln in wrap(d, ex["text"], ef, inner - 34)[:6]:
            d.text((m + 34, y), ln, font=ef, fill=MUTED)
            y += int(ef.size * 1.5)
        d.line([(m, top + 6), (m, y - 12)], fill=TEAL, width=5)
    if not portrait:
        mc = mascot("think", 330)
        if mc:
            im.paste(mc, (W - m - mc.width + 20, H - m - mc.height - 20), mc)
    fy = H - m - 30
    brand(d, m, fy, 30)
    d.text((W - m - tw(d, SITE, BODY(24)), fy + 6), SITE, font=BODY(24), fill=MUTED)
    im.save(out, optimize=True)


def site_card(out):
    W, H = 1200, 630
    im, d = base(W, H)
    m = 80
    brand(d, m, m, 40)
    y = 190
    for ln in ["See what your", "mind misses."]:
        d.text((m, y), ln, font=HEAD(92), fill=INK)
        y += 104
    y += 20
    for ln in wrap(d, "Fallacies, biases and games that sharpen how you think.", BODY(30), 640):
        d.text((m, y), ln, font=BODY(30), fill=MUTED)
        y += 42
    mc = mascot("happy", 400)
    if mc:
        im.paste(mc, (W - m - mc.width + 30, H - mc.height - 60), mc)
    d.text((m, H - m - 10), SITE, font=BODY(26), fill=MUTED)
    im.save(out, optimize=True)


# key: (title, hook, mascot or other art, label)
GAMES = {
    "games": ("The Arena", "25 games and boards that train your thinking. A few minutes each.", "zina/happy", "BLIND SPOT LAB"),
    "daily": ("Fallacy of the Day", "A new puzzle every day. Can you spot the trick?", "zina/think", "DAILY"),
    "quiz": ("Test Yourself", "10 questions. How many fallacies can you catch?", "zina/explain", "QUIZ"),
    "games-court": ("Fallacy Court", "You're the judge. How many fallacies can you catch in court?", "court/judge", "GAME"),
    "games-family": ("The Family Group Chat", "Uncle Rick forwarded something wrong. Reply without starting a fight.", "family/m", "GAME"),
    "games-escape": ("Escape Room", "10 rooms. Every lock opens with logic alone.", "zina/think", "GAME"),
    "games-argue": ("Build the Argument", "Pick the premises that prove the point. No loopholes.", "zina/explain", "GAME"),
    "games-spot": ("Spot the Trick", "How is this ad trying to fool you?", "zina/shock", "GAME"),
    "games-lab": ("The Bias Lab", "4 real psychology experiments. Will your brain be fooled?", "zina/think", "EXPERIMENT"),
    "games-philosopher": ("Which Philosopher Are You?", "8 quick questions and a surprise at the end.", "zina/wink", "QUIZ"),
    "games-profile": ("Your Thinking Profile", "Find out which biases shape your decisions most.", "zina/think", "QUIZ"),
    "games-calibration": ("Confidence Check", "Is your confidence as good as your knowledge?", "zina/explain", "GAME"),
    "games-fix": ("Fix the Argument", "Say the same idea without the mistake.", "zina/explain", "GAME"),
    "games-charts": ("The Lying Chart", "No number is wrong, but the chart still lies. Where's the trick?", "zina/shock", "GAME"),
    "games-verify": ("News Detective", "Real, fake, or missing context? Investigate it yourself.", "zina/think", "GAME"),
    "games-rumor": ("Rumor Factory", "Learn how rumors are built so they can't fool you.", "zina/wink", "GAME"),
    "games-live": ("On Air", "You're moderating a live stream. Hide the bad comments fast.", "zina/shock", "GAME"),
    "games-debate": ("Debate Dot", "Can you win a debate against a lab assistant who loves to argue?", "zina/wink", "DEBATE"),
    "games-bayes": ("The Probability Tree", "The test came back positive. Are you really sick? The answer may surprise you.", "zina/shock", "GAME"),
    "games-duel": ("Challenge a Friend", "5 fallacy questions. Who wins?", "zina/happy", "CHALLENGE"),
    "games-league": ("The League", "Play every day, earn points, climb the board.", "zina/happy", "LEAGUE"),
    "games-mirror": ("The Crowd Mirror", "What did everyone choose, and which traps did they fall for?", "zina/think", "BOARD"),
    "games-skills": ("Your Skill Tree", "A map that lights up as you learn. What are you best at?", "zina/happy", "BOARD"),
    "teachers": ("For Teachers", "6 ready critical-thinking lessons with games and printable worksheets.", "zina/explain", "TEACHERS"),
    "tools": ("Thinking Tools", "10 small tools for thinking clearly before you decide or believe.", "zina/explain", "LEARN"),
    "philosophy-problems": ("Philosophers on Your Problem", "Worried or stuck? See what 3 schools of thought would tell you.", "zina/think", "PHILOSOPHY"),
    "philosophy-thought": ("Thought Experiments", "14 experiments that changed how we think. Think, then vote.", "zina/shock", "PHILOSOPHY"),
    "atlas-situations": ("Browse by Situation", "Where are you right now? See the tricks you might meet there.", "zina/think", "THE ATLAS"),
    "paths": ("Courses", "10 short courses, 5 minutes a day, beginner to advanced.", "zina/happy", "LEARN"),
    "atlas-sky": ("The Fallacy Sky", "70+ fallacies and biases in one night sky.", "zina/wink", "BOARD"),
}


def game_card(key, title, hook, img, label):
    W, H = 1200, 630
    im, d = base(W, H)
    m = 80
    p = ART / f"{img}.webp"
    pic = Image.open(p).convert("RGBA")
    ph = 400
    pic = pic.resize((int(pic.width * ph / pic.height), ph), Image.LANCZOS)
    if pic.width > 380:
        pic = pic.resize((380, int(pic.height * 380 / pic.width)), Image.LANCZOS)
    cx, cy = W - m - 200, 300
    d.ellipse([cx - 200, cy - 200, cx + 200, cy + 200], fill="#DDEDEA")
    im.paste(pic, (cx - pic.width // 2, cy - pic.height // 2 + 10), pic)
    inner = W - 2 * m - 440
    y = 100
    lf = SEMI(24)
    d.rounded_rectangle([m, y, m + tw(d, label, lf) + 36, y + 44], radius=22, fill=AMBER_SOFT)
    d.text((m + 18, y + 8), label, font=lf, fill="#8A5A0F")
    y += 74
    tf = fit(d, title, inner, 78, lines=2, minsize=44)
    for ln in wrap(d, title, tf, inner)[:2]:
        d.text((m, y), ln, font=tf, fill=INK)
        y += int(tf.size * 1.12)
    y += 22
    for size in (34, 31, 28):
        bf = BODY(size)
        lines = wrap(d, hook, bf, inner)
        if len(lines) <= 3:
            break
    for ln in lines[:3]:
        d.text((m, y), ln, font=bf, fill=MUTED)
        y += int(bf.size * 1.45)
    by = min(max(y + 24, 430), H - 150)
    bt, bfnt = "Play now", SEMI(30)
    bw = tw(d, bt, bfnt) + 64
    d.rounded_rectangle([m, by, m + bw, by + 62], radius=31, fill=TEAL)
    d.text((m + 32, by + 13), bt, font=bfnt, fill="#F6F6F2")
    brand(d, m, H - 66, 26)
    im.save(ROOT / "cards/og" / f"g-{key}.png", optimize=True)


def icons():
    out = ROOT / "assets" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for size, maskable in [(192, 0), (512, 0), (512, 1), (180, 0)]:
        im = Image.new("RGB", (size, size), TEAL)
        d = ImageDraw.Draw(im)
        s = size * (.30 if maskable else .36)
        eye(d, size / 2, size / 2, s, "#F6F6F2", AMBER)
        name = {(192, 0): "icon-192.png", (512, 0): "icon-512.png", (512, 1): "maskable-512.png", (180, 0): "apple-touch.png"}[(size, maskable)]
        im.save(out / name, optimize=True)


def main():
    (ROOT / "cards/og").mkdir(parents=True, exist_ok=True)
    (ROOT / "cards/post").mkdir(parents=True, exist_ok=True)
    items = json.load(open(ROOT / "content/entries.json", encoding="utf-8")) + json.load(open(ROOT / "content/philosophy.json", encoding="utf-8"))
    for e in items:
        card(e, 1200, 630, ROOT / "cards/og" / f"{e['slug']}.png")
        card(e, 1080, 1350, ROOT / "cards/post" / f"{e['slug']}.png")
    site_card(ROOT / "cards/og/site.png")
    for k, v in GAMES.items():
        game_card(k, *v)
    icons()
    print("cards:", len(items), "games:", len(GAMES))


if __name__ == "__main__":
    main()
