// POST /api/audit — the Crossroads Audit submission (server side; nothing secret ever reaches the browser).
//
//  1. Checks the request: same site, JSON, small, honeypot empty, not sent within seconds of opening the form.
//  2. Validates the fields and recomputes the scores and the profile from the answers (the browser's numbers are not
//     trusted).
//  3. Saves the contact, lead and consent record in Aya CRM (AYA_AUDIT_URL with the AYA_AUDIT_SECRET header). One
//     contact per email address; Aya also applies the rate limits (5 an hour per network address, 3 a day per email).
//  4. Sends the personalised result through Plunk (PLUNK_API_KEY) from hello@sergeabi.com, and, only with the optional
//     marketing consent, starts the Day 1/3/7/14 sequence (Plunk event "crossroads-audit-sequence").
//  5. Records in Aya what was sent.
//
// Cloudflare secrets: PLUNK_API_KEY (secret key, sk_…), PLUNK_PUBLIC_KEY (public key, pk_…, for the sequence event),
// AYA_AUDIT_SECRET. Optional variables: AYA_AUDIT_URL, PLUNK_API_URL, AUDIT_FROM.

const CONSENT_VERSION = 'crossroads-audit-2026-10-09';
const SOURCE = 'Sergeabi.com Crossroads Audit';
const BOOKING_URL = 'https://calendly.com/sergeabi/free';
const SEQUENCE_EVENT = 'crossroads-audit-sequence';
const LANGUAGES = ['en', 'fr', 'es', 'ar'];
const SITE_HOSTS = ['sergeabi.com', 'www.sergeabi.com', 'staging.sergeabi.com', 'sergeabistaging.pages.dev'];
const MIN_FILL_MS = 3000;

const AREAS = {
  identity: 'Identity and purpose',
  work: 'Work or business',
  freedom: 'Freedom and lifestyle',
  relationships: 'Relationships',
  wellbeing: 'Energy and wellbeing',
  money: 'Money and security',
  several: 'Several areas at once',
};
const DIMENSIONS = ['Alignment', 'Clarity', 'Freedom & support', 'Readiness'];
const PROFILES = {
  wakeup: {
    title: 'The Wake-Up Call',
    summary: 'Something in you already knows that the current chapter is no longer enough. You do not need to redesign your whole life today; begin by listening honestly.',
    reflection: 'What truth have you been keeping yourself too busy to hear?',
    action: 'Write two lists: “What drains me” and “What brings me alive.” Choose one small boundary from what you discover.',
  },
  crossroads: {
    title: 'The Crossroads',
    summary: 'You can sense another direction, but part of you remains attached to what is familiar. A small real-world experiment may create more clarity than more thinking.',
    reflection: 'If fear and other people’s expectations became silent, what would you choose?',
    action: 'Name three possible paths. Choose one small, reversible experiment that gives you real information.',
  },
  reset: {
    title: 'The Reset in Motion',
    summary: 'Your awareness is becoming readiness. The next step is to give your change enough structure to become real—without trying to change everything at once.',
    reflection: 'What single change would make the rest of your life easier to reorganize?',
    action: 'Create a 30-day commitment: one thing to start, one to stop and one to continue.',
  },
  expansion: {
    title: 'The Expansion',
    summary: 'Your foundation is relatively aligned. Your next chapter is asking for greater freedom, meaning or contribution—not simply more responsibility.',
    reflection: 'What wants to grow through you now?',
    action: 'Choose one meaningful expansion and one obligation you will decline to protect space for it.',
  },
};

const MESSAGES = {
  sent: (email) => `Thank you. Your personalized report is on its way to ${email}. If it has not arrived within a few minutes, please check your spam folder.`,
  invalid: 'Please check your first name, your email address and the required consent, then try again.',
  limited: 'You have already requested several reports. Please try again later.',
  unsaved: 'We could not send your report just now. Please try again in a few minutes.',
  unsent: 'Your answers are saved, but the email could not be sent just now. Please try again in a few minutes, or write to hello@sergeabi.com.',
};

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
});
const fail = (status, key) => json(status, { ok: false, message: MESSAGES[key] });
const escapeHtml = (v) => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

function sameSite(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  let host;
  try { host = new URL(origin).hostname; } catch (e) { return false; }
  return host === new URL(request.url).hostname
    && (SITE_HOSTS.includes(host) || host.endsWith('.sergeabistaging.pages.dev'));
}

// The same arithmetic as the page (site/audit.js), on the server.
function calculate(a) {
  const score = (v) => (Number(v) - 1) * 25;
  const avg = (vs) => Math.round(vs.reduce((s, v) => s + v, 0) / vs.length);
  const scores = [score(a.q2), score(a.q3), avg([100 - score(a.q4), score(a.q5)]), score(a.q6)];
  const overall = avg(scores);
  const profile = overall < 35 ? 'wakeup' : overall < 58 ? 'crossroads' : overall < 78 ? 'reset' : 'expansion';
  return { scores, profile };
}

function validate(b) {
  const firstName = typeof b.firstName === 'string' ? b.firstName.trim().replace(/\s+/g, ' ') : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const a = b.answers && typeof b.answers === 'object' ? b.answers : {};
  const answers = { q1: a.q1 };
  for (const q of ['q2', 'q3', 'q4', 'q5', 'q6']) answers[q] = Number(a[q]);
  const ok = firstName.length >= 1 && firstName.length <= 60 && !/[<>]|https?:|www\./i.test(firstName)
    && email.length <= 254 && /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/.test(email)
    && b.deliveryConsent === true && typeof b.marketingConsent === 'boolean'
    && Object.prototype.hasOwnProperty.call(AREAS, answers.q1)
    && ['q2', 'q3', 'q4', 'q5', 'q6'].every((q) => Number.isInteger(answers[q]) && answers[q] >= 1 && answers[q] <= 5);
  if (!ok) return null;
  return { firstName, email, answers, marketingConsent: b.marketingConsent,
           language: LANGUAGES.includes(b.language) ? b.language : 'en' };
}

async function ipHash(request, salt) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(d)].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function post(url, headers, body, ms = 10000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
                                   body: JSON.stringify(body), signal: ctl.signal });
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON */ }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

function reportEmail(v, result) {
  const p = PROFILES[result.profile];
  const bars = result.scores.map((s, i) => `
          <tr><td style="padding:6px 0;font-size:14px;color:#3b3a33">${DIMENSIONS[i]}</td>
              <td style="padding:6px 0;font-size:14px;color:#3b3a33;text-align:right;font-weight:600">${s}%</td></tr>
          <tr><td colspan="2" style="padding:0 0 8px"><div style="background:#ece6d6;border-radius:4px;height:6px">
              <div style="background:#b08d4f;border-radius:4px;height:6px;width:${s}%"></div></div></td></tr>`).join('');
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;background:#f6f3ea">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ea"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;font-family:Arial,Helvetica,sans-serif;color:#22211c">
      <tr><td style="padding:28px 28px 8px">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;color:#8a7442">THE CROSSROADS AUDIT</p>
        <p style="margin:0 0 18px;font-size:16px">Hello ${escapeHtml(v.firstName)},</p>
        <p style="margin:0 0 6px;font-size:14px;color:#6b685c">Your current stage</p>
        <h1 style="margin:0 0 12px;font-size:26px;font-weight:600;color:#22211c">${p.title}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${p.summary}</p>
        <p style="margin:0 0 18px;font-size:14px;color:#6b685c">This appears most strongly in: <strong style="color:#22211c">${AREAS[v.answers.q1]}</strong></p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bars}</table>
      </td></tr>
      <tr><td style="padding:8px 28px">
        <p style="margin:12px 0 4px;font-size:12px;letter-spacing:.12em;color:#8a7442">A QUESTION TO SIT WITH</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${p.reflection}</p>
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;color:#8a7442">YOUR NEXT SEVEN DAYS</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6">${p.action}</p>
      </td></tr>
      <tr><td style="padding:4px 28px 24px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">If you would like to talk through what this means for you, you can book a free conversation with Serge.</p>
        <a href="${BOOKING_URL}" style="display:inline-block;background:#22211c;color:#f6f3ea;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">Book a free conversation</a>
      </td></tr>
      <tr><td style="padding:16px 28px 28px;border-top:1px solid #ece6d6;font-size:12px;line-height:1.6;color:#6b685c">
        This reflection is not a medical or psychological assessment.<br>
        You receive this email because you asked for your Crossroads Audit result on sergeabi.com.
        How your data is used: <a href="https://sergeabi.com/privacy.html" style="color:#8a7442">Privacy Policy</a>.<br>
        Serge Abi · hello@sergeabi.com
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!sameSite(request)) return fail(403, 'invalid');
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return fail(415, 'invalid');
  const raw = await request.text();
  if (raw.length > 4000) return fail(413, 'invalid');
  let body;
  try { body = JSON.parse(raw); } catch (e) { return fail(400, 'invalid'); }

  // Bots: a filled hidden field, or a form sent a moment after it opened. They get a plain "thank you" and nothing
  // is saved or sent, so they learn nothing.
  const elapsed = Date.now() - Number(body.startedAt || 0);
  if ((body.website && String(body.website).trim()) || !(elapsed >= MIN_FILL_MS && elapsed < 6 * 3600 * 1000)) {
    return json(200, { ok: true, message: MESSAGES.sent('your inbox') });
  }

  const v = validate(body);
  if (!v) return fail(400, 'invalid');
  if (!env.AYA_AUDIT_SECRET || !env.PLUNK_API_KEY) return fail(503, 'unsaved');
  const result = calculate(v.answers);
  const p = PROFILES[result.profile];
  const now = new Date().toISOString();

  const aya = env.AYA_AUDIT_URL || 'https://ai.sergeabi.com/webhook/sergeabi-audit';
  const ayaHeaders = { 'X-Aya-Audit-Secret': env.AYA_AUDIT_SECRET };
  const saved = await post(aya, ayaHeaders, { action: 'submit', data: {
    first_name: v.firstName, email: v.email, profile: result.profile, primary_area: v.answers.q1,
    alignment_score: result.scores[0], clarity_score: result.scores[1], freedom_score: result.scores[2],
    readiness_score: result.scores[3], answers: v.answers, delivery_consent: true,
    marketing_consent: v.marketingConsent, consent_version: CONSENT_VERSION, consent_at: now,
    language: v.language, source: SOURCE, ip_hash: await ipHash(request, env.AYA_AUDIT_SECRET),
  } });
  if (saved.status === 429) return fail(429, 'limited');
  if (saved.status !== 200 || !saved.data || saved.data.ok !== true) return fail(saved.status === 400 ? 400 : 502, 'unsaved');
  const submissionId = saved.data.submission_id;

  const plunk = (env.PLUNK_API_URL || 'https://next-api.useplunk.com').replace(/\/$/, '');
  const auth = { Authorization: `Bearer ${env.PLUNK_API_KEY}` };
  const contactData = { firstName: v.firstName, auditProfile: p.title, auditPrimaryArea: AREAS[v.answers.q1],
                        auditLanguage: v.language, auditSource: SOURCE };
  const sent = await post(`${plunk}/v1/send`, { ...auth, 'Idempotency-Key': `audit-${submissionId}` }, {
    to: { name: v.firstName, email: v.email },
    from: { name: 'Serge Abi', email: env.AUDIT_FROM || 'hello@sergeabi.com' },
    subject: `Your Crossroads Audit result: ${p.title}`,
    body: reportEmail(v, result),
    data: contactData,
    ...(v.marketingConsent ? { subscribed: true } : {}),
  });
  const accepted = (r) => r.status >= 200 && r.status < 300 && !(r.data && r.data.success === false);
  const errorOf = (r) => (r.data && r.data.error && (r.data.error.code || r.data.error.message)) || null;
  const reportOk = accepted(sent);

  let sequence = v.marketingConsent ? 'not started' : 'not consented';
  let tracked = null;
  if (reportOk && v.marketingConsent && saved.data.start_sequence) {
    // Plunk's /v1/track takes the project's public key (pk_…); the secret key is refused there (401, 10 Oct 2026).
    const trackAuth = env.PLUNK_PUBLIC_KEY ? { Authorization: `Bearer ${env.PLUNK_PUBLIC_KEY}` } : auth;
    tracked = await post(`${plunk}/v1/track`, trackAuth, { event: SEQUENCE_EVENT, email: v.email, subscribed: true,
                                                           data: contactData });
    sequence = accepted(tracked) ? 'started' : 'failed';
  } else if (v.marketingConsent && !saved.data.start_sequence) {
    sequence = 'not started: unsubscribed before';
  }

  waitUntil(post(aya, ayaHeaders, { action: 'delivery', data: {
    submission_id: submissionId, report_status: reportOk ? 'sent' : 'failed', sequence_status: sequence,
    detail: { plunk_send_status: sent.status, plunk_error: reportOk ? null : errorOf(sent),
              ...(tracked ? { plunk_track_status: tracked.status, plunk_track_error: accepted(tracked) ? null : errorOf(tracked) } : {}) },
  } }));

  return reportOk ? json(200, { ok: true, message: MESSAGES.sent(v.email) }) : fail(502, 'unsent');
}

export const onRequest = () => json(405, { ok: false, message: 'Method not allowed.' });
