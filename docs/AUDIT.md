# Crossroads Audit: how a submission travels

1. The visitor answers the six questions on the page (`site/audit.js`) and asks for the report. They give a first
   name, an email address, the required delivery consent and, if they want, the marketing consent.
2. The page sends the answers to the site's own server-side endpoint, `/api/audit` (`functions/api/audit.js`). They
   go in the request body, never in the address, and nothing is written to the browser console. The endpoint:
   - accepts only requests from the site itself, in JSON, and small;
   - drops bots silently: a hidden field that a person never fills, or a form sent within 3 seconds of opening;
   - checks every field and recomputes the scores and the profile from the answers, so the browser's numbers are
     never trusted.
3. **Aya CRM.** The endpoint saves the submission through Aya's intake (`https://ai.sergeabi.com/webhook/sergeabi-audit`,
   protected by the `AYA_AUDIT_SECRET` header):
   - It saves the contact and an open lead, under the business "Serge Abi personal brand", source "Sergeabi.com
     Crossroads Audit".
   - It saves one consent record per submission: the answers, the four scores, the profile, the primary life area,
     the required and optional consents, the consent version and time, the language, and a hash of the network
     address.
   - One email address is one contact. A second audit updates that contact and adds a new consent record.
   - Rate limits: at most 5 submissions an hour from one network address, and 3 a day for one email address.
4. **Plunk.** The personalised result is emailed at once from hello@sergeabi.com, with the booking link. Only when
   the marketing consent is ticked does the endpoint send the event `crossroads-audit-sequence`, which starts the
   Day 1/3/7/14 sequence. A person who unsubscribed before is not restarted by a later audit unless they tick the
   marketing consent again.
5. **The result back to Aya.** The endpoint records in Aya what happened to the submission: report sent or failed,
   and whether the sequence started.

The Plunk key stays in Cloudflare and is used only by the endpoint. The page never sees it.

## Settings in Cloudflare (Pages → sergeabistaging → Settings → Variables and Secrets)

| Name | Type | Production | Preview | Value |
|---|---|---|---|---|
| `PLUNK_API_KEY` | Secret | done (Serge) | needed for the preview test | Plunk secret key (`sk_…`) |
| `PLUNK_PUBLIC_KEY` | Secret | needed | needed | Plunk public key (`pk_…`): Plunk accepts only this key for the sequence event |
| `AYA_AUDIT_SECRET` | Secret | needed | needed | read on the Aya server (`/root/.aya_audit_secret`); never sent by message |

Optional: `AUDIT_FROM` (default `hello@sergeabi.com`), `AYA_AUDIT_URL`, `PLUNK_API_URL` (default
`https://next-api.useplunk.com`).

## The sequence in Plunk (Workflows)

The sequence is a Plunk workflow, built in the Plunk dashboard:

- **Trigger:** event `crossroads-audit-sequence`. Re-entry is off.
- **Steps, timed from the audit:**
  - wait 1 day, send email 1;
  - wait 2 days, send email 2 (day 3);
  - wait 4 days, send email 3 (day 7);
  - wait 7 days, send email 4 (day 14).
- **Every email** has the booking link and Plunk's unsubscribe link (`{{unsubscribeUrl}}`).
- **Unsubscribe:** a contact who unsubscribes leaves the sequence.
- **Unsubscribe in Aya:** a second workflow, triggered by `contact.unsubscribed`, has one Webhook step:
  - POST `https://ai.sergeabi.com/webhook/sergeabi-audit`
  - header `X-Aya-Audit-Secret`
  - body `{"action": "unsubscribed", "data": {"email": "{{email}}"}}`

  Aya then marks the contact "do not market".
- **Stop on booking:** this needs Calendly to report bookings. Calendly sends booking webhooks on paid plans only.
  When that is available, a booking sends the event `crossroads-audit-booked` and the workflow exits. Until then, a
  person who books can unsubscribe, or the team cancels their execution in Plunk.
- **Stop on reply:** Plunk does not see replies to hello@sergeabi.com, which go to Zoho. Replies are answered by
  hand, and the team can cancel that person's execution in Plunk.

## Test plan (on the branch preview, before merging)

- All four profiles: Wake-Up Call, Crossroads, Reset in Motion, Expansion.
- Valid and invalid submissions: a missing name, a wrong email, no required consent.
- Required consent only, then with the marketing consent.
- The same email twice: one contact, two consent records.
- The contact and lead in the Aya CRM.
- The result email arrives at once, on mobile and on desktop.
- The sequence: the first email of a test run, and the delays checked in Plunk. The unsubscribe link stops it and
  marks the contact in Aya.
- Submission from a phone and from a desktop browser.

The server-side endpoint has automated checks (31, all passing). The Aya intake was checked through its public
address (13 checks).

## Draft sequence (Shoaib's suggestion; Serge edits or replaces it)

**Day 1. Subject: The question behind your result**
Hello {{firstName}}, yesterday your Crossroads Audit pointed to *{{auditProfile}}*. Results like this are not a
verdict; they are a mirror. Before anything changes outside, something usually gets named inside. This week, take
ten quiet minutes with the question from your report and write whatever comes, without editing it. If you would like
to talk it through, you can book a free conversation: https://calendly.com/sergeabi/free

**Day 3. Subject: Small steps beat big decisions**
Hello {{firstName}}, most of the people I work with do not need a dramatic leap. They need one honest, reversible
step that gives them real information. What is the smallest step you could take this week toward what your audit
showed? Reply to yourself in one sentence, then put it in your calendar.

**Day 7. Subject: What gets in the way**
Hello {{firstName}}, fear, obligation and other people's expectations are the three forces that keep most
crossroads unresolved. Notice which one speaks loudest for you, and what it is protecting you from. Naming it
already loosens its grip. If you want a clear next step, a free conversation is open:
https://calendly.com/sergeabi/free

**Day 14. Subject: Two weeks on**
Hello {{firstName}}, two weeks ago you took the Crossroads Audit. What has shifted since, even slightly? If you are
ready to turn this into a concrete plan, let's talk. Book a free conversation:
https://calendly.com/sergeabi/free. If now is not the time, that is fine too; you can come back to the audit
whenever your next crossroads appears.
