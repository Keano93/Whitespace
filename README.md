# Headstart V2 — Whitespace

Headstart closes the gap between product innovation and white space in a sales rep's accounts.

1. **Find** — Mimir matches new features, and products an account doesn't own yet, to problems customers have already raised (calls, CS notes, lost deals, account plans).
2. **Explain** — each opportunity is shown in plain English: their problem, what we can offer now, who to talk to.
3. **Prepare** — a short brief and 5-question check, recommended only when the rep needs it. Built on the customer's approved enablement, never invented.
4. **Do** — Mimir drafts the email, suggests meeting times, sets up the Salesforce opportunity and plans the first call. The rep reviews and approves everything.

## Screens

- **Opportunities** — the rep's home: one card per opportunity.
- **Opportunity** — context, an optional brief, and Mimir's groundwork.
- **White space** — every account against every product: has it, open, or an opportunity.
- **Team view** — for managers: pipeline by rep and by new feature, upside still to come, and needs Product can't meet yet (sample data).

Mimir sits on every page and knows what you're looking at.

## Run it

**Replit:** import this repo, add `ANTHROPIC_API_KEY` in the Secrets tab, press Run.

**Locally:**

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key
python app.py   # http://localhost:8080
```

Set `HEADSTART_MODEL` to change the Claude model (default `claude-sonnet-5-5`).

## Code

- `app.py` — Flask server and Mimir's prompts. The JSON endpoints (`/api/opportunities`, `/api/brief`, `/api/groundwork`, `/api/chat`) can feed Slack or a CRM later.
- `data.py` — fictional sample data (Northstar Software). Swap in a real customer's data here.
- `static/` — the front end (plain HTML, CSS and JS, no build step).

## Not built yet

Calendar sync (meeting times download as .ics holds), creating Salesforce records directly (copy for now), sending email (opens in your mail app), and real team tracking.
