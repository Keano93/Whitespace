"""
Headstart V2 - Whitespace
Bridges product innovation and white space in a rep's book of business.

  1. Find   - Mimir matches new features (and products an account doesn't own)
              to problems customers have already raised.
  2. Explain - each opportunity is shown in plain English with its context.
  3. Prepare - a short brief and quiz, recommended only when the rep needs it.
  4. Do      - Mimir drafts the email, the Salesforce opportunity and the call
              plan; the rep reviews and approves.

Pages: Opportunities, Opportunity, White space, Team view. Mimir sits on every page.
All sample data is fictional (see data.py).

Run on Replit: add ANTHROPIC_API_KEY in the Secrets tab, then press Run.
Run locally:   pip install -r requirements.txt && python app.py
"""

import datetime
import json
import os

from anthropic import Anthropic
from flask import Flask, jsonify, request, send_from_directory

from data import DATA, TEAM

MODEL = os.environ.get("HEADSTART_MODEL", "claude-sonnet-5-5")
PASS_MARK = 80  # brief quiz pass mark in percent - adjustable per customer
TODAY = datetime.date.today().isoformat()


def product_names():
    return [p["name"] for p in DATA["products"]]


def whitespace():
    """Owned vs not-owned products per account, from contracts (no AI)."""
    rows = []
    for acct in DATA["book_of_business"]:
        owned = {}
        for name in product_names():
            match = next((c for c in acct["current_contracts"] if name in c), None)
            if match:
                owned[name] = match.replace(name, "").strip(" ()")
        rows.append({"account": acct["account"], "owned": owned})
    return rows


SYSTEM_PROMPT = f"""You are Mimir, the AI sales assistant inside Headstart.
You work alongside {DATA['rep']['name']}, a seller at {DATA['seller_company']}. Today is {TODAY}.
Your job: find where something new at {DATA['seller_company']} (a new feature, or a product the
account doesn't own yet) meets a problem a customer has already raised, explain it simply,
get the rep ready, and do the groundwork so they can act fast.

Answer ONLY from the company data below. Rules:
- Write in plain English for a busy sales rep. Short sentences. No jargon: never say
  "white space", "capability", "release match" or "launch".
- Lead with the answer, then at most 3 bullets.
- Say where key facts come from (e.g. "from the Sep QBR notes", "pricing guardrails").
- If the data doesn't cover something, say so and suggest who to ask.
- Never invent contracts, people, prices, features or deal history.
- If the rep asks you to role-play a customer, stay in character, push back realistically
  using what the data says about that person, and step out only when the rep says "stop".

COMPANY DATA:
{json.dumps(DATA, indent=2)}
"""

OPPS_REQUEST = """Find the best opportunities in the rep's accounts, using ONLY the company data.

Three kinds:
- "new_feature": something in release_notes now solves a problem or removes a blocker the
  customer raised (see pain_points, history, notes). Rank these highest.
- "not_owned": a product the account doesn't own fits a problem they raised.
- "expansion": a reason to grow a product they already own.

What each account owns today:
__WS__

Write for a busy sales rep in plain English. Short, concrete sentences. No jargon: never use
"white space", "capability", "release match", "launch" or "leverage".
Max 6 opportunities, best first, one per account + product. Skip weak fits rather than pad.

Recommend a brief (brief_recommended: true) when the rep needs new facts to be credible:
a feature released in the last 90 days, or pricing or security details they must get right.
Otherwise false. The rep is a new joiner.

Return ONLY valid JSON, no prose, in exactly this shape:
{"summary": "one sentence: which opportunity to start with and why",
 "opportunities": [{
   "account": "company",
   "product": "exact product name",
   "type": "new_feature",
   "headline": "two short sentences, max 16 words in total: their problem, then what we can now do. e.g. 'Harbourline runs two help centres. Assist can now cover both.'",
   "problem": "their problem in one plain sentence",
   "source": "where they raised it, short, e.g. 'QBR, Sep 2026' or 'Gong call, Oct 2024'",
   "offer": "what we can offer now, one plain sentence that names the feature or product",
   "release_id": "id from release_notes, or empty string",
   "contact": "name (job title)",
   "value": "from list prices, e.g. '€30k+ a year'",
   "why_now": "one sentence",
   "brief_recommended": true,
   "brief_reason": "one short sentence",
   "first_step": "what Mimir will write, e.g. 'an email to Aoife Byrne (COO)'"
 }]}
type is one of "new_feature", "not_owned", "expansion".
"""

BRIEF_REQUEST = """The rep is about to work this opportunity:
__OPP__

Write a short brief so they can talk about it with confidence, using ONLY the company data.
Use the company's approved training as written (methodology, plays, pricing guardrails,
objection handling) and apply it to this account. Do not invent new messaging.
Plain English, no jargon.

Return ONLY valid JSON, no prose, in exactly this shape:
{"brief": "plain text using **bold** and '- ' bullets only, with these parts: **What's new**, **Why it matters to them**, **What to say** (3 bullets), **What they might push back on** (with the approved answer), **Rules to remember** (the pricing or qualification rule that applies)",
 "quiz": [{"q": "question", "options": ["a", "b", "c", "d"], "answer": 0, "why": "one sentence"}]}
Exactly 5 quiz questions with 4 options each. "answer" is the index (0-3) of the correct
option; vary its position. Test facts the rep must get right in front of this customer:
the feature, prices, account history and rules. Keep the brief readable in 3 minutes.
"""

GROUNDWORK_REQUEST = """The rep is working this opportunity:
__OPP__

Do the groundwork for them, using ONLY the company data. The rep will review and approve
everything before anything is sent or created.

Return ONLY valid JSON, no prose, in exactly this shape:
{"email": {"to": "name and job title", "subject": "short subject line",
           "body": "the email, under 110 words, plain and warm, signed off as __REP__"},
 "crm": {"opportunity_name": "Account - Product - short description", "account": "company",
         "product": "product name", "amount": "number in EUR from list prices, e.g. 30000",
         "stage": "Discovery", "next_step": "one short sentence"},
 "questions": ["3 questions to ask on the first call, each one sentence"],
 "heads_up": "one sentence on the biggest risk in this deal and the approved way to handle it"}

The email must mention the customer's problem and roughly when they raised it, explain in
one sentence what is now possible, and end with a clear ask for a 20-minute call. Never
invent facts, numbers or people. Respect the pricing guardrails.
"""

# ---------------------------------------------------------------------------
# APP
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder="static")
client = Anthropic() if os.environ.get("ANTHROPIC_API_KEY") else None
NO_KEY = "No API key found. Add ANTHROPIC_API_KEY in Replit Secrets (or your environment), then restart."
_cache = {}


def ask_claude(messages, max_tokens=1024, extra_system=""):
    resp = client.messages.create(
        model=MODEL, max_tokens=max_tokens, system=SYSTEM_PROMPT + extra_system, messages=messages
    )
    return "".join(b.text for b in resp.content if b.type == "text")


def ask_json(prompt, max_tokens=3000):
    text = ask_claude([{"role": "user", "content": prompt}], max_tokens=max_tokens)
    return json.loads(text[text.index("{"): text.rindex("}") + 1])


def opp_key(opp):
    return "{}|{}".format(opp.get("account"), opp.get("product"))


@app.get("/")
def index():
    return send_from_directory("static", "index.html")


@app.get("/api/bootstrap")
def bootstrap():
    """Everything the page needs that doesn't come from the AI."""
    return jsonify(
        rep=DATA["rep"],
        company=DATA["seller_company"],
        products=product_names(),
        accounts=DATA["book_of_business"],
        releases=DATA["release_notes"],
        whitespace=whitespace(),
        team=TEAM,
        pass_mark=PASS_MARK,
        has_key=client is not None,
    )


@app.get("/api/opportunities")
def opportunities():
    """Plain JSON, so the same endpoint can feed Slack or a CRM later."""
    if client is None:
        return jsonify(error=NO_KEY)
    if "opps" in _cache and request.args.get("fresh") != "1":
        return jsonify(_cache["opps"])
    try:
        prompt = OPPS_REQUEST.replace("__WS__", json.dumps(whitespace(), indent=2))
        _cache["opps"] = ask_json(prompt)
        return jsonify(_cache["opps"])
    except Exception as e:
        return jsonify(error=f"Couldn't find opportunities: {e}")


def _opp_endpoint(kind, template, max_tokens):
    if client is None:
        return jsonify(error=NO_KEY)
    opp = (request.get_json(force=True) or {}).get("opportunity") or {}
    if not opp.get("account"):
        return jsonify(error="No opportunity given.")
    key = kind + ":" + opp_key(opp)
    if key in _cache and request.args.get("fresh") != "1":
        return jsonify(_cache[key])
    try:
        prompt = (template.replace("__OPP__", json.dumps(opp, indent=2)[:3000])
                          .replace("__REP__", DATA["rep"]["name"]))
        _cache[key] = ask_json(prompt, max_tokens=max_tokens)
        return jsonify(_cache[key])
    except Exception as e:
        return jsonify(error=f"Mimir couldn't finish that: {e}")


@app.post("/api/brief")
def brief():
    return _opp_endpoint("brief", BRIEF_REQUEST, 2500)


@app.post("/api/groundwork")
def groundwork():
    return _opp_endpoint("groundwork", GROUNDWORK_REQUEST, 2000)


@app.post("/api/chat")
def chat():
    if client is None:
        return jsonify(reply=NO_KEY)
    body = request.get_json(force=True) or {}
    messages = body.get("messages", [])[-20:]
    context = str(body.get("context", ""))[:2000]
    extra = f"\n\nTHE REP IS CURRENTLY LOOKING AT:\n{context}\n" if context else ""
    try:
        return jsonify(reply=ask_claude(messages, extra_system=extra))
    except Exception as e:  # shown in the UI so it's easy to debug
        return jsonify(reply=f"Error calling Claude: {e}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
