/* Headstart V2 front end. Plain JS, no build step. */

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function md(t) {
  const h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const out = []; let inList = false;
  for (const line of h.split('\n')) {
    const m = line.match(/^\s*[-*]\s+(.*)/);
    if (m) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + m[1] + '</li>'); }
    else { if (inList) { out.push('</ul>'); inList = false; } out.push(line ? line + '<br>' : '<br>'); }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}
function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1800);
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Copied'); }
  catch (e) { window.prompt('Copy this:', text); }
}
function load(key, dflt) { try { return JSON.parse(localStorage.getItem(key) || dflt); } catch (e) { return JSON.parse(dflt); } }
function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
async function getJSON(url, body) {
  try {
    const r = body === undefined ? await fetch(url)
      : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await r.json();
  } catch (e) { return { error: 'Could not reach the server.' }; }
}

const ARROW = '<svg class="arrow" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const TYPE = { new_feature: ['New feature', 't-blue'], not_owned: ["Product they don't have", 't-green'], expansion: ['Grow what they have', 't-green'] };
const shortName = p => p.replace(/^Northstar\s+/, '');

/* ---------- state ---------- */
let B = null;                 // bootstrap data
let opps = null, oppsLoading = false;
let page = 'opps', current = null;
const work = {};              // per opportunity: brief, quiz, groundwork
let status = load('hs-status', '{}');   // key -> 'sent'
const key = o => o.account + '|' + o.product;
const W = o => (work[key(o)] = work[key(o)] || { brief: null, briefLoading: false, answers: {}, checked: false, gw: null, gwLoading: false, slot: null });
const list = () => (opps && opps.opportunities) || [];
const account = name => B.accounts.find(a => a.account === name) || {};

/* ---------- navigation ---------- */
document.querySelectorAll('.navlink').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
function go(p, i) {
  page = p; current = i ?? null;
  document.querySelectorAll('.navlink').forEach(b => b.classList.toggle('on', b.dataset.page === (p === 'opp' ? 'opps' : p)));
  render(); window.scrollTo(0, 0);
}
function render() {
  if (page === 'opps') renderOpps();
  else if (page === 'opp') renderOpp(current);
  else if (page === 'whitespace') renderWhitespace();
  else if (page === 'team') renderTeam();
}

/* ---------- 1. opportunities ---------- */
async function loadOpps(fresh) {
  oppsLoading = true; opps = null; render();
  opps = await getJSON('/api/opportunities' + (fresh ? '?fresh=1' : ''));
  oppsLoading = false; render();
}
function bridge(o) {
  return `<div class="bridge"><div class="need"><span class="label">Their problem · ${esc(o.source)}</span>${esc(o.problem)}</div>${ARROW}
    <div class="now"><span class="label">What we can offer now</span>${esc(o.offer)}</div></div>`;
}
function statusTag(o) {
  if (status[key(o)] === 'sent') return '<span class="tag t-green">Sent</span>';
  if (W(o).gw && !W(o).gw.error) return '<span class="tag t-blue">Draft ready</span>';
  return '';
}
function renderOpps() {
  setContext('Looking at: your opportunities', 'The rep is on the Opportunities list.\n' + JSON.stringify(list().map(o => o.headline + ' (' + o.account + ', ' + o.product + ')')),
    ['Which one should I start with?', 'Why is Glenview worth calling again?', 'What should I know before I contact Harbourline?']);
  let h = `<div class="row between"><div><h1 style="font-size:32px">Your opportunities</h1>
    <p class="muted" style="margin-top:6px">Customers in your accounts with a problem we can now solve. ${esc(B.rep.name)} · ${esc(B.rep.segment)}</p></div>
    <div class="row">${opps && !opps.error ? `<span class="tag t-blue">${list().length} to work</span>` : ''}
    <button class="btn" type="button" onclick="loadOpps(true)" ${oppsLoading ? 'disabled' : ''}>Look again</button></div></div>`;
  if (oppsLoading) h += '<div class="empty">Mimir is reading your accounts and what\'s new at ' + esc(B.company) + '&hellip; (about 20 seconds)</div>';
  else if (opps && opps.error) h += `<div class="empty">${esc(opps.error)}</div>`;
  else if (opps) {
    if (opps.summary) h += `<div class="bubble"><b>Mimir:</b> ${esc(opps.summary)}</div>`;
    list().forEach((o, i) => {
      const t = TYPE[o.type] || [o.type, 't-grey'];
      h += `<article class="card section">
        <div class="row between" style="align-items:flex-start"><h2 class="headline">${esc(o.headline)}</h2><span style="font-weight:600;white-space:nowrap">${esc(o.value)}</span></div>
        <div class="row"><span class="muted small">${esc(o.account)} · ${esc(shortName(o.product))}</span><span class="tag ${t[1]}">${esc(t[0])}</span>${statusTag(o)}</div>
        ${bridge(o)}
        <div class="row between"><div class="row">${o.brief_recommended ? '<span class="tag t-amber">Read a short brief first</span>' : ''}
          <span class="small muted">Mimir will write ${esc(o.first_step)}</span></div>
          <button class="btn ${i === 0 ? 'primary' : ''}" type="button" onclick="go('opp', ${i})">Open</button></div>
      </article>`;
    });
  }
  $('main').innerHTML = h;
}

/* ---------- 2. one opportunity ---------- */
function renderOpp(i) {
  const o = list()[i]; if (!o) return go('opps');
  const a = account(o.account), w = W(o), t = TYPE[o.type] || [o.type, 't-grey'];
  const owns = (B.whitespace.find(r => r.account === o.account) || { owned: {} }).owned;
  setContext('Looking at: ' + o.account + ' · ' + shortName(o.product),
    'The rep has this opportunity open:\n' + JSON.stringify(o),
    ['How do I open the conversation?', `Role-play ${(o.contact || 'the customer').split(' (')[0]} pushing back`, 'What could kill this deal?']);
  const section = (n, title, sub, body) => `<section class="card section"><div class="row"><div class="step" aria-hidden="true">${n}</div>
    <div><h2 style="font-size:18px">${title}</h2><div class="muted small">${sub}</div></div></div>${body}</section>`;

  const facts = `<div class="facts">
    <div><span class="label">Who</span>${esc(a.stakeholders || o.contact)}</div>
    <div><span class="label">History</span>${(a.history || []).map(esc).join('<br>') || '<span class="muted">None recorded</span>'}</div>
    <div><span class="label">Has today</span>${Object.keys(owns).length ? Object.entries(owns).map(([p, d]) => esc(shortName(p) + ': ' + d)).join('<br>') : '<span class="muted">Nothing yet</span>'}</div>
    <div><span class="label">Why now</span>${esc(o.why_now)}</div></div>`;

  let prep;
  if (w.brief && !w.brief.error) prep = briefHtml(o);
  else if (o.brief_recommended) prep = `<div class="prepbox"><div style="flex:1 1 300px"><b>Recommended: a 3-minute brief and 5 quick questions</b>
      <div class="small" style="color:#7C3A06;margin-top:2px">${esc(o.brief_reason)} Built from your company's approved training.</div></div>
      <button class="btn primary" type="button" onclick="loadBrief(${i})" ${w.briefLoading ? 'disabled' : ''}>${w.briefLoading ? 'Preparing&hellip;' : 'Start brief'}</button></div>`
      + (w.brief && w.brief.error ? `<div class="small muted">${esc(w.brief.error)}</div>` : '');
  else prep = `<div class="okbox"><b>No prep needed.</b> You have what you need on this page. <button class="btn quiet" type="button" onclick="loadBrief(${i})">${w.briefLoading ? 'Preparing&hellip;' : 'Read a brief anyway'}</button></div>`;

  $('main').innerHTML = `<div class="crumb"><button type="button" onclick="go('opps')">Opportunities</button> <span class="muted">/ ${esc(o.account)}</span></div>
    <div class="row between" style="align-items:flex-start"><div style="flex:1 1 420px"><h1 style="font-size:28px;line-height:1.25">${esc(o.headline)}</h1>
    <p class="muted" style="margin-top:6px">${esc(o.account)} · ${esc(o.product)} · ${esc(a.industry || '')}${a.employees ? ' · ' + a.employees.toLocaleString() + ' employees' : ''}</p></div>
    <div class="row"><span class="tag ${t[1]}">${esc(t[0])}</span><span class="tag t-grey">${esc(o.value)}</span>${statusTag(o)}</div></div>
    ${section(1, 'The opportunity', 'Why Mimir flagged this, and what you need to know', bridge(o) + facts)}
    ${section(2, 'Get ready', o.brief_recommended ? 'Recommended before you reach out' : 'Optional', prep)}
    ${section(3, 'Mimir does the groundwork', 'Review, edit and approve. Nothing is sent without you.', groundworkHtml(o, i))}`;
}

async function loadBrief(i) {
  const o = list()[i], w = W(o); if (w.briefLoading) return;
  w.briefLoading = true; render();
  w.brief = await getJSON('/api/brief', { opportunity: o });
  w.briefLoading = false; render();
}
function briefHtml(o) {
  const w = W(o), quiz = w.brief.quiz || [], i = list().indexOf(o);
  let h = `<div class="prose">${md(w.brief.brief || '')}</div>`;
  if (!quiz.length) return h;
  h += `<div><b>Quick check</b> <span class="small muted">pass mark ${B.pass_mark}%</span>`;
  quiz.forEach((q, qi) => {
    h += `<div class="qq"><div style="font-weight:600;font-size:14px;margin-bottom:4px">${qi + 1}. ${esc(q.q)}</div>`;
    (q.options || []).forEach((opt, oi) => {
      const picked = w.answers[qi] === oi, right = Number(q.answer) === oi;
      const cls = w.checked ? (right ? ' right' : (picked ? ' wrong' : '')) : '';
      h += `<label class="opt${cls}"><input type="radio" name="q${qi}" ${picked ? 'checked' : ''} ${w.checked ? 'disabled' : ''} onchange="pick(${i},${qi},${oi})"> ${esc(opt)}</label>`;
    });
    if (w.checked) h += `<div class="small muted" style="margin:4px 8px">${esc(q.why)}</div>`;
    h += '</div>';
  });
  if (!w.checked) {
    const ready = Object.keys(w.answers).length === quiz.length;
    h += `<div class="row" style="margin-top:10px"><button class="btn primary" type="button" onclick="checkQuiz(${i})" ${ready ? '' : 'disabled'}>Check answers</button></div>`;
  } else {
    const score = quiz.filter((q, qi) => Number(q.answer) === w.answers[qi]).length, pct = Math.round(100 * score / quiz.length), ok = pct >= B.pass_mark;
    h += `<div class="row" style="margin-top:10px"><span class="tag ${ok ? 't-green' : 't-amber'}">${score}/${quiz.length} (${pct}%) · ${ok ? "You're ready" : 'Worth another read'}</span>
      <button class="btn quiet" type="button" onclick="retryQuiz(${i})">Try again</button></div>`;
  }
  return h + '</div>';
}
function pick(i, qi, oi) { W(list()[i]).answers[qi] = oi; render(); }
function checkQuiz(i) { W(list()[i]).checked = true; render(); }
function retryQuiz(i) { const w = W(list()[i]); w.answers = {}; w.checked = false; render(); }

/* groundwork: email, meeting times, Salesforce opportunity, call plan */
function slots() {
  const d = new Date(), next = new Date(d); next.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); // next Monday
  return [[1, 10, 0], [2, 14, 0], [3, 11, 30]].map(([add, hh, mm]) => { const s = new Date(next); s.setDate(next.getDate() + add); s.setHours(hh, mm, 0, 0); return s; });
}
const niceSlot = s => s.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + s.toTimeString().slice(0, 5);
async function loadGroundwork(i) {
  const o = list()[i], w = W(o); if (w.gwLoading) return;
  w.gwLoading = true; render();
  w.gw = await getJSON('/api/groundwork', { opportunity: o });
  w.gwLoading = false; render();
}
function groundworkHtml(o, i) {
  const w = W(o);
  if (!w.gw || w.gw.error) {
    return `<p class="small muted">Mimir will write ${esc(o.first_step)}, suggest meeting times, set up the Salesforce opportunity and plan your first call.</p>
      ${w.gw && w.gw.error ? `<div class="small muted">${esc(w.gw.error)}</div>` : ''}
      <div class="row"><button class="btn primary" type="button" onclick="loadGroundwork(${i})" ${w.gwLoading ? 'disabled' : ''}>${w.gwLoading ? 'Mimir is working&hellip;' : 'Let Mimir do it'}</button></div>`;
  }
  const g = w.gw; g.email = g.email || {}; const e = g.email, c = g.crm || {}, sl = slots();
  const crmText = Object.entries(c).map(([k, v]) => k.replace(/_/g, ' ') + ': ' + v).join('\n');
  const sent = status[key(o)] === 'sent';
  return `<div class="task"><div class="row between"><b>Email to ${esc(e.to)}</b><span class="tag ${sent ? 't-green' : 't-blue'}">${sent ? 'Sent' : 'Draft'}</span></div>
      <input type="text" id="esubj" value="${esc(e.subject)}" aria-label="Subject" oninput="W(list()[${i}]).gw.email.subject=this.value">
      <textarea id="ebody" aria-label="Email body" oninput="W(list()[${i}]).gw.email.body=this.value">${esc(e.body)}</textarea>
      <div class="row"><button class="btn primary" type="button" onclick="openEmail(${i})">Open in my email</button>
        <button class="btn" type="button" onclick="copy($('esubj').value + '\\n\\n' + $('ebody').value, 'Email copied')">Copy</button>
        <button class="btn quiet" type="button" onclick="markSent(${i})">${sent ? 'Mark as not sent' : 'Mark as sent'}</button></div></div>
    <div class="task"><b>Meeting times</b><span class="small muted">Suggested slots next week. Pick one to add a 30-minute hold to your calendar. (Calendar sync comes later.)</span>
      <div class="slots">${sl.map((s, si) => `<button class="btn ${w.slot === si ? 'primary' : ''}" type="button" onclick="hold(${i}, ${si})">${esc(niceSlot(s))}</button>`).join('')}</div></div>
    <div class="task"><div class="row between"><b>Salesforce opportunity</b><span class="tag t-blue">Draft</span></div>
      <dl class="kvlist">${Object.entries(c).map(([k, v]) => `<dt>${esc(k.replace(/_/g, ' '))}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <div class="row"><button class="btn" type="button" onclick='copy(${JSON.stringify(crmText).replace(/'/g, '&#39;')}, "Copied for Salesforce")'>Copy for Salesforce</button>
        <span class="small muted">Creating it directly in Salesforce comes later.</span></div></div>
    <div class="task"><b>Your first call</b><div class="prose">${md((g.questions || []).map(q => '- ' + q).join('\n'))}</div>
      ${g.heads_up ? `<div class="okbox" style="background:#FEF3E2"><b>Heads up:</b> ${esc(g.heads_up)}</div>` : ''}</div>
    <div class="row"><button class="btn quiet" type="button" onclick="redoGroundwork(${i})">Ask Mimir to redo it</button></div>`;
}
function openEmail(i) {
  const s = encodeURIComponent($('esubj').value), b = encodeURIComponent($('ebody').value);
  window.location.href = `mailto:?subject=${s}&body=${b}`;
}
function markSent(i) { const k = key(list()[i]); if (status[k] === 'sent') delete status[k]; else status[k] = 'sent'; store('hs-status', status); render(); }
async function redoGroundwork(i) {
  const o = list()[i], w = W(o); w.gwLoading = true; w.gw = null; render();
  w.gw = await getJSON('/api/groundwork?fresh=1', { opportunity: o }); w.gwLoading = false; render();
}
function hold(i, si) {
  const o = list()[i], w = W(o), s = slots()[si], e = new Date(s.getTime() + 30 * 60000); w.slot = si;
  const p = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
  const icsEsc = x => String(x).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Headstart//Mimir//EN', 'BEGIN:VEVENT',
    'UID:' + key(o).replace(/\W/g, '') + '-' + fmt(s) + '@headstart', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    'DTSTART:' + fmt(s), 'DTEND:' + fmt(e), 'SUMMARY:' + icsEsc('Hold: ' + o.account + ' - ' + shortName(o.product)),
    'DESCRIPTION:' + icsEsc(o.headline + '\n\nOpen Headstart for the call plan.'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = (o.account + '-hold').replace(/[^\w-]+/g, '_') + '.ics'; a.click();
  render();
}

/* ---------- 3. white space ---------- */
function renderWhitespace() {
  setContext('Looking at: your accounts', 'The rep is on the White space page: what each account owns and where opportunities are.',
    ['Where is my biggest gap?', 'Which accounts have nothing open yet?', 'What could I sell Copperleaf?']);
  const ws = B.whitespace, prods = B.products;
  let h = `<div><h1 style="font-size:32px">White space</h1><p class="muted" style="margin-top:6px">What each account has, what's open, and where a customer problem now meets something we can sell.</p></div>
    <div class="card section"><div class="row between"><h2 style="font-size:18px">What's new at ${esc(B.company)}</h2><span class="muted small">Matched against what customers said in calls, CS notes and Salesforce</span></div>
    <div class="row">${B.releases.slice().reverse().map(r => { const n = list().filter(o => o.release_id === r.id).length;
      return `<span class="tag t-blue">${esc(r.title.replace(/\s*\(.*\)/, ''))} · ${opps && !opps.error ? (n ? 'fits ' + n + ' account' + (n === 1 ? '' : 's') : 'no fit yet') : esc(r.date)}</span>`; }).join('')}</div></div>
    <div class="card" style="padding:8px 8px 4px"><div class="row between" style="padding:12px 12px 8px"><h2 style="font-size:18px">Your accounts</h2><span class="muted small">Blue = an opportunity Mimir found</span></div>
    <div class="scroll"><table><thead><tr><th>Account</th>${prods.map(p => `<th>${esc(shortName(p))}</th>`).join('')}</tr></thead><tbody>`;
  ws.forEach(row => {
    h += `<tr><td style="font-weight:600;white-space:nowrap">${esc(row.account)}</td>`;
    prods.forEach(p => {
      const oi = list().findIndex(o => o.account === row.account && o.product === p);
      if (oi >= 0) h += `<td><div class="wcell w-opp"><b>Opportunity</b><br>${esc(list()[oi].headline)}<br><button type="button" onclick="go('opp', ${oi})">Open</button></div></td>`;
      else if (row.owned[p]) h += `<td><div class="wcell w-own"><b>Has it</b><br>${esc(row.owned[p])}</div></td>`;
      else h += `<td><div class="wcell w-open"><b>Open</b><br>${oppsLoading ? 'Checking&hellip;' : 'No reason to call yet'}</div></td>`;
    });
    h += '</tr>';
  });
  $('main').innerHTML = h + '</tbody></table></div></div>';
}

/* ---------- 4. team view ---------- */
function renderTeam() {
  const T = B.team, k = T.kpis;
  setContext('Looking at: your team', 'The rep (or manager) is on the Team view. Sample team data:\n' + JSON.stringify(T),
    ['Who needs coaching this week?', 'Which new feature is selling best?', 'What should I tell Product?']);
  const table = (heads, rows) => `<div class="scroll"><table><thead><tr>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  $('main').innerHTML = `<div class="row between"><div><h1 style="font-size:32px">Team view</h1><p class="muted" style="margin-top:6px">How much pipeline your team is creating from what Product ships. Sample data.</p></div><span class="tag t-grey">This quarter</span></div>
    <div class="kpis">
      <div class="card"><div class="muted small">Opportunities found</div><div class="kv">${k.surfaced}</div></div>
      <div class="card"><div class="muted small">Acted on</div><div class="kv">${Math.round(100 * k.acted_on / k.surfaced)}%</div><div class="small muted">${k.acted_on} of ${k.surfaced}</div></div>
      <div class="card"><div class="muted small">Pipeline created</div><div class="kv">${esc(k.pipeline)}</div></div>
      <div class="card"><div class="muted small">New feature to first customer contact</div><div class="kv">${esc(k.time_to_first_touch)}</div></div>
    </div>
    <div class="card"><div class="row between"><div><div class="muted small">Pipeline still to come from new features, next quarter</div><div class="kv">${esc(k.upside_next_quarter)}</div></div>
      <span class="small muted" style="max-width:420px">${esc(k.upside_basis)}. Not in your forecast tool yet, because these deals don't exist yet.</span></div></div>
    <div class="card" style="padding:8px 8px 4px"><div class="row between" style="padding:12px 12px 8px"><h2 style="font-size:18px">By rep</h2></div>
      ${table(['Rep', 'Opportunities', 'Acted on', 'Briefs passed', 'Pipeline'], T.reps.map(r => `<tr><td style="font-weight:600">${esc(r.rep)}</td><td>${r.opportunities}</td><td>${r.acted_on}</td><td>${esc(r.briefs)}</td><td style="font-weight:600">${esc(r.pipeline)}</td></tr>`))}</div>
    <div class="card" style="padding:8px 8px 4px"><div class="row between" style="padding:12px 12px 8px"><h2 style="font-size:18px">By new feature</h2><span class="muted small">Which product updates are turning into pipeline</span></div>
      ${table(['Feature', 'Accounts it fits', 'Acted on', 'Pipeline', 'Won'], T.features.map(f => `<tr><td style="font-weight:600">${esc(f.feature)}</td><td>${f.matched}</td><td>${f.acted_on}</td><td style="font-weight:600">${esc(f.pipeline)}</td><td>${esc(f.won)}</td></tr>`))}</div>
    <div class="card section"><div class="row between"><h2 style="font-size:18px">Needs we can't sell into yet</h2><span class="muted small">For Product, ranked by revenue at stake</span></div>
      ${T.unmet_needs.map(n => `<div class="row between" style="font-size:14px"><div><b>${esc(n.need)}</b> <span class="muted small">· ${n.accounts} accounts</span></div><b>${esc(n.at_stake)}</b></div>`).join('')}</div>`;
}

/* ---------- Mimir panel ---------- */
const history = [];
let pageContext = '';
function setContext(label, ctx, chips) {
  $('mctx').textContent = label; pageContext = ctx;
  $('chips').innerHTML = '';
  chips.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c; b.onclick = () => send(c); $('chips').appendChild(b); });
}
function bubble(role, text) {
  const d = document.createElement('div'); d.className = 'bubble' + (role === 'user' ? ' me' : '');
  d.innerHTML = role === 'user' ? esc(text) : md(text); $('mlog').appendChild(d); $('mlog').scrollTop = $('mlog').scrollHeight; return d;
}
async function send(text) {
  if (!text.trim()) return;
  openMimir(); bubble('user', text); history.push({ role: 'user', content: text }); $('ask').value = '';
  const thinking = bubble('bot', '&hellip;');
  const r = await getJSON('/api/chat', { messages: history, context: pageContext });
  const reply = r.reply || r.error || 'No reply.';
  thinking.innerHTML = md(reply); history.push({ role: 'assistant', content: reply }); $('mlog').scrollTop = $('mlog').scrollHeight;
}
function openMimir() { $('mimir').classList.add('open'); }
$('askform').onsubmit = e => { e.preventDefault(); send($('ask').value); };
$('mfab').onclick = openMimir;
$('mclose').onclick = () => $('mimir').classList.remove('open');

/* ---------- start ---------- */
(async function start() {
  B = await getJSON('/api/bootstrap');
  if (B.error) { $('main').innerHTML = `<div class="empty">${esc(B.error)}</div>`; return; }
  $('navfoot').innerHTML = `${esc(B.company)}<br>${esc(B.rep.name)} · ${esc(B.rep.role)}<br>Sample data`;
  bubble('bot', `Hi ${B.rep.name}, I'm Mimir. I look for customers in your accounts with a problem we can now solve, and I do the groundwork so you can act on them. Ask me anything about the page you're on.`);
  render();
  if (B.has_key) loadOpps(false);
  else { opps = { error: 'No API key found. Add ANTHROPIC_API_KEY in Replit Secrets (or your environment), then restart.' }; render(); }
})();
