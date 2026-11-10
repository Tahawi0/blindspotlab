"""Build the Blind Spot Lab static site into docs/ from content/*.json."""
import json, shutil, html, hashlib
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
entries = json.loads((ROOT / "content/entries.json").read_text(encoding="utf-8"))
puzzles = json.loads((ROOT / "content/puzzles.json").read_text(encoding="utf-8"))
by_slug = {e["slug"]: e for e in entries}
KIND = {"fallacy": "Fallacy", "bias": "Bias", "tool": "Thinking Tool", "philosopher": "Philosopher", "school": "School of Thought"}
e_ = html.escape
VER = hashlib.md5(b"".join(f.read_bytes() for f in sorted((ROOT / "assets").glob("*.js")) + [ROOT / "assets" / "style.css"])).hexdigest()[:8]
dilemmas = json.loads((ROOT / "content/dilemmas.json").read_text(encoding="utf-8"))
weekly = json.loads((ROOT / "content/weekly.json").read_text(encoding="utf-8"))
paths = json.loads((ROOT / "content/paths.json").read_text(encoding="utf-8"))
thought = json.loads((ROOT / "content/thought.json").read_text(encoding="utf-8"))
problems = json.loads((ROOT / "content/problems.json").read_text(encoding="utf-8"))
# Example "where" labels grouped into situations, for the "Browse by Situation" index
SITU = [("Home and family", ["At home", "At Thanksgiving", "At Thanksgiving dinner", "In the family group chat", "In the kitchen", "At the dinner table",
                             "At your front door", "In the neighborhood", "On the neighborhood app", "In an HOA email", "In the HOA group", "In the HOA", "On a first date"]),
        ("Work and school", ["At work", "At school", "In business", "At a job interview", "On the office Slack"]),
        ("Online and in the news", ["On social media", "In the news", "On Instagram", "On TikTok", "On Reddit", "In a Reddit debate", "On YouTube", "On Facebook",
                                    "On a morning show", "On the local news", "In the media", "Online reviews", "In an Amazon review thread"]),
        ("Shopping and money", ["In ads", "Money", "Shopping", "On a used-car lot", "In investing", "At a flea market", "On a car lot", "At the lottery counter",
                                "At the mall", "In crypto", "At the grocery store", "With your money", "At the antique store", "Streaming plans",
                                "At the car dealership", "After buying a car", "At the car lot", "At the mechanic", "At the coffee shop"]),
        ("Sports and out and about", ["In sports", "On sports talk radio", "In fantasy football", "In fantasy football chat", "In the stands", "In the locker room",
                                      "On the road", "On the highway", "In the parking lot", "On a road trip", "On the street", "Out and about", "Before a trip",
                                      "At the movies", "At the movie theater", "In the community", "In everyday life"]),
        ("Health and food", ["In health", "At the doctor's office", "With your health", "A word of caution"])]
games = json.loads((ROOT / "content/games.json").read_text(encoding="utf-8"))
SITE = "https://tahawi0.github.io/blindspotlab/"
NAME = "Blind Spot Lab"
philo = json.loads((ROOT / "content/philosophy.json").read_text(encoding="utf-8"))
trends = json.loads((ROOT / "content/trends.json").read_text(encoding="utf-8"))
p_slug = {x["slug"]: x for x in philo}
ANALYTICS = ""  # Cloudflare Web Analytics token; empty = no beacon
URLS = []


def pl(n, one, many=None):
    """'1 point' / '2 points'."""
    return f"{n} {one if n == 1 else (many or one + 's')}"


LOGO = ('<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
        '<path d="M3 16c3.5-6 8-9 13-9s9.5 3 13 9"/><path d="M29 16c-3.5 6-8 9-13 9-2.6 0-5-.8-7.2-2.3"/>'
        '<circle cx="16" cy="16" r="4.5"/><circle class="ldot" cx="6.5" cy="22" r="2.2" fill="var(--gold)" stroke="none"/></svg>')

# Hero: an eye whose field of view has one missing patch — the blind spot
SCALE = """<svg class="scale bsl-eye" viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<g opacity=".35"><circle cx="100" cy="75" r="62" stroke-dasharray="2 7"/><circle cx="100" cy="75" r="44" stroke-dasharray="2 7"/></g>
<path d="M22 75c20-32 46-48 78-48s58 16 78 48"/><path d="M178 75c-20 32-46 48-78 48-12 0-23-2.3-33-7"/>
<circle cx="100" cy="75" r="22"/><circle cx="100" cy="75" r="9" fill="currentColor"/><circle cx="93" cy="68" r="3" fill="var(--paper)" stroke="none"/>
<circle class="spot" cx="52" cy="104" r="11" fill="var(--gold)" stroke="none"/><circle class="spot-ring" cx="52" cy="104" r="11" stroke="var(--gold)"/></svg>"""
ORN = '<div class="orn" aria-hidden="true"><span></span></div>'

HOME_TITLE = f"{NAME} — See what your mind misses"

# A distinct description for each main page (Google treats identical ones as duplicates)
PAGE_DESC = {
    HOME_TITLE: "Blind Spot Lab is a free site about how the mind fools us: an atlas of fallacies and biases, interactive games, a daily puzzle, and a tool that checks any argument.",
    f"The Atlas — {NAME}": "An atlas of logical fallacies and cognitive biases: 70+ fallacies, biases and thinking tools, each with everyday examples and a calm way to respond.",
    f"Fallacy of the Day — {NAME}": "A new puzzle every day: one line, one hidden fallacy. Spot it in a minute, keep your streak going, and share your result.",
    f"Dilemmas — {NAME}": "Moral dilemmas with no easy answer. Pick your side, see how other people voted, and find out what philosophers would say.",
    f"Analyze It — {NAME}": "Paste any post, headline or message and Blind Spot Lab points out the fallacies and biases in it, in plain English. Free.",
    f"Courses — {NAME}": "Short critical thinking courses: a small lesson, a task and a question each day. Five minutes a day, from beginner to advanced.",
    f"Weighing the Hype — {NAME}": "Viral claims from social media and dinner tables, weighed calmly: what holds up, what's a fallacy, and what still needs evidence.",
    f"Search — {NAME}": "Search everything on Blind Spot Lab: fallacies and biases, philosophers, courses and games.",
    f"About — {NAME}": "Blind Spot Lab is the free companion site of the Blind Spot Lab YouTube channel: what it is, what it offers, and how it's made.",
}


def atlas_desc(e):
    """Search description for an atlas page: the definition, plus an everyday example if it's short."""
    d = e["oneLine"].strip()
    if len(d) < 100 and e.get("examples"):
        ex = e["examples"][0]["text"].split("—")[0].strip()
        tail = {"tool": "Learn when to use it and where it breaks.", "bias": "Learn why your brain does it and how to catch it."}.get(e.get("kind"), "Learn how to spot it and answer it.")
        d = f"{d} Example: {ex} {tail}"
    return d


def page(title, body, root, active="", desc="", img="cards/og/site.png", path="", ld=None):
    # page-specific share card if one was generated (tools/game_cards.py)
    if img == "cards/og/site.png" and path:
        gk = "g-" + path.strip("/").replace("/", "-")
        if (ROOT / "cards" / "og" / f"{gk}.png").exists():
            img = f"cards/og/{gk}.png"
    groups = [("Learn", [("atlas/", "The Atlas", "Fallacies and biases"), ("tools/", "Thinking Tools", "How to think it through"), ("philosophy/", "Philosophy", "Philosophers and schools"), ("paths/", "Courses", "7 days, 5 minutes a day"), ("trends/", "Weighing the Hype", "Viral claims, weighed")]),
              ("Play", [("daily/", "Fallacy of the Day", "A new puzzle every day"), ("games/", "The Arena", "Every game in one place"), ("quiz/", "Test Yourself", "10 questions, then challenge a friend"), ("teachers/", "For Teachers", "6 ready-made lessons")]),
              ("Your Take", [("weekly/", "Question of the Week", "A big question and a vote"), ("dilemmas/", "Dilemmas", "No easy answers"), ("send/", "Send a Fallacy", "Heard something off? Send it")])]
    def grp(name, items):
        on = any(h == active for h, _, _ in items)
        li = "".join(f'<a href="{root}{h}"{" class=active" if h == active else ""}><b>{t}</b><span>{d}</span></a>' for h, t, d in items)
        return f'<details class="dd{" on" if on else ""}"><summary>{name}</summary><div class="menu">{li}</div></details>'
    links = "".join(grp(n, it) for n, it in groups) + f'<a class="cta{" active" if active == "analyze/" else ""}" href="{root}analyze/">Analyze It</a>'
    foot = [("about/", "About"), ("teachers/", "For Teachers"), ("privacy/", "Privacy"), ("search/", "Search"), ("send/", "Send a Fallacy")]
    flinks = "".join(f'<a href="{root}{h}">{t}</a>' for h, t in foot)
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ""
    beacon = f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{{"token": "{ANALYTICS}"}}\'></script>' if ANALYTICS else ""
    desc = desc or PAGE_DESC.get(title, "Blind Spot Lab: a free guide to how the mind fools us. Fallacies, biases and big questions, with everyday examples.")
    desc = " ".join(str(desc).split())
    if len(desc) > 160:  # Google cuts around 160 characters, so cut at the last word ourselves
        desc = desc[:157].rsplit(" ", 1)[0] + "…"
    d = e_(desc)
    return f"""<!doctype html>
<html lang="en" dir="ltr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{e_(title)}</title>
<meta name="description" content="{d}">
<meta property="og:type" content="website"><meta property="og:site_name" content="{NAME}"><meta property="og:locale" content="en_US">
<meta property="og:title" content="{e_(title)}"><meta property="og:description" content="{d}">
<meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{SITE}{img}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}{img}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/style.css?v={VER}">
<link rel="manifest" href="{root}manifest.webmanifest"><meta name="theme-color" content="#A47E2E">
<link rel="icon" type="image/png" href="{root}assets/icons/icon-192.png"><link rel="apple-touch-icon" href="{root}assets/icons/apple-touch.png">
<link rel="canonical" href="{SITE}{path}">{ldj}
<script>window.BSL_LANG="en";</script>
</head><body data-root="{root}">
<header class="top"><div class="wrap"><a class="logo" href="{root}">{LOGO}{NAME}</a><div class="top-tools"><a class="icon-btn acct" id="acct-btn" href="{root}account/" aria-label="Sign in"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a><button class="icon-btn snd" id="snd-btn" type="button" aria-pressed="false" aria-label="Turn sounds on" hidden><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w" d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/><path class="x" d="M16 9l5 6M21 9l-5 6"/></svg></button><a class="icon-btn" href="{root}search/" aria-label="Search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a><button class="icon-btn burger" aria-label="Menu" aria-expanded="false" aria-controls="mainnav"><span></span><span></span><span></span></button></div><nav id="mainnav" aria-label="Sections">{links}</nav></div></header>
<main><div class="wrap">{body}</div></main>
<footer><div class="wrap"><a class="logo" href="{root}">{LOGO}{NAME}</a><nav class="foot-links" aria-label="More links">{flinks}</nav><p>See what your mind misses. A free, open guide, written by a human with help from AI. Spot a mistake? Tell us and we'll fix it.</p>
<button class="btn ghost" id="install" hidden>Install Blind Spot Lab on your phone</button><p class="note" id="install-hint" hidden>On iPhone: tap the Share button in Safari, then "Add to Home Screen."</p></div></footer>
<script src="{root}assets/app.js?v={VER}"></script><script src="{root}assets/motion.js?v={VER}"></script><script src="{root}assets/config.js?v={VER}"></script><script src="{root}assets/account.js?v={VER}"></script>{beacon}
</body></html>"""


def write(rel, content):
    if rel.endswith("index.html"):
        URLS.append(rel[: -len("index.html")])
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def tile(e, root):
    return (f'<a class="tile" data-kind="{e["kind"]}" href="{root}atlas/{e["slug"]}/">'
            f'<span>{KIND[e["kind"]]}</span><b>{e_(e["name"])}</b><span>{e_(e["oneLine"])}</span></a>')


def intl(x):
    """The alternate/original name, shown only when it differs from the English name."""
    v = (x.get("intl") or "").strip()
    return f'<span class="intl">{e_(v)}</span>' if v and v.lower() != x["name"].strip().lower() else ""


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "assets", OUT / "assets")
    (OUT / ".nojekyll").write_text("")
    if (ROOT / "cards").exists():
        shutil.copytree(ROOT / "cards", OUT / "cards")
    for f in (ROOT / "static").glob("*"):
        shutil.copy(f, OUT / f.name)

    # home
    sample = [by_slug[x] for x in ["straw-man", "confirmation-bias", "sunk-cost", "survivorship", "ad-hominem", "anchoring"] if x in by_slug]
    doors = [("daily/", "Fallacy of the Day", "One small puzzle a day, straight from everyday life. Spot what's wrong and share your result."),
             ("atlas/", "The Atlas", f"{len(entries)} fallacies, biases and thinking tools, each with real-life examples and a calm way to respond."),
             ("games/", "The Arena", "Every Blind Spot Lab game in one place: catch the tricks, meet your biases, and challenge your friends."),
             ("philosophy/", "Philosophy", f"{len(philo)} philosophers and schools, from Socrates to Camus, each with one big idea you can use today."),
             ("trends/", "Weighing the Hype", "Viral claims from social media, weighed calmly: what holds up and what doesn't."),
             ("paths/", "Courses", f"{len(paths)} short courses, 7 days each: a small lesson and a task every day."),
             ("dilemmas/", "Dilemmas", f"{len(dilemmas)} situations with no easy answer. Pick a side, see how others voted and what philosophers said."),
             ("weekly/", "Question of the Week", "One big philosophical question every week. Vote and see what everyone else thinks."),
             ("analyze/", "Analyze It", "Paste something you heard, and Blind Spot Lab weighs it and tells you if something's off.")]
    doors_html = "".join(f'<li><a href="{h}"><b>{t}</b><span>{d}</span></a></li>' for h, t, d in doors)
    idx = "".join(f'<li><a href="atlas/{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in sample)
    body = f"""<section class="hero">{SCALE}<h1>See what your mind misses</h1>
<p class="lead">Blind Spot Lab is a free, open guide to how we think, and why we so often get it wrong. Plain English, everyday examples.</p></section>
<div class="trio">
<section class="today"><p class="kicker">Play</p><h2>Today's puzzle</h2><blockquote id="today-scene">…</blockquote><a class="btn" href="daily/">Solve it</a></section>
<section class="today" id="dilemma" data-id=""><p class="kicker">Your take</p><h2 id="hw-title">Question of the Week</h2><p id="hw-q"></p><div class="opts"><button></button><button></button></div>
<p class="lead small" id="vote-note"></p><div class="reveal" id="views"><a class="btn ghost" id="hw-more" href="weekly/">See what philosophers said</a></div></section>
<section class="today"><p class="kicker">Try it</p><h2>Analyze a line</h2><p>Heard something that felt off? Paste it here and Blind Spot Lab will weigh it.</p>
<form action="analyze/" method="get" class="mini-an" onsubmit="try{{sessionStorage.setItem('bsl-an-go','1')}}catch(e){{}}"><textarea name="t" rows="3" maxlength="1000" required placeholder="&quot;Everybody's doing it…&quot;"></textarea><button class="btn cta-btn" type="submit">Weigh it</button></form></section>
</div>
{ORN}<h2>What's inside</h2><ul class="doors">{doors_html}</ul>
{ORN}<h2>From the Atlas</h2><ul class="index">{idx}</ul><p class="back"><a href="atlas/">See every entry</a></p>
<script>(function(){{var d={json.dumps([p["scene"] for p in puzzles], ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,1))/864e5);document.getElementById("today-scene").textContent=d[((n%d.length)+d.length)%d.length];}})();</script>"""
    hw = [{"slug": w["slug"], "title": w["title"], "question": w["question"], "options": w["options"]} for w in weekly]
    body += f"""<script>(function(){{var W={json.dumps(hw, ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,7))/6048e5);if(n<0)n=0;var w=W[n%W.length],b=document.getElementById("dilemma");
b.setAttribute("data-id","week-"+w.slug);document.getElementById("hw-title").textContent=w.title;document.getElementById("hw-q").textContent=w.question;document.getElementById("hw-more").href="weekly/"+w.slug+"/";
b.querySelectorAll(".opts button").forEach(function(x,i){{x.textContent=w.options[i];}});}})();</script>
<script src="assets/config.js?v={VER}"></script><script src="assets/dilemma.js?v={VER}"></script>"""
    write("index.html", page(HOME_TITLE, body, "./", "", ld={"@context": "https://schema.org", "@type": "WebSite", "name": NAME, "url": SITE, "inLanguage": "en-US",
        "potentialAction": {"@type": "SearchAction", "target": SITE + "search/?q={q}", "query-input": "required name=q"}}))

    # atlas index
    def key(e):
        n = e["name"].strip("«»\"'“”‘’ ")
        return n[4:] if n.lower().startswith("the ") and len(n) > 5 else n
    groups = {}
    for e in sorted(entries, key=lambda x: key(x).lower()):
        groups.setdefault(key(e)[0].upper(), []).append(e)
    ix = "".join(f'<section class="grp"><div class="letter">{L}</div><ul class="index">' + "".join(
        f'<li data-kind="{e["kind"]}"><a href="{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in es) + '</ul></section>' for L, es in groups.items())
    nf = sum(e["kind"] == "fallacy" for e in entries)
    nb = sum(e["kind"] == "bias" for e in entries)
    nt = sum(e["kind"] == "tool" for e in entries)
    body = f"""<h1>The Atlas</h1><p class="lead">Every fallacy and bias, A to Z. Each entry has everyday examples, how to spot it, and how to answer it.</p>
<p><a class="btn ghost" href="sky/">✨ See the Atlas as a night sky</a> <a class="btn ghost" href="situations/">🧭 Browse by situation</a> <a class="btn ghost" href="../tools/">🛠 Thinking Tools</a></p>
<div class="filters"><button class="on" data-f="all">All ({len(entries)})</button><button data-f="fallacy">Fallacies ({nf})</button><button data-f="bias">Biases ({nb})</button><button data-f="tool">Thinking Tools ({nt})</button></div>
<div id="g">{ix}</div>
<script>document.querySelectorAll('.filters button').forEach(function(b){{b.onclick=function(){{
document.querySelectorAll('.filters button').forEach(function(x){{x.classList.remove('on')}});b.classList.add('on');
document.querySelectorAll('#g li').forEach(function(t){{t.style.display=(b.dataset.f==='all'||t.dataset.kind===b.dataset.f)?'':'none'}});
document.querySelectorAll('#g .grp').forEach(function(g){{g.style.display=[].some.call(g.querySelectorAll('li'),function(l){{return l.style.display!=='none'}})?'':'none'}});}}}});</script>"""
    write("atlas/index.html", page(f"The Atlas — {NAME}", body, "../", "atlas/"))
    # The Fallacy Sky
    skyd = [{"s": e["slug"], "n": e["name"], "k": e["kind"], "o": e["oneLine"], "c": (e.get("notConfuse") or {}).get("slug")} for e in entries if e["kind"] != "tool"]
    lead = "The whole Atlas as one night sky. Every star is a fallacy or a bias, and the lines connect the ones people mix up. Tap a star to light up its relatives."
    body = f"""<p class="kicker"><a href="../">The Atlas</a></p><h1>The Fallacy Sky</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"entries": skyd}, ensure_ascii=False)};</script><script src="../../assets/sky.js?v={VER}"></script>"""
    write("atlas/sky/index.html", page(f"The Fallacy Sky — {NAME}", body, "../../", "atlas/", lead, path="atlas/sky/"))
    # Browse by Situation
    secs = ""
    for i, (n, ws) in enumerate(SITU):
        es = [e for e in entries if e["kind"] != "tool" and any(x["where"] in ws for x in e["examples"])]
        items = "".join(f'<li data-kind="{e["kind"]}"><a href="../{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(next(x["text"] for x in e["examples"] if x["where"] in ws))}</span></a></li>' for e in es)
        secs += f'<section class="grp" id="s{i}"><h2>{n} <small>({len(es)})</small></h2><ul class="index">{items}</ul></section>'
    chips = "".join(f'<a class="chip" href="#s{i}">{n}</a>' for i, (n, _) in enumerate(SITU))
    lead = "Where are you right now? Pick a situation and see the tricks and biases you're most likely to run into there, each with an example."
    write("atlas/situations/index.html", page(f"Browse by Situation — {NAME}", f'<p class="kicker"><a href="../">The Atlas</a></p><h1>Browse by Situation</h1><p class="lead">{lead}</p><div class="chips">{chips}</div>{secs}', "../../", "atlas/", lead, path="atlas/situations/"))
    # Thinking Tools
    tl = "".join(f'<li><a href="../atlas/{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND["tool"]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in entries if e["kind"] == "tool")
    lead = "The Atlas teaches you to spot the mistake. These tools help you think it through: small questions and rules to use before you decide, believe, or reply."
    write("tools/index.html", page(f"Thinking Tools — {NAME}", f'<p class="kicker">Learn</p><h1>Thinking Tools</h1><p class="lead">{lead}</p><ul class="index">{tl}</ul><p class="note">Every tool has limits, and they\'re listed on its page. A tool helps you think. It doesn\'t think for you.</p>', "../", "tools/", lead, path="tools/"))

    # entries
    for e in entries:
        r = "../../"
        exs = "".join(f'<div class="ex"><small>{e_(x["where"])}</small><div>{e_(x["text"])}</div></div>' for x in e["examples"])
        nc = e.get("notConfuse") or {}
        evt = (e.get("evidence") or "").strip()
        ev = f'<h2>Strength of evidence</h2><p>{e_(evt[0].upper() + evt[1:])}</p>' if evt else ""
        src = "".join(f"<li>{e_(s)}</li>" for s in e.get("sources", []))
        tool = e["kind"] == "tool"
        h_det, h_res = ("When to use it", "How to use it") if tool else ("How to spot it", "How to respond without a fight")
        lim = f'<h2>Where it breaks</h2><p>{e_(e["limits"])}</p>' if e.get("limits") else ""
        tags = [n for n, ws in SITU if any(x["where"] in ws for x in e["examples"])]
        tagh = ('<p class="where-tags">' + ('Where it helps: ' if tool else "Where you'll meet it: ") + " ".join(f'<a class="chip" href="{r}atlas/situations/#s{[n for n, _ in SITU].index(t)}">{t}</a>' for t in tags) + "</p>") if tags else ""
        pz = next((q for q in puzzles if q.get("entry") == e["slug"]), None)
        quiz = ""
        if pz:
            qo = "".join(f'<button type="button" data-ok="{1 if i == pz["answer"] else 0}">{e_(o)}</button>' for i, o in enumerate(pz["options"]))
            quiz = f'''<section class="today eq"><p class="kicker">Test yourself</p><p class="scene">{e_(pz["scene"])}</p><p>What's the trick here?</p><div class="opts">{qo}</div><p class="eq-why" hidden>{e_(pz.get("why", ""))}</p></section>'''
        body = f"""<p class="kicker">{KIND[e['kind']]}</p>
<h1>{e_(e['name'])}</h1>{intl(e)}
<p class="oneline">{e_(e['oneLine'])}</p>
{tagh}<h2>In real life</h2>{exs}
<h2>{h_det}</h2><p>{e_(e['detect'])}</p>
<h2>{h_res}</h2><p>{e_(e['respond'])}</p>{lim}
{f"<h2>Don't confuse it with: " + (f'<a href="{r}atlas/{nc["slug"]}/">{e_(nc["name"])}</a>' if nc.get("slug") else e_(nc["name"])) + f"</h2><p>{e_(nc['diff'])}</p>" if nc else ""}
{ev}{quiz}<h2>Sources</h2><ul class="sources">{src}</ul>
<h2>Share it</h2><p><a class="btn ghost" href="{r}cards/post/{e['slug']}.png" download>Download the post card</a> <a class="btn ghost" href="{r}cards/og/{e['slug']}.png" download>Wide card</a></p>
<p class="report"><a href="{r}send/?err=atlas/{e['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}{"tools" if tool else "atlas"}/">Back to the index</a></p>
<script>document.querySelectorAll(".eq .opts button").forEach(function(b){{b.onclick=function(){{var bs=b.parentNode.querySelectorAll("button");bs.forEach(function(x){{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("right");}});if(b.dataset.ok!=="1")b.classList.add("wrong");var w=document.querySelector(".eq-why");if(w&&w.textContent)w.hidden=false;}};}});</script>"""
        write(f"atlas/{e['slug']}/index.html", page(f"{e['name']} — {NAME}", body, r, "atlas/", atlas_desc(e), f"cards/og/{e['slug']}.png", f"atlas/{e['slug']}/",
              {"@context": "https://schema.org", "@type": "DefinedTerm", "name": e["name"], "alternateName": e["intl"], "description": e["oneLine"], "inLanguage": "en-US",
               "url": f"{SITE}atlas/{e['slug']}/", "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "The Blind Spot Lab Atlas", "url": f"{SITE}atlas/"}}))

    # daily
    body = """<p class="kicker">Puzzle #<span id="dayno"></span></p>
<h1 style="font-size:2rem">Fallacy of the Day</h1><div class="sheet"><p class="scene" id="scene"></p><div class="opts" id="opts"></div>
<div class="reveal" id="reveal"><h2 id="verdict" style="margin-top:8px"></h2><p id="why"></p>
<a class="btn ghost" id="more" href="#">Read about it in the Atlas</a> <button class="btn" id="share">Share your result</button></div></div>
<div class="stats"><div><b id="s-streak">0</b>Day streak</div><div><b id="s-best">0</b>Best streak</div><div><b id="s-played">0</b>Played</div></div>
<p class="note">A new puzzle every day.</p>
<h2 id="past-h">Past puzzles</h2><p class="lead" style="font-size:15px">Play them for practice. They won't affect your streak.</p><div class="grid" id="past"></div>"""
    body += f"<script>window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};</script><script src=\"../assets/daily.js?v={VER}\"></script>"
    write("daily/index.html", page(f"Fallacy of the Day — {NAME}", body, "../", "daily/"))


    # dilemmas
    tiles = "".join(f'<a class="tile" href="{d["slug"]}/"><span>Dilemma</span><b>{e_(d["title"])}</b><span>{e_(d["question"])}</span></a>' for d in dilemmas)
    write("dilemmas/index.html", page(f"Dilemmas — {NAME}", f'<h1>Dilemmas</h1><p class="lead">Situations with no easy answer. Pick a side, then see how philosophers look at it.</p><div class="grid">{tiles}</div>', "../", "dilemmas/"))
    for d in dilemmas:
        r = "../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in d["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["school"])}</small><div>{e_(v["text"])}</div></div>' for v in d["views"])
        body = f"""<p class="kicker">Dilemma</p><h1>{e_(d['title'])}</h1>
<div class="sheet" id="dilemma" data-id="{d['slug']}"><p class="scene">{e_(d['scene'])}</p><h2 style="margin-top:4px">{e_(d['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>How do philosophers see it?</h2>{views}
<p class="note">There's no single right answer here. The point is knowing why you chose what you chose.</p></div></div>
<p class="report"><a href="{r}send/?err=dilemmas/{d['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}dilemmas/">All dilemmas</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"dilemmas/{d['slug']}/index.html", page(f"{d['title']} — {NAME}", body, r, "dilemmas/", d["scene"]))

    # analyze
    names = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    body = f"""<h1>Analyze It</h1><p class="lead">Paste a line, a post, or something you heard, and Blind Spot Lab will tell you whether there's a fallacy or bias in it, and how you might reply.</p>
<form id="an-form" class="sheet"><textarea id="an-text" rows="6" maxlength="1000" placeholder="For example: &quot;Everyone's buying this phone, so it must be the best one.&quot;"></textarea>
<p style="margin:10px 0 0"><button class="btn" type="submit">Weigh it</button> <span id="an-status" class="lead" style="font-size:14px"></span></p></form>
<p class="note warn">This is an automated AI analysis, and it can be wrong. Treat it as a second opinion to help you think, not a final verdict, and check the Atlas entry before relying on it.</p>
<div id="an-out" style="margin-top:16px"></div>
<p class="note">Please don't include personal details like names or phone numbers. Your text is sent to a server to be analyzed.</p>
<script>window.MIZAN_NAMES={names};</script><script src="../assets/config.js?v={VER}"></script><script src="../assets/analyze.js?v={VER}"></script>"""
    write("analyze/index.html", page(f"Analyze It — {NAME}", body, "../", "analyze/"))

    # quiz
    body = f"""<p class="kicker">10 questions</p><h1>Test Yourself</h1>
<p class="note" id="q-banner" hidden></p><div class="sheet"><div id="q-intro"><p class="scene">You'll see 10 everyday situations, each hiding a fallacy or a bias. Pick your answer, and at the end you'll see how many you caught.</p>
<p><button class="btn" id="q-start">Start</button></p></div>
<div id="q-play" style="display:none"><p class="kicker" id="q-no"></p><div class="bar"><i id="q-bar"></i></div>
<p class="scene" id="q-scene"></p><div class="opts" id="q-opts"></div><p id="q-why" style="margin-top:1rem"></p>
<p><button class="btn" id="q-next" style="display:none"></button></p></div>
<div id="q-end" style="display:none" class="center"><p class="kicker">Your score</p><p class="big"><span id="q-score">0</span><small> / 10</small></p>
<h2 id="q-level" style="justify-content:center"></h2><p class="verdict" id="q-vs" hidden></p><p class="lead" style="margin:0 auto">Your best score: <b id="q-best">0</b></p>
<p style="margin-top:1rem"><button class="btn" id="q-challenge">Challenge a friend</button> <button class="btn ghost" id="q-share">Share your result</button> <button class="btn ghost" id="q-again">Play again</button></p>
<div id="q-review-h"><h2 style="justify-content:center">Review these</h2><ul class="index" id="q-review" style="text-align:start"></ul></div></div></div>
<p class="note">You get a different set of questions each time, drawn from {len(puzzles)} puzzles.</p>
<script>window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};window.MIZAN_NAMES={json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)};</script><script src="../assets/quiz.js?v={VER}"></script>"""
    write("quiz/index.html", page(f"Test Yourself — {NAME}", body, "../", "quiz/", "10 quick questions on the fallacies all around us. How many can you catch out of 10? Get your score in two minutes, then challenge a friend.", path="quiz/"))

    # games
    gx = "../../"
    # The Arena: every game and board in one place
    ARENA = [
        ("Every day", "Come back daily. There's always something new waiting.", [
            ("daily/", "Fallacy of the Day", "A new puzzle every day, and a streak to protect.", "1 min", False),
            ("weekly/", "Question of the Week", "One big philosophical question. Vote and see what everyone thinks.", "2 min", False)]),
        ("Spot the mistake", "Catch the trick before it slips past you.", [
            ("games/duel/", "Challenge a Friend", "5 questions and a link with your score. Your friend plays the same ones, and you compare answer by answer.", "3 min", True),
            ("quiz/", "Test Yourself", "10 questions, then challenge a friend on the same set.", "5 min", False),
            ("games/court/", "Fallacy Court", "10 cases that unlock one by one. Object the moment you hear a fallacy.", "5 min", True),
            ("games/family/", "The Family Group Chat", "10 levels of family group chat drama. How do you reply without starting a fight?", "4 min", True),
            ("games/spot/", "Spot the Trick", "10 ads in levels, each hiding its tricks a little better than the last.", "5 min", True),
            ("games/live/", "On Air", "You're moderating comments on a livestream. Hide the fallacies before they get through.", "3 min", True)]),
        ("News and numbers", "Numbers and headlines can lie without a single false word.", [
            ("games/charts/", "The Lying Chart", "10 misleading charts. Catch the trick, then fix the chart yourself.", "5 min", True),
            ("games/verify/", "News Detective", "8 stories and 5 fact-checking tools. Real, fake, or missing context?", "6 min", True),
            ("games/rumor/", "Rumor Factory", "Play the owner of a rumor page and learn the tricks from the inside, so you can spot them.", "6 min", True),
            ("games/bayes/", "The Probability Tree", "An accurate test came back positive. Are you actually sick? Guess, then see the math.", "4 min", True)]),
        ("Know yourself", "What sways your brain without you noticing?", [
            ("games/lab/", "The Bias Lab", "4 real psychology experiments, run on you.", "4 min", False),
            ("games/philosopher/", "Which Philosopher Are You?", "8 light questions… and a surprise at the end.", "3 min", False),
            ("games/profile/", "Your Thinking Profile", "15 situations, and at the end a chart of the biases that sway you most.", "4 min", True),
            ("games/calibration/", "Confidence Check", "10 levels: does what you know match how sure you feel?", "4 min", True)]),
        ("Build it right", "Don't just catch the mistake. Learn to make the point well.", [
            ("games/escape/", "Escape Room", "10 rooms in a row, and every lock opens with reasoning alone.", "8 min", True),
            ("games/argue/", "Build the Argument", "10 levels that teach you logic itself: pick the premises that prove the conclusion.", "5 min", True),
            ("games/fix/", "Fix the Argument", "10 levels: choose how to make the point without the mistake.", "4 min", True),
            ("games/debate/", "Debate Dot", "6 ready-made debates in levels, plus a free-form debate with AI.", "5 min", True)]),
        ("Your take", "Situations with no easy answer.", [
            ("dilemmas/", "Dilemmas", f"{len(dilemmas)} hard calls. Vote, then see what philosophers said.", "2 min", False)]),
        ("Boards", "See how other people think, and where you fit.", [
            ("games/league/", "The League", "A weekly leaderboard under a nickname you pick. Play daily, earn points, and climb.", "Daily", True),
            ("games/mirror/", "The Crowd Mirror", "A live board of every vote and experiment: what people chose, and what fooled them.", "2 min", True),
            ("games/skills/", "Your Skill Tree", "A map that lights up as you learn: see where you're strong and what to grow next.", "1 min", True),
            ("atlas/sky/", "The Fallacy Sky", "The whole Atlas as stars, with lines between the ones people mix up.", "2 min", True)]),
    ]
    def atile(h, t, d, m, new):
        badge = '<em class="new">New</em>' if new else ''
        return f'<a class="tile atile" href="../{h}"><span class="meta">{m}{badge}</span><b>{t}</b><span>{d}</span></a>'
    secs = "".join(f'<section class="arena-sec"><h2>{n}</h2><p class="lead">{l}</p><div class="grid">{"".join(atile(*g) for g in gs)}</div></section>' for n, l, gs in ARENA)
    count = sum(len(gs) for _, _, gs in ARENA)
    START = [("Catch bad arguments", [("daily/", "Fallacy of the Day", "One puzzle, one minute."), ("games/court/", "Fallacy Court", "Object the moment you hear a fallacy.")]),
             ("Understand how my brain works", [("games/profile/", "Your Thinking Profile", "15 situations, and a card of your top biases."), ("games/lab/", "The Bias Lab", "Real psychology experiments, run on you.")]),
             ("Stop believing every headline", [("games/verify/", "News Detective", "Check before you believe."), ("games/charts/", "The Lying Chart", "Numbers lie too.")]),
             ("Argue and reply better", [("games/family/", "The Family Group Chat", "A smart reply that doesn't start a fight."), ("games/debate/", "Debate Dot", "Debate a little lab assistant who loves to argue.")])]
    chips = "".join(f'<button type="button" class="chip{" on" if i == 0 else ""}" data-i="{i}">{t}</button>' for i, (t, _) in enumerate(START))
    picks = "".join(f'<div class="grid start-picks" data-i="{i}"{"" if i == 0 else " hidden"}>' + "".join(f'<a class="tile atile" href="../{h}"><b>{t}</b><span>{d}</span></a>' for h, t, d in gs) + '</div>' for i, (_, gs) in enumerate(START))
    starter = f'''<section class="start-here"><h2>New here? Start here</h2><p class="lead">What do you want to get better at?</p><div class="chips">{chips}</div>{picks}</section>
<script>document.querySelectorAll(".start-here .chip").forEach(function(b){{b.onclick=function(){{document.querySelectorAll(".start-here .chip").forEach(function(x){{x.classList.toggle("on",x===b)}});document.querySelectorAll(".start-picks").forEach(function(g){{g.hidden=g.dataset.i!==b.dataset.i}})}}}});</script>'''
    body = f'''<div class="arena-hero"><p class="kicker">Play and learn</p><h1>The Arena</h1><p class="lead">{count} games and boards in one place. Each takes a few minutes and teaches you something about how you think.</p></div>{starter}{secs}'''
    write("games/index.html", page(f"The Arena — {NAME}", body, "../", "games/", "The Arena: every Blind Spot Lab game in one place. Psychology experiments, trick-spotting, dilemmas, and challenges for your friends.", path="games/"))
    names_js = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    pn = json.dumps({k: {"name": p_slug[k]["name"]} for k in games["phil"]["results"]}, ensure_ascii=False)
    spec = {
        "lab": ("The Bias Lab", "These experiments have been run on thousands of people in well-known studies. Answer quickly and honestly, then see how your brain was nudged. Answers are anonymous, and we don't record anything about you.", {"lab": games["lab"]}, True),
        "spot": ("Spot the Trick", "These ads are made up, for brands that don't exist. Tap any line you think hides a trick, then tap \"Done.\"", {"spot": games["spot"]}, False),
        "philosopher": ("Which Philosopher Are You?", "8 light questions about everyday situations. Pick what feels closest without overthinking it, and at the end you'll find out which philosopher thinks like you, and why.", {"phil": games["phil"]}, False),
        "calibration": ("Confidence Check", "10 levels of 5 statements each: say true or false, then say how sure you are. Your stars depend on how well your confidence matches what you actually know.", {"calib": games["calibStages"]}, False),
        "fix": ("Fix the Argument", "10 levels, and every line has a mistake. Pick the version that makes the same point without it. Careful: the wrong versions hide other fallacies.", {"fix": games["fixStages"]}, False)}
    gid = {"lab": "lab", "spot": "spot", "philosopher": "phil", "calibration": "calib", "fix": "fix"}
    for slug, (title, lead, data, api) in spec.items():
        data["philNames"] = json.loads(pn)
        body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>{title}</h1><p class="lead">{lead}</p>
<div id="game" data-game="{gid[slug]}"{' class="sheet"' if slug != "lab" else ''}></div>
<script>window.MIZAN_GAME={json.dumps(data, ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script>{f'<script src="{gx}assets/config.js?v={VER}"></script>' if api else ''}<script src="{gx}assets/stages.js?v={VER}"></script><script src="{gx}assets/games.js?v={VER}"></script>"""
        write(f"games/{slug}/index.html", page(f"{title} — {NAME}", body, gx, "games/", lead, path=f"games/{slug}/"))

    # Arena games with their own JS file each
    NEW_GAMES = {
        "court": ("Fallacy Court", "You're the judge in 10 cases, each harder than the last, ending with the boss case. Object the moment you hear a fallacy, and rule only on sound evidence.", "court"),
        "family": ("The Family Group Chat", "The messages are rolling in on the family group chat, and some of them are way off. Pick your reply: attack, stay quiet, or answer calmly and smartly?", "family"),
        "escape": ("Escape Room", "10 rooms in a row, and every door has a lock that only logic can open. Get out as fast as you can, then challenge your friends.", "escape"),
        "argue": ("Build the Argument", "You get a conclusion and a hand of premise cards. Pick the two premises that, if true, make the conclusion true. Watch out for the cards that only sound convincing.", "argue"),
        "charts": ("The Lying Chart", "A chart can lie without a single wrong number. Catch the trick, fix the chart yourself, then judge the headline.", "charts"),
        "rumor": ("Rumor Factory", "Play the owner of a page that spreads rumors and learn 6 misinformation tricks from the inside. At the end, you become the detective.", "rumor"),
        "verify": ("News Detective", "A story just landed on your phone. Use only the fact-checking tools you need, then decide: real, fake, missing context, or old news recycled?", "verify"),
        "live": ("On Air", "You're the comment moderator on a livestream. Hide the comments with fallacies before they get through, and leave honest disagreement alone.", "live"),
        "debate": ("Debate Dot", "Dot takes the other side and debates you. In the ready-made levels you pick your reply. In the free debate you type your own, and AI answers and tells you if you slipped into a fallacy.", "debate"),
        "bayes": ("The Probability Tree", "One of the most famous questions people, even doctors, get wrong: if your test comes back positive, how likely is it that you're actually sick?", "bayes"),
        "profile": ("Your Thinking Profile", "15 everyday situations. Answer honestly, and at the end you'll see the biases that sway your decisions most, on a card you can share.", "profile"),
    }
    for slug, (title, lead, src) in NEW_GAMES.items():
        data = json.loads((ROOT / "content" / f"{src}.json").read_text(encoding="utf-8"))
        body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>{title}</h1><p class="lead">{lead}</p>
<div id="game" class="sheet"></div>
<p class="report"><a href="{gx}send/?err=games/{slug}/">Spot a mistake on this page? Tell us</a></p>
<script>window.MIZAN_GAME={json.dumps(data, ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script><script src="{gx}assets/stages.js?v={VER}"></script><script src="{gx}assets/{slug}.js?v={VER}"></script>"""
        write(f"games/{slug}/index.html", page(f"{title} — {NAME}", body, gx, "games/", lead, path=f"games/{slug}/"))

    # Challenge a Friend
    lead = "Challenge a friend to 5 fallacy questions. Everything lives inside the link itself, and nothing is saved on a server."
    body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>Challenge a Friend</h1><p class="lead">{lead}</p>
<div id="game" class="sheet"></div>
<script>window.MIZAN_PUZZLES={json.dumps([{k: p[k] for k in ("id", "scene", "options", "answer", "why", "entry")} for p in puzzles], ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script><script src="{gx}assets/duel.js?v={VER}"></script>"""
    write("games/duel/index.html", page(f"Challenge a Friend — {NAME}", body, gx, "games/", lead, path="games/duel/"))

    # Your Skill Tree
    def cnt(src, k):
        return len(json.loads((ROOT / "content" / f"{src}.json").read_text(encoding="utf-8"))[k])
    skg = {"court": {"key": "bsl-court", "n": 10}, "family": {"key": "bsl-family-stages", "n": 10}, "spot": {"key": "bsl-spot-stages", "n": len(games["spot"])},
           "calib": {"key": "bsl-calib-stages", "n": len(games["calibStages"])}, "fix": {"key": "bsl-fix-stages", "n": len(games["fixStages"])},
           "escape": {"key": "bsl-escape-stages", "n": cnt("escape", "rooms")}, "argue": {"key": "bsl-argue-stages", "n": cnt("argue", "levels")},
           "charts": {"key": "bsl-charts-stages", "n": cnt("charts", "stages")}, "verify": {"key": "bsl-verify-stages", "n": cnt("verify", "cases")},
           "rumor": {"key": "bsl-rumor-stages", "n": cnt("rumor", "levels") + 1}, "live": {"key": "bsl-live-stages", "n": cnt("live", "episodes")},
           "debate": {"key": "bsl-debate-stages", "n": cnt("debate", "topics")}}
    skills = [
        {"name": "Spotting fallacies", "icon": "🔍", "desc": "Catching the mistake in an argument the moment you hear it.", "src": ["daily", "quiz", "court", "live"], "go": [["daily/", "Fallacy of the Day"], ["games/court/", "Fallacy Court"], ["games/live/", "On Air"]]},
        {"name": "Self-awareness", "icon": "🧠", "desc": "Knowing what sways your brain without you noticing.", "src": ["lab", "profile", "calib"], "go": [["games/lab/", "The Bias Lab"], ["games/profile/", "Your Thinking Profile"], ["games/calibration/", "Confidence Check"]]},
        {"name": "Logic", "icon": "🧩", "desc": "Building sound arguments and solving puzzles by reasoning.", "src": ["argue", "escape", "fix"], "go": [["games/argue/", "Build the Argument"], ["games/escape/", "Escape Room"], ["games/fix/", "Fix the Argument"]]},
        {"name": "Media", "icon": "📰", "desc": "Spotting misleading news and rigged ads.", "src": ["verify", "rumor", "spot"], "go": [["games/verify/", "News Detective"], ["games/rumor/", "Rumor Factory"], ["games/spot/", "Spot the Trick"]]},
        {"name": "Numbers", "icon": "📊", "desc": "Reading charts and odds without getting fooled.", "src": ["charts", "bayes"], "go": [["games/charts/", "The Lying Chart"], ["games/bayes/", "The Probability Tree"]]},
        {"name": "Conversation", "icon": "💬", "desc": "Replying calmly and smartly, and debating without attacking.", "src": ["family", "debate", "debateAi", "duel"], "go": [["games/family/", "The Family Group Chat"], ["games/debate/", "Debate Dot"], ["games/duel/", "Challenge a Friend"]]},
        {"name": "Philosophy", "icon": "🏛", "desc": "Thinking through the big questions that have no easy answer.", "src": ["dilemmas", "paths"], "go": [["dilemmas/", "Dilemmas"], ["paths/", "Courses"], ["weekly/", "Question of the Week"]]}]
    lead = "A map of your thinking skills that lights up as you play and learn. Tap any skill to see how to grow it."
    body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>Your Skill Tree</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"games": skg, "skills": skills}, ensure_ascii=False)};</script><script src="{gx}assets/skills.js?v={VER}"></script>"""
    write("games/skills/index.html", page(f"Your Skill Tree — {NAME}", body, gx, "games/", lead, path="games/skills/"))

    # The Crowd Mirror
    ins = {"anchor": "If people who saw 75 guessed higher on average than people who saw 15, a number with nothing to do with the question changed their estimate. The right answer is 54.",
           "framing": "The two plans are exactly the same in numbers. If the shares differ, the wording alone changed the decision.",
           "linda": "The second option can never be more likely than the first. Everyone who picked it fell for the conjunction fallacy.",
           "decoy": "If the share is higher among people who saw 3 options, the decoy option worked on them."}
    mlab = [{"id": x["id"], "title": x["title"], "groupNames": x["groupNames"], "num": bool(x["groups"][0].get("num")), "metric": x.get("metric", 0), "metricLabel": x.get("metricLabel", ""), "insight": ins.get(x["id"], "")} for x in games["lab"]]
    mitems = [{"id": d["slug"], "title": d["title"], "opts": d["options"], "url": f"dilemmas/{d['slug']}/"} for d in dilemmas] + [{"id": "week-" + w["slug"], "title": w["title"], "opts": w["options"], "url": f"weekly/{w['slug']}/"} for w in weekly] + [{"id": "thought-" + t["slug"], "title": t["title"], "opts": t["options"], "url": f"philosophy/thought/{t['slug']}/"} for t in thought]
    gn = {"court": "Fallacy Court", "family": "The Family Group Chat", "escape": "Escape Room", "argue": "Build the Argument", "spot": "Spot the Trick", "calib": "Confidence Check", "fix": "Fix the Argument", "charts": "The Lying Chart", "verify": "News Detective", "rumor": "Rumor Factory", "live": "On Air", "debate": "Debate Dot", "quiz": "Test Yourself", "bayes": "The Probability Tree", "duel": "Challenge a Friend"}
    lead = "A live board that gathers every vote on the dilemmas and the Question of the Week, plus the results of the Bias Lab experiments. See how people think, and which traps they fell into."
    body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>The Crowd Mirror</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"lab": mlab, "items": mitems, "gameNames": gn}, ensure_ascii=False)};</script><script src="{gx}assets/config.js?v={VER}"></script><script src="{gx}assets/mirror.js?v={VER}"></script>"""
    write("games/mirror/index.html", page(f"The Crowd Mirror — {NAME}", body, gx, "games/", lead, path="games/mirror/"))

    # The League
    lg = [{"id": "daily", "name": "Fallacy of the Day", "url": "daily/", "rule": "10 points if you solve it, 2 for trying."},
          {"id": "quiz", "name": "Test Yourself", "url": "quiz/", "rule": "1 point per correct answer."},
          {"id": "court", "name": "Fallacy Court", "url": "games/court/", "rule": "Your case score out of 10."},
          {"id": "escape", "name": "Escape Room", "url": "games/escape/", "rule": "10 if you get out in 3 minutes, fewer the longer it takes."},
          {"id": "argue", "name": "Build the Argument", "url": "games/argue/", "rule": "Based on how many arguments you build right on the first try."},
          {"id": "family", "name": "The Family Group Chat", "url": "games/family/", "rule": "Your reply score for the level, out of 10."},
          {"id": "charts", "name": "The Lying Chart", "url": "games/charts/", "rule": "Your chart score out of 10."},
          {"id": "verify", "name": "News Detective", "url": "games/verify/", "rule": "10 if you call it right using few tools."},
          {"id": "live", "name": "On Air", "url": "games/live/", "rule": "Based on how many fallacies you hid."},
          {"id": "rumor", "name": "Rumor Factory", "url": "games/rumor/", "rule": "Your level score out of 10."},
          {"id": "debate", "name": "Debate Dot", "url": "games/debate/", "rule": "The average strength of your replies in the debate."},
          {"id": "duel", "name": "Challenge a Friend", "url": "games/duel/", "rule": "2 points per correct answer when you accept a challenge."}]
    lead = "A weekly leaderboard for account holders. Pick a nickname, play every day, and earn points. The board resets every Saturday."
    body = f"""<p class="kicker"><a href="{gx}games/">The Arena</a></p><h1>The League</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"games": lg}, ensure_ascii=False)};</script><script src="{gx}assets/config.js?v={VER}"></script><script src="{gx}assets/league.js?v={VER}"></script>"""
    write("games/league/index.html", page(f"The League — {NAME}", body, gx, "games/", lead, path="games/league/"))

    # weekly question
    wk = [{"slug": w["slug"], "title": w["title"], "question": w["question"]} for w in weekly]
    body = f"""<p class="kicker">A philosophical question every week</p><h1>Question of the Week</h1>
<section class="today"><h2 id="w-title">…</h2><blockquote id="w-q"></blockquote><a class="btn" id="w-go" href="#">Vote</a></section>
<h2 id="w-past-h">Past questions</h2><div class="grid" id="w-past"></div>
<script>(function(){{var W={json.dumps(wk, ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,7))/6048e5);if(n<0)n=0;var c=n%W.length;
document.getElementById("w-title").textContent=W[c].title;document.getElementById("w-q").textContent=W[c].question;document.getElementById("w-go").href=W[c].slug+"/";
var past=document.getElementById("w-past");for(var k=Math.min(n,W.length)-1;k>=0;k--){{if(k===c)continue;var a=document.createElement("a");a.className="tile";a.href=W[k].slug+"/";a.innerHTML="<span>Question</span>";var b=document.createElement("b");b.textContent=W[k].title;a.appendChild(b);var s=document.createElement("span");s.textContent=W[k].question;a.appendChild(s);past.appendChild(a);}}
if(!past.children.length){{past.style.display="none";document.getElementById("w-past-h").style.display="none";}}}})();</script>"""
    write("weekly/index.html", page(f"Question of the Week — {NAME}", body, "../", "weekly/", "One big philosophical question every week. Vote and see what everyone else thinks.", path="weekly/"))
    for w in weekly:
        r = "../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in w["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["school"])}</small><div>{e_(v["text"])}</div></div>' for v in w["views"])
        body = f"""<p class="kicker">Question of the Week</p><h1>{e_(w['title'])}</h1>
<div class="sheet" id="dilemma" data-id="week-{w['slug']}"><p class="scene">{e_(w['scene'])}</p><h2 style="margin-top:4px">{e_(w['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>What did philosophers say?</h2>{views}
<p class="note">There's no single right answer. What matters is knowing why you chose yours.</p></div></div>
<p class="report"><a href="{r}send/?err=weekly/{w['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}weekly/">Question of the Week</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"weekly/{w['slug']}/index.html", page(f"{w['title']} — {NAME}", body, r, "weekly/", w["scene"], path=f"weekly/{w['slug']}/"))

    # courses (learning paths)
    LV = [("Beginner", "Start here"), ("Intermediate", "The next step"), ("Advanced", "Once you've got it down")]
    road = ""
    for n, (lv, sub) in enumerate(LV, 1):
        tiles = "".join(f'<a class="tile" href="{p["slug"]}/"><span>{pl(len(p["days"]), "day")} · {lv}</span><b>{e_(p["title"])}</b><span>{e_(p["intro"])}</span></a>' for p in paths if p.get("level", "Beginner") == lv)
        road += f'<section class="road"><h2><span class="road-no">{n}</span> {lv} <small>· {sub}</small></h2><div class="grid">{tiles}</div></section>'
    write("paths/index.html", page(f"Courses — {NAME}", f'<h1>Courses</h1><p class="lead">{len(paths)} short courses: a small lesson, a task and a question every day, just 5 minutes. They go in order from beginner to advanced, and your progress is saved on your device.</p>{road}', "../", "paths/", path="paths/"))
    def dlink(slug, r):
        if slug in by_slug: return f'<a href="{r}atlas/{slug}/">{e_(by_slug[slug]["name"])}</a>'
        return f'<a href="{r}philosophy/{slug}/">{e_(p_slug[slug]["name"])}</a>'
    def dq(d):
        q = d.get("q")
        if not q: return ""
        bs = "".join(f'<button type="button" data-ok="{1 if i == q["a"] else 0}">{e_(o)}</button>' for i, o in enumerate(q["opts"]))
        return f'<div class="dq"><p><b>Quick question:</b> {e_(q["q"])}</p><div class="opts">{bs}</div></div>'
    for p in paths:
        r = "../../"
        days = "".join(f"""<div class="day"><h3><small>Day {k + 1}</small>{dlink(d['entry'], r)}</h3>
<p>{e_(d['lesson'])}</p><p class="task"><b>Today's task:</b> {e_(d['task'])}</p>{dq(d)}<button class="btn ghost mark">Mark this day done</button></div>""" for k, d in enumerate(p["days"]))
        body = f"""<p class="kicker">Course · {pl(len(p['days']), "day")} · {p.get("level", "Beginner")}</p><h1>{e_(p['title'])}</h1><p class="lead">{e_(p['intro'])}</p>
<div id="path" data-id="{p['slug']}" data-title="{e_(p['title'])}"><p class="kicker" id="p-count"></p><div class="bar"><i id="p-bar"></i></div>{days}</div>
<div class="today" id="p-done" style="display:none"><h2>You finished the course!</h2><p>Make your certificate and share it. Your name is drawn on your device only and never sent anywhere.</p>
<label for="cert-name">Your name, the way you want it written</label><input type="text" id="cert-name" maxlength="40" placeholder="Your name">
<p style="margin-top:.8rem"><button class="btn" id="cert-make">Make my certificate</button> <a class="btn ghost" href="{r}quiz/">Test Yourself</a></p><div id="cert-out"></div></div>
<p class="report"><a href="{r}send/?err=paths/{p['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}paths/">All courses</a></p><script src="{r}assets/paths.js?v={VER}"></script>
<script>document.querySelectorAll(".dq .opts button").forEach(function(b){{b.onclick=function(){{b.parentNode.querySelectorAll("button").forEach(function(x){{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("right");}});if(b.dataset.ok!=="1")b.classList.add("wrong");}};}});</script>"""
        write(f"paths/{p['slug']}/index.html", page(f"{p['title']} (Course) — {NAME}", body, r, "paths/", p["intro"], path=f"paths/{p['slug']}/"))

    # philosophy
    def plink(slug, r):
        if slug in by_slug: return f'<a href="{r}atlas/{slug}/">{e_(by_slug[slug]["name"])}</a>'
        if slug in p_slug: return f'<a href="{r}philosophy/{slug}/">{e_(p_slug[slug]["name"])}</a>'
        return ""
    def plist(kind):
        return "".join(f'<li><a href="{x["slug"]}/"><b>{e_(x["name"])}</b><em>{e_(x["era"])}</em><span>{e_(x["oneLine"])}</span></a></li>' for x in philo if x["kind"] == kind)
    body = f"""<p class="kicker">New section</p><h1>Philosophy</h1><p class="lead">The biggest questions people have ever asked, in plain English. For every philosopher and school: the idea, an everyday example, how to use it today, and where it's been criticized.</p>
<div class="grid"><a class="tile" href="problems/"><span>New</span><b>Philosophers on Your Problem</b><span>Anxious, stuck, or feeling wronged? See what 3 schools of thought would tell you.</span></a><a class="tile" href="thought/"><span>New</span><b>Thought Experiments</b><span>{len(thought)} experiments that changed how we think. Think it over and vote.</span></a><a class="tile" href="../tools/"><span>New</span><b>Thinking Tools</b><span>Small rules for thinking clearly.</span></a></div>
{ORN}<h2>Philosophers</h2><ul class="index">{plist("philosopher")}</ul>
{ORN}<h2>Schools and ideas</h2><ul class="index">{plist("school")}</ul>"""
    write("philosophy/index.html", page(f"Philosophy — {NAME}", body, "../", "philosophy/", "The most influential philosophers and schools of thought, explained in plain English with everyday examples.", path="philosophy/"))
    # Thought Experiments
    tiles = "".join(f'<a class="tile" href="{t["slug"]}/"><span>{e_(t["by"])}</span><b>{e_(t["title"])}</b><span>{e_(t["question"])}</span></a>' for t in thought)
    lead = "Experiments you run in your head, no lab required. Each one has a hard question: think it over, vote, and see what philosophers said."
    write("philosophy/thought/index.html", page(f"Thought Experiments — {NAME}", f'<p class="kicker"><a href="../">Philosophy</a></p><h1>Thought Experiments</h1><p class="lead">{lead}</p><div class="grid">{tiles}</div>', "../../", "philosophy/", lead, path="philosophy/thought/"))
    for t in thought:
        r = "../../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in t["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["who"])}</small><div>{e_(v["says"])}</div></div>' for v in t["views"])
        rel = " · ".join(filter(None, (plink(s_, r) for s_ in t.get("related", []))))
        src = "".join(f"<li>{e_(s_)}</li>" for s_ in t.get("sources", []))
        body = f"""<p class="kicker"><a href="../">Thought Experiments</a></p><h1>{e_(t['title'])}</h1><p class="era">{e_(t['by'])}</p>
<div class="sheet" id="dilemma" data-id="thought-{t['slug']}"><p class="scene">{e_(t['story'])}</p><h2 style="margin-top:4px">{e_(t['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>What did philosophers say?</h2>{views}<h2>Why it matters today</h2><p>{e_(t['why'])}</p></div></div>
{f'<p class="related">Read more: {rel}</p>' if rel else ''}<h2>Sources</h2><ul class="sources">{src}</ul>
<p class="report"><a href="{r}send/?err=philosophy/thought/{t['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="../">All thought experiments</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"philosophy/thought/{t['slug']}/index.html", page(f"{t['title']} — {NAME}", body, r, "philosophy/", t["question"] + " " + t["story"], path=f"philosophy/thought/{t['slug']}/"))
    # Philosophers on Your Problem
    chips = "".join(f'<button type="button" class="chip{" on" if i == 0 else ""}" data-i="{i}">{e_(q["title"])}</button>' for i, q in enumerate(problems))
    cards = ""
    for i, q in enumerate(problems):
        ans = "".join(f'<div class="ex"><small>{plink(a["school"], "../../")}</small><div>{e_(a["says"])}</div><p class="task"><b>Try it today:</b> {e_(a["try"])}</p></div>' for a in q["answers"])
        note = f'<p class="note">{e_(q["note"])}</p>' if q.get("note") else ""
        cards += f'<section class="prob" data-i="{i}"{"" if i == 0 else " hidden"}><h2>{e_(q["title"])}</h2><p class="lead">{e_(q["feel"])}</p>{ans}{note}</section>'
    lead = "Pick what you're feeling, and see what 3 schools of philosophy would tell you, plus one small thing to try today."
    body = f'''<p class="kicker"><a href="../">Philosophy</a></p><h1>Philosophers on Your Problem</h1><p class="lead">{lead}</p><div class="chips">{chips}</div>{cards}
<p class="note">This is philosophy to help you see things from other angles. It isn't therapy or professional advice.</p>
<script>document.querySelectorAll(".chips .chip").forEach(function(b){{b.onclick=function(){{document.querySelectorAll(".chips .chip").forEach(function(x){{x.classList.toggle("on",x===b)}});document.querySelectorAll(".prob").forEach(function(g){{g.hidden=g.dataset.i!==b.dataset.i}})}}}});</script>'''
    write("philosophy/problems/index.html", page(f"Philosophers on Your Problem — {NAME}", body, "../../", "philosophy/", lead, path="philosophy/problems/"))

    for x in philo:
        r = "../../"
        rel = " · ".join(filter(None, (plink(s_, r) for s_ in x.get("related", []))))
        src = "".join(f"<li>{e_(s_)}</li>" for s_ in x.get("sources", []))
        body = f"""<p class="kicker">{KIND[x['kind']]}</p><h1>{e_(x['name'])}</h1>{intl(x)}<p class="era">{e_(x['era'])}</p>
<p class="oneline">{e_(x['oneLine'])}</p>
<h2>The idea</h2><p>{e_(x['idea'])}</p>
<h2>In real life</h2><div class="ex"><div>{e_(x['life'])}</div></div>
<h2>Use it today</h2><p>{e_(x['useIt'])}</p>
<h2>The criticism</h2><p>{e_(x['critique'])}</p>
{f'<h2>Read more</h2><p>{rel}</p>' if rel else ''}
<h2>Sources</h2><ul class="sources">{src}</ul>
<h2>Share it</h2><p><a class="btn ghost" href="{r}cards/post/{x['slug']}.png" download>Download the post card</a> <a class="btn ghost" href="{r}cards/og/{x['slug']}.png" download>Wide card</a></p>
<p class="report"><a href="{r}send/?err=philosophy/{x['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}philosophy/">All philosophers and schools</a></p>"""
        ld = {"@context": "https://schema.org", "@type": "Person" if x["kind"] == "philosopher" else "DefinedTerm", "name": x["name"], "alternateName": x["intl"],
              "description": x["oneLine"], "url": f"{SITE}philosophy/{x['slug']}/"}
        write(f"philosophy/{x['slug']}/index.html", page(f"{x['name']} — {NAME}", body, r, "philosophy/", x["oneLine"], f"cards/og/{x['slug']}.png", f"philosophy/{x['slug']}/", ld))

    # Weighing the Hype
    tiles = "".join(f'<a class="tile" href="{t["slug"]}/"><span>Weighing the Hype</span><b>{e_(t["title"])}</b><span>{e_(t["verdict"])}</span></a>' for t in trends)
    write("trends/index.html", page(f"Weighing the Hype — {NAME}", f'<h1>Weighing the Hype</h1><p class="lead">Claims you hear all the time, online and at the dinner table. We weigh the argument itself: what holds up, and what doesn\'t. No attacking anyone.</p><div class="grid">{tiles}</div><p class="note">Heard a viral claim you want weighed? <a href="../send/">Send it to us</a>.</p>', "../", "trends/", path="trends/"))
    for t in trends:
        r = "../../"
        an = "".join(f'<div class="ex"><small>{plink(a["entry"], r)}</small><div>{e_(a["text"])}</div></div>' for a in t["analysis"])
        body = f"""<p class="kicker">Weighing the Hype</p><h1>{e_(t['title'])}</h1>
<p class="claim">{e_(t['claim'])}</p>
<h2>What's fair about it</h2><p>{e_(t['fair'])}</p>
<h2>Where it goes wrong</h2>{an}
<h2>The verdict</h2><p class="verdict">{e_(t['verdict'])}</p>
<p class="report"><a href="{r}send/?err=trends/{t['slug']}/">Spot a mistake on this page? Tell us</a></p>
<p class="back"><a href="{r}trends/">All claims</a></p>"""
        write(f"trends/{t['slug']}/index.html", page(f"{t['title']} — {NAME}", body, r, "trends/", t["verdict"], path=f"trends/{t['slug']}/"))

    # search
    idx = [{"t": x["name"], "k": KIND[x["kind"]], "d": x["oneLine"], "u": f"atlas/{x['slug']}/", "x": " ".join([x["intl"], x["detect"], x["respond"]] + [ex["text"] for ex in x["examples"]])} for x in entries]
    idx += [{"t": x["name"], "k": KIND[x["kind"]], "d": x["oneLine"], "u": f"philosophy/{x['slug']}/", "x": " ".join([x["intl"], x["era"], x["idea"], x["life"]])} for x in philo]
    idx += [{"t": x["title"], "k": "Course", "d": x["intro"], "u": f"paths/{x['slug']}/", "x": " ".join(d["lesson"] for d in x["days"])} for x in paths]
    idx += [{"t": x["title"], "k": "Dilemma", "d": x["question"], "u": f"dilemmas/{x['slug']}/", "x": x["scene"]} for x in dilemmas]
    idx += [{"t": x["title"], "k": "Question of the Week", "d": x["question"], "u": f"weekly/{x['slug']}/", "x": x["scene"]} for x in weekly]
    idx += [{"t": x["title"], "k": "Weighing the Hype", "d": x["verdict"], "u": f"trends/{x['slug']}/", "x": x["claim"]} for x in trends]
    idx += [{"t": t, "k": "Game", "d": d, "u": h, "x": n} for n, _, gs in ARENA for h, t, d, _, _ in gs if h.startswith(("games/", "quiz/", "daily/"))]
    (OUT / "search.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    body = f"""<h1>Search</h1><p class="lead">Search {len(idx)} pages: fallacies, biases, philosophers, courses and dilemmas.</p>
<form class="search" role="search" onsubmit="return false"><input id="s-q" type="search" placeholder="Try: straw man, Kant, ads" aria-label="Search terms" autocomplete="off"></form>
<div id="s-out" aria-live="polite"></div><script src="../assets/search.js?v={VER}"></script>"""
    write("search/index.html", page(f"Search — {NAME}", body, "../", "search/", path="search/"))

    # Send a Fallacy
    body = f"""<h1>Send a Fallacy</h1><p class="lead">Heard a line in an ad, a post, or at dinner that felt off? Send it to us. The best ones become puzzles in Fallacy of the Day or a claim we weigh.</p>
<form id="send-form" class="sheet"><label for="send-text">The line</label><textarea id="send-text" rows="4" maxlength="600" required placeholder="Write it the way it was said"></textarea>
<label for="send-where">Where did you hear it? (optional)</label><input type="text" id="send-where" maxlength="60" placeholder="An ad, Facebook, at work…">
<label for="send-guess">Which fallacy do you think it is? (optional)</label><input type="text" id="send-guess" maxlength="80" placeholder="No need to know">
<input type="text" id="send-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<p style="margin-top:1rem"><button class="btn" type="submit">Send</button> <span id="send-status" class="lead" style="font-size:15px" aria-live="polite"></span></p></form>
<p class="note">Please don't include real people's names or phone numbers. Every submission is read by a human before anything is published.</p>
<script src="../assets/config.js?v={VER}"></script><script src="../assets/send.js?v={VER}"></script>"""
    write("send/index.html", page(f"Send a Fallacy — {NAME}", body, "../", "", "Send us a line you heard that has a fallacy in it. It might become a Blind Spot Lab puzzle.", path="send/"))

    # offline
    (OUT / "offline.html").write_text(page(f"You're offline — {NAME}", '<section class="hero">' + SCALE + '<h1 style="font-size:2.4rem">You\'re offline</h1><p class="lead">Pages you opened before still work. Come back when you\'re connected again.</p><p><a class="btn" href="./">Home</a></p></section>', "./"), encoding="utf-8")

    # account
    body = f"""<h1>My Account</h1><p class="lead">An account is optional. It saves your progress across devices and gives you more analyses in Analyze It. No password needed.</p>
<p class="lead small" id="ac-status" aria-live="polite"></p>
<section class="sheet" id="ac-login" hidden><h2 style="margin-top:0">Sign in</h2>
<p><button class="btn gbtn" id="ac-google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Sign in with Google</button></p>
<div class="orn" aria-hidden="true"><span></span></div>
<form id="ac-mail-form"><label for="ac-mail">Or sign in with email: we'll send you a link, tap it and you're in</label>
<div class="row"><input type="email" id="ac-mail" required autocomplete="email" placeholder="name@example.com" dir="ltr"><button class="btn ghost" type="submit">Send the link</button></div></form>
<p class="note">By signing in, you agree to our <a href="../privacy/">privacy policy</a>.</p></section>
<section class="sheet" id="ac-need-email" hidden><form id="ac-need-form"><label for="ac-need-mail">Email</label><div class="row"><input type="email" id="ac-need-mail" required dir="ltr"><button class="btn" type="submit">Sign in</button></div></form></section>
<section id="ac-me" hidden>
<div class="sheet"><p class="kicker" id="ac-email" dir="ltr" style="text-align:start"></p>
<label for="ac-name">Your name (shown on certificates)</label><div class="row"><input type="text" id="ac-name" maxlength="60"><button class="btn ghost" id="ac-save">Save</button></div>
<div class="stats" style="justify-content:flex-start"><div><b id="ac-plan">Free</b>Your plan</div><div><b id="ac-quota">…</b>Analyses left today</div></div></div>
<h2>Your progress</h2><div class="stats wrapstats" id="ac-stats"></div>
<div class="today"><h2>Blind Spot Lab Plus (coming soon)</h2><p>More analyses every day, longer texts, and your analyses saved. We're still building it.</p></div>
<p style="margin-top:2rem"><button class="btn ghost" id="ac-out">Sign out</button> <button class="btn ghost danger" id="ac-del">Delete my account</button></p>
<div class="note" id="ac-del-confirm" hidden><p>Are you sure? Your account, all your saved progress, and your League points will be deleted for good. This can't be undone.</p><p><button class="btn danger-fill" id="ac-del-yes">Yes, delete it</button> <button class="btn ghost" id="ac-del-no">No</button></p></div>
</section>
<script defer src="../assets/acct-page.js?v={VER}"></script>"""
    write("account/index.html", page(f"My Account — {NAME}", body, "../", "", "Sign in free with Google or email and keep your Blind Spot Lab progress on any device: your streak, game results, courses and certificates.", path="account/"))

    # For Teachers: ready-made lessons and printable worksheets
    T = json.loads((ROOT / "content" / "teachers.json").read_text(encoding="utf-8"))
    nm = {x["slug"]: x["name"] for x in entries}
    les = ""
    for i, L in enumerate(T["lessons"], 1):
        play = " ".join(f'<a class="btn ghost" href="../{h}">{t}</a>' for h, t in L["play"])
        ents = ", ".join(f'<a href="../atlas/{e}/">{nm.get(e, e)}</a>' for e in L["entries"])
        disc = "".join(f"<li>{q}</li>" for q in L["discuss"])
        sheet = "".join(f'<li><p>{q}</p><div class="lines"></div></li>' for q in L["sheet"])
        les += f'''<article class="lesson" id="l{i}"><p class="kicker">Lesson {i} · 45 minutes</p><h2>{L["title"]}</h2>
<p><b>Goal:</b> {L["goal"]}</p>
<h3>1. Warm-up (5 minutes)</h3><p>{L["warm"]}</p>
<h3>2. Play (20 minutes)</h3><p>{play}</p>
<h3>3. Discuss (10 minutes)</h3><ul>{disc}</ul>
<h3>4. Worksheet (10 minutes)</h3><p class="sub">For the teacher: before class, read these Atlas entries: {ents}.</p>
<div class="worksheet"><p class="ws-head">Blind Spot Lab · Worksheet · {L["title"]} <span>Name: ................................</span></p><ol>{sheet}</ol></div>
<p><button class="btn ghost print-l" type="button" data-l="l{i}">🖨 Print this lesson</button></p></article>'''
    how = "".join(f"<li>{x}</li>" for x in T["how"])
    toc = "".join(f'<li><a href="#l{i}">{L["title"]}</a></li>' for i, L in enumerate(T["lessons"], 1))
    lead = T["intro"]
    body = f'''<p class="kicker">For teachers and parents</p><h1>Blind Spot Lab in the Classroom</h1><p class="lead">{lead}</p>
<section class="today"><h2>How to use it</h2><ul>{how}</ul><p class="note">The lessons are free. If your school would like a workshop or a version tailored to its curriculum, <a href="../send/?err=teachers/">get in touch</a>.</p></section>
<h2>The lessons</h2><ol class="index">{toc}</ol>{les}
<script>document.querySelectorAll(".print-l").forEach(function(b){{b.onclick=function(){{document.body.setAttribute("data-print",b.dataset.l);window.print();}};}});window.addEventListener("afterprint",function(){{document.body.removeAttribute("data-print");}});</script>'''
    write("teachers/index.html", page(f"For Teachers — {NAME}", body, "../", "", "6 ready-to-teach critical thinking lessons, 45 minutes each, with interactive games and printable worksheets.", path="teachers/"))

    # Stats board: not in the menu or the sitemap, and closed to search engines
    body = f"""<h1>Stats board</h1><p class="lead">Anonymous, aggregated numbers: who plays what, whether they finish, and where they stop. This page isn't linked anywhere on the site.</p><div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"names": gn}, ensure_ascii=False)};</script><script src="../assets/config.js?v={VER}"></script><script src="../assets/ops.js?v={VER}"></script>"""
    html = page(f"Stats board — {NAME}", body, "../", "", "Internal board.").replace("<head>", '<head><meta name="robots" content="noindex,nofollow">', 1)
    (OUT / "ops").mkdir(parents=True, exist_ok=True); (OUT / "ops" / "index.html").write_text(html, encoding="utf-8")

    # privacy
    body = """<h1>Privacy</h1><p class="lead">Blind Spot Lab doesn't ask for your name, your email, or an account. Here is exactly what data the site handles.</p>
<h2>What stays on your device only</h2><p>Your puzzle results, streak, course progress, best quiz scores, and your votes. These are saved in your browser (localStorage) and never sent to anyone. If you clear your browser data, they're gone.</p>
<h2>Certificates</h2><p>The name on your course certificate is drawn on your device and never sent to any server.</p>
<h2>What gets sent to the Blind Spot Lab server</h2>
<ul><li><b>Votes and Bias Lab results:</b> we record your choice without your name. To keep it to one vote per person, we turn your IP address into a scrambled code (a hash) that can't be turned back into the original address, and delete it after a year.</li>
<li><b>Analyze It:</b> the text you enter is sent to Claude, a service from Anthropic, to be analyzed. We keep the result for 30 days so the same text doesn't get analyzed twice. Please don't include names, phone numbers, or any personal details.</li>
<li><b>Send a Fallacy and error reports:</b> what you send is kept for up to 120 days so a human can review it. We don't record who sent it.</li></ul>
<h2>If you make an account (optional)</h2><p>Accounts aren't required, and the whole site works without one. If you sign in with Google or email, we save your email, the name you choose, and your progress (puzzle, course and quiz results) so it follows you to any device. Sign-in is handled by Google's Firebase, and the data is stored on Cloudflare. We never store passwords. You can delete your account and all its data from <a href="../account/">My Account</a> at any time, and it's deleted right away.</p>
<h2>The League (optional)</h2><p>If you join the League, we save the nickname you choose and your daily points in each game. Only your nickname is shown on the leaderboard; your real name and email are never shown. You can leave the League from its page, and your points and nickname are deleted right away.</p>
<h2>Free debate with Dot (account holders)</h2><p>The replies you type in the free debate are sent to Claude, a service from Anthropic, so Dot can answer you. The debate is kept on the server for 6 hours so you can finish it, then deleted. It's never published.</p>
<h2>Challenge a Friend</h2><p>Your score and the name you pick are stored inside the link itself, not on any server. Anyone with the link can see them.</p>
<h2>Game counter</h2><p>When you start or finish a game, we add one to that game's counter for that day. Nothing about you is sent with it: no name, no device, no address. It helps us see which games people enjoy so we can improve them.</p>
<h2>Visit counter</h2><p>If we turn on visit counting, we use Cloudflare Web Analytics to see how many visits we get and which pages people like. It doesn't use cookies and doesn't follow you from site to site.</p>
<h2>What we don't do</h2><p>We don't sell data, we don't show ads, and we don't use tracking cookies.</p>
<h2>Want something deleted?</h2><p>You can clear the data on your device from your browser settings. If you sent us a line and want it deleted, <a href="../send/">send us</a> its text and we'll delete it.</p>
<p class="note">This page was last updated in November 2026.</p>"""
    write("privacy/index.html", page(f"Privacy — {NAME}", body, "../", "", "How Blind Spot Lab handles your data: no ads, no personal tracking, what we save if you make an account, and how to delete your account and data anytime.", path="privacy/"))

    # about
    body = """<h1>About Blind Spot Lab</h1>
<p>Blind Spot Lab is the free companion site of the Blind Spot Lab YouTube channel, about how the mind fools us. It's an open guide to thinking clearly: logic, cognitive biases, decision psychology, and the big questions of philosophy, explained in plain English with everyday examples.</p>
<p>Watched a video and want to go deeper? Every fallacy and bias has its own page here, with examples, a way to spot it, and a calm way to respond. And the games let you practice on yourself.</p>
<h2>How it's made</h2><p>The content is written by a human working with AI, then edited by hand. We keep improving it, and if you spot a mistake, every page has a link to tell us.</p>
<h2>Honesty about evidence</h2><p>We list sources for every entry and say how strong the evidence is behind each bias. When the evidence is weak or disputed, we say so plainly.</p>
<p class="note">Blind Spot Lab is practice for your thinking. It isn't a psychological diagnosis or professional advice.</p>"""
    write("about/index.html", page(f"About — {NAME}", body, "../", "about/"))
    # 404 page (GitHub Pages serves it for any bad link under /blindspotlab/), so every link is absolute
    r404 = "/" + SITE.split("/", 3)[3]
    nf = f'''<section class="today" style="text-align:center"><p class="kicker">404</p><h1>This page doesn't exist</h1>
<p class="lead">Maybe the link has a typo, or the page moved. No worries, there's plenty more worth seeing.</p>
<p><a class="btn" href="{r404}">Home</a> <a class="btn ghost" href="{r404}daily/">Fallacy of the Day</a> <a class="btn ghost" href="{r404}search/">Search</a></p></section>'''
    html404 = page(f"Page not found — {NAME}", nf, r404, "", "This page doesn't exist on Blind Spot Lab.")
    (OUT / "404.html").write_text(html404.replace("<head>", '<head><meta name="robots" content="noindex">', 1), encoding="utf-8")

    write("manifest.webmanifest", json.dumps({"name": NAME, "short_name": NAME, "lang": "en", "dir": "ltr",
        "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#E9E1CC", "theme_color": "#A47E2E",
        "description": "A free guide to fallacies, biases and philosophy: how the mind fools us.",
        "icons": [{"src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
    # sitemap + robots
    sm = "".join(f"<url><loc>{SITE}{u}</loc></url>" for u in URLS)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>', encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
    # service worker
    pre = ["./", "offline.html", "daily/", "atlas/", "philosophy/", "quiz/", "search/", "search.json", "manifest.webmanifest"] + [f"assets/{f}?v={VER}" for f in ["style.css", "app.js", "motion.js", "daily.js", "quiz.js", "search.js"]]
    sw = (ROOT / "tools/sw.template.js").read_text(encoding="utf-8").replace("__VER__", VER).replace("__PRE__", json.dumps(pre))
    # same origin as Mizan: the cache prefix must differ, or each site's worker deletes the other's caches
    sw = sw.replace('"mizan-', '"bsl-')
    if sw.startswith("//"):
        sw = "// Blind Spot Lab: works offline. HTML comes from the network first, static files from the cache.\n" + sw.split("\n", 1)[1]
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    print("built", len(entries), "entries,", len(philo), "philosophy,", len(URLS), "pages")


if __name__ == "__main__":
    build()
