# Blind Spot Lab — content brief (read fully before writing)

Blind Spot Lab is the English sister site of «ميزان» (Mizan), an Arabic critical-thinking site.
It is the companion website of the YouTube channel "Blind Spot Lab" for a US audience:
"how the mind fools us" — fallacies, cognitive biases, decision psychology, philosophy.

## Your job
Rewrite (not translate) a Mizan content file into natural American English for US adults.
Source files: /home/claude/mizan/content/<name>.json (Egyptian Arabic).
Output: write valid JSON to the path you are given. Keep the EXACT same JSON structure:
same keys, same nesting, same array lengths, same ids/slugs/keys, same numeric values,
same answer indexes (e.g. "a": 2 must still point at the correct option), same internal
links/paths and slug references (e.g. "straw-man", "atlas/..." links). Only the human-readable
text changes. Do not add or drop items. If a field is `reviewed`, set it to false.

## Voice
- Calm, intelligent, curious, honest. Warm, a little witty, never snarky or preachy.
- Plain American English, short sentences, second person ("you") is fine.
- US spelling, US units ($, miles, °F), US places and everyday life.

## Examples must be American and everyday
Replace Egyptian scenes with US ones that teach the SAME point:
family group chat, Thanksgiving dinner, the office Slack, HOA emails, Reddit threads,
TikTok/Instagram, Amazon reviews, used-car lots, gym bros, crypto hype, wellness influencers,
fantasy football, college applications, Black Friday sales, apartment hunting, tipping screens,
streaming subscriptions, credit cards, 401(k), car insurance, fast food, sports talk radio.
Egyptian money (جنيه) → dollars at sensible US amounts.

## Hard rules
- NO partisan politics, parties, elections, named politicians, abortion, guns, immigration,
  or religion/religious figures. Keep it universal and everyday.
- No real named private people; no real brands accused of wrongdoing (use made-up brand names).
- Health/money/legal items: add or keep "not medical/financial/legal advice" style caution where the
  source had it; never give advice that reads like a prescription.
- Facts, studies, dates, names of philosophers and researchers must be accurate. Keep sources
  that exist in the source file; render citations in English (author, year, title). Do not invent
  studies, quotes or statistics. If unsure, phrase generally instead of fabricating.
- Bias "strength" labels (strong / moderate / disputed) must stay as in the source meaning.
- Keep any HTML tags/markdown present in strings intact.

## Before finishing
Validate with: python3 -c "import json;json.load(open('<your output>'))"
Then compare structure to the source (same keys/lengths). Report: file written, item count,
and anything you were unsure about (one short list). Do not edit any other file.
