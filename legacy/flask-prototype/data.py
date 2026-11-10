"""Sample data for the Whitespace V2 demo. All of it is fictional.

Swap this for a real customer's data later: products and release notes from the
product team's feed, book_of_business from Salesforce, Gong/Zoom, CS notes and
account plans, training from the enablement team's approved material.
"""

DATA = {
    "seller_company": "Northstar Software",
    "rep": {
        "name": "Jordan",
        "role": "Account Executive",
        "segment": "Mid-market, UK & Ireland",
        "tenure": "Week 2 - new joiner, has not sold any Northstar product yet",
    },
    "products": [
        {
            "name": "Northstar Insights",
            "what": "Customer analytics dashboards and churn prediction",
            "list_price": "EUR 40k/year base, +EUR 8k per 50 users",
            "best_fit": "Companies with 50k+ customers and a CS or marketing team that lacks analytics",
            "competitors": "Mixpanel, in-house BI",
        },
        {
            "name": "Northstar Connect",
            "what": "Pre-built integrations between CRM, billing and support tools",
            "list_price": "EUR 25k/year",
            "best_fit": "Ops teams drowning in manual data syncs; usually a land product",
            "competitors": "Zapier, Workato",
        },
        {
            "name": "Northstar Assist",
            "what": "AI agent that deflects support tickets using the customer's help centre",
            "list_price": "EUR 0.40 per resolved conversation, min EUR 30k/year",
            "best_fit": "Support teams with 5k+ tickets/month and a decent help centre",
            "competitors": "Intercom Fin, Zendesk AI",
        },
    ],
    # In the real product: the product team's release notes feed
    # (Notion, Confluence, Productboard, the public changelog).
    "release_notes": [
        {
            "id": "rn-2026-01",
            "date": "2026-01-15",
            "product": "Northstar Assist",
            "title": "EU data residency",
            "detail": "Assist customer data can now be stored and processed entirely in EU data centres "
                      "(Dublin and Frankfurt).",
        },
        {
            "id": "rn-2026-09",
            "date": "2026-09-10",
            "product": "Northstar Insights",
            "title": "Insights Starter tier",
            "detail": "New entry tier at EUR 18k/year for up to 25 users, upgradeable to the full base plan "
                      "at any time.",
        },
        {
            "id": "rn-2026-10",
            "date": "2026-10-22",
            "product": "Northstar Connect",
            "title": "Native Salesforce connector",
            "detail": "Pre-built two-way Salesforce sync included in the Connect base price. Setup in under "
                      "a day, no per-task fees.",
        },
        {
            "id": "rn-2026-11",
            "date": "2026-11-03",
            "product": "Northstar Assist",
            "title": "Assist 2.0 (early access, general release 3 Dec 2026)",
            "detail": "One Assist agent can now answer from several help centres and brands at once. Adds "
                      "volume pricing: EUR 0.32 per resolved conversation above 100k conversations/year.",
        },
    ],
    # pain_points: in the real product these are extracted from Gong/Zoom calls,
    # CS notes, Salesforce fields and account plans.
    "book_of_business": [
        {
            "account": "Harbourline Logistics",
            "industry": "Logistics",
            "employees": 1200,
            "current_contracts": ["Northstar Connect (EUR 25k, renews Mar 2027)"],
            "stakeholders": "Aoife Byrne (COO, champion), Mark Doyle (CFO, cost-focused)",
            "history": [
                "2025: Pitched Northstar Insights - LOST. CFO said no budget; COO liked it.",
                "2026: Connect usage up 60% year on year; 14 integrations live.",
            ],
            "pain_points": [
                {"pain": "Insights was too expensive - CFO would not fund EUR 40k without proof of value",
                 "source": "Salesforce closed-lost reason", "date": "2025-06"},
                {"pain": "Support ticket backlog after the acquisition; two separate help centres to maintain",
                 "source": "QBR notes", "date": "2026-09"},
            ],
            "notes": "Support team doubled after acquiring a parcel firm; ticket backlog mentioned on last QBR.",
        },
        {
            "account": "Glenview Health Clinics",
            "industry": "Private healthcare",
            "employees": 450,
            "current_contracts": [],
            "stakeholders": "Dr. Niamh Walsh (Ops Director)",
            "history": [
                "2024: Inbound demo request for Assist - stalled at security review (data residency).",
            ],
            "pain_points": [
                {"pain": "Patient data must stay in the EU - this blocked Assist at security review",
                 "source": "Gong call", "date": "2024-10"},
            ],
            "notes": "",
        },
        {
            "account": "Pixelforge Games",
            "industry": "Gaming",
            "employees": 300,
            "current_contracts": [
                "Northstar Insights (EUR 48k, renews Jun 2027)",
                "Northstar Assist (EUR 30k min, renews Jun 2027)",
            ],
            "stakeholders": "Liam Chen (Head of Player Support, champion)",
            "history": [
                "2025: Won Insights + Assist bundle after competitive deal vs Intercom.",
            ],
            "pain_points": [
                {"pain": "Player support still copies billing data between tools by hand",
                 "source": "CS notes", "date": "2026-08"},
                {"pain": "Worried Assist cost will climb as conversation volume grows",
                 "source": "Gong call", "date": "2026-07"},
            ],
            "notes": "Assist resolving 9k conversations/month, well above minimum - expansion candidate.",
        },
        {
            "account": "Copperleaf Retail",
            "industry": "E-commerce",
            "employees": 800,
            "current_contracts": [],
            "stakeholders": "Sarah Kinsella (VP Operations) - new contact, no conversation since 2023",
            "history": [
                "2023: Lost Connect deal to Zapier on price.",
            ],
            "pain_points": [
                {"pain": "Connect looked expensive next to Zapier for a handful of syncs",
                 "source": "Salesforce closed-lost reason", "date": "2023-05"},
                {"pain": "Moving to Salesforce and needs billing and support data in sync from day one",
                 "source": "Account plan", "date": "2026-10"},
            ],
            "notes": "Recently announced a move to Salesforce.",
        },
    ],
    # The customer's approved enablement. Headstart never authors this; Mimir
    # applies it to each rep and account.
    "training": {
        "methodology": "Qualify with MEDDICC. Always identify the economic buyer before proposing.",
        "pricing_guardrails": "AEs can discount up to 15%. 15-25% needs manager approval. "
                              "Multi-year deals can go to 20% without approval.",
        "objection_handling": {
            "no budget": "Reframe around cost of the problem; offer a phased start or pilot.",
            "security": "Send the Trust Pack; offer a call with the security team; mention EU data residency.",
            "we use a competitor": "Ask what's not working; lead with integrations and time-to-value.",
        },
        "plays": [
            "Land-and-expand: Connect customers with high usage are prime for Insights or Assist.",
            "Assist ROI: tickets per month x deflection rate (typically 40%) x cost per ticket (~EUR 6).",
        ],
    },
}

# Sample team numbers for the manager view. In the real product these come
# from tracking each opportunity through Salesforce.
TEAM = {
    "kpis": {
        "surfaced": 112,
        "acted_on": 72,
        "pipeline": "€1.73M",
        "time_to_first_touch": "4 days",
        "upside_next_quarter": "€480k",
        "upside_basis": "38 matched accounts not yet in pipeline x 22% historical conversion x average deal value",
    },
    "reps": [
        {"rep": "Sinéad", "opportunities": 9, "acted_on": 7, "briefs": "6 of 6", "pipeline": "€140k"},
        {"rep": "Tom", "opportunities": 7, "acted_on": 3, "briefs": "2 of 5", "pipeline": "€60k"},
        {"rep": "Jordan (week 2)", "opportunities": 5, "acted_on": 0, "briefs": "0 of 2", "pipeline": "—"},
    ],
    "features": [
        {"feature": "Assist 2.0", "matched": 38, "acted_on": 15, "pipeline": "€310k", "won": "—"},
        {"feature": "Native Salesforce connector", "matched": 27, "acted_on": 19, "pipeline": "€420k", "won": "€75k"},
        {"feature": "Insights Starter tier", "matched": 31, "acted_on": 22, "pipeline": "€610k", "won": "€140k"},
        {"feature": "EU data residency", "matched": 16, "acted_on": 16, "pipeline": "€390k", "won": "€210k"},
    ],
    "unmet_needs": [
        {"need": "Native HubSpot connector", "accounts": 11, "at_stake": "€390k"},
        {"need": "Insights dashboards in German and French", "accounts": 8, "at_stake": "€320k"},
        {"need": "Voice channel for Assist", "accounts": 6, "at_stake": "€270k"},
    ],
}
