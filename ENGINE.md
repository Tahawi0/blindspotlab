# Blind Spot Lab — engine conversion brief

/home/claude/blindspotlab is a fork of the Arabic site «ميزان» (Mizan, /home/claude/mizan).
It becomes "Blind Spot Lab", an English (US) site, the companion of the YouTube channel
"Blind Spot Lab": how the mind fools us. Tagline: "See what your mind misses."
Content JSON in /home/claude/blindspotlab/content/ is ALREADY in English. Do not edit content/.
Read content/BRIEF.md for the voice: calm, intelligent, curious, honest, a little witty, US English.

## What to convert in code
- Every Arabic user-facing string → natural, short American English UI copy (not literal translation).
  Comments may become English too.
- RTL → LTR: dir="ltr", lang="en"; flip arrows (← →), "right"/"left" assumptions, text-anchor,
  insertion order that assumed RTL. Number formatting: use 'en-US', no Arabic-Indic digits.
- Branding: «ميزان»/Mizan → "Blind Spot Lab". Mascot «زِنة»/Zina → "Dot" (a curious little lab
  assistant). Keep image paths as they are for now (assets/zina/... files will be replaced later).
- localStorage/sessionStorage keys: the site shares an origin with Mizan (tahawi0.github.io), so
  EVERY key that starts with "mizan" or "mz-" must be renamed to start with "bsl-" (e.g. "mizan-live-stages"
  → "bsl-live-stages", "mz-t-" → "bsl-t-"). Keep JS global names (window.Mizan*, MIZAN_*) unchanged.
- Plurals: English needs "1 point / 2 points" etc. Handle singular/plural where a count is shown.
- Keep all logic, ids, slugs, URL paths, CSS class names and data attributes unchanged.

## Fixed English names (use exactly)
Fallacy of the Day (daily/) · Test Yourself (quiz/) · The Arena = all games page (games/) ·
Fallacy Court (games/court) · The Family Group Chat (games/family) · Escape Room (games/escape) ·
Build the Argument (games/argue) · Spot the Trick (games/spot) · The Bias Lab (games/lab) ·
Which Philosopher Are You? (games/philosopher) · Your Thinking Profile (games/profile) ·
Confidence Check (games/calibration) · Fix the Argument (games/fix) · The Lying Chart (games/charts) ·
News Detective (games/verify) · Rumor Factory (games/rumor) · On Air (games/live) ·
Debate Dot (games/debate) · The Probability Tree (games/bayes) · Challenge a Friend (games/duel) ·
The League (games/league) · The Crowd Mirror (games/mirror) · Your Skill Tree (games/skills) ·
The Atlas (atlas/) · The Fallacy Sky (atlas/sky) · Browse by Situation (atlas/situations) ·
Thinking Tools (tools/) · Philosophy (philosophy/) · Thought Experiments (philosophy/thought) ·
Philosophers on Your Problem (philosophy/problems) · Courses (paths/) · Dilemmas (dilemmas/) ·
Question of the Week (weekly/) · Weighing the Hype (trends/) · Analyze It (analyze/) ·
Send a Fallacy (send/) · For Teachers (teachers/) · My Account (account/) · About (about/) ·
Privacy (privacy/) · Search (search/).
Evidence labels: Strong / Moderate / Disputed. Kinds: Fallacy / Bias / Thinking Tool.
Path levels: Beginner / Intermediate / Advanced. Stars: "★ 7 of 30". Score: "7 / 10".

## Done means
- `grep -P "[\x{0600}-\x{06FF}]"` style check finds no Arabic left in your files
  (python: re.search(r'[؀-ۿ]', text)).
- JS files pass `node --check`. build.py runs: `cd /home/claude/blindspotlab && python3 build.py`
  (only the build.py owner runs it).
- Report briefly: files done, anything uncertain. Edit ONLY the files assigned to you.
