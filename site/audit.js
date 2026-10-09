(() => {
  const root = document.getElementById('audit-calculator');
  if (!root) return;
  const sectionDescription = root.closest('.audit')?.querySelector('.audit-copy p');
  if (sectionDescription) sectionDescription.textContent = 'Six focused questions to help you see what is changing, what you are avoiding and what deserves your attention next.';

  const domains = [
    ['identity', 'Identity and purpose'],
    ['work', 'Work or business'],
    ['freedom', 'Freedom and lifestyle'],
    ['relationships', 'Relationships'],
    ['wellbeing', 'Energy and wellbeing'],
    ['money', 'Money and security'],
    ['several', 'Several areas at once']
  ];
  const scale = ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'];
  const questions = [
    'Where do you feel the crossroads most strongly?',
    'My current life reflects who I am today.',
    'I can clearly name what needs to change.',
    'Fear, obligation or other people\u2019s expectations keep me from acting.',
    'I have enough support, time or resources to begin making a change.',
    'I am ready to take a practical step within the next 30 days.'
  ];
  const dimensions = ['Alignment', 'Clarity', 'Freedom & support', 'Readiness'];
  const profiles = {
    wakeup: {
      title: 'The Wake-Up Call',
      summary: 'Something in you already knows that the current chapter is no longer enough. You do not need to redesign your whole life today; begin by listening honestly.',
      reflection: 'What truth have you been keeping yourself too busy to hear?',
      action: 'Write two lists: \u201cWhat drains me\u201d and \u201cWhat brings me alive.\u201d Choose one small boundary from what you discover.'
    },
    crossroads: {
      title: 'The Crossroads',
      summary: 'You can sense another direction, but part of you remains attached to what is familiar. A small real-world experiment may create more clarity than more thinking.',
      reflection: 'If fear and other people\u2019s expectations became silent, what would you choose?',
      action: 'Name three possible paths. Choose one small, reversible experiment that gives you real information.'
    },
    reset: {
      title: 'The Reset in Motion',
      summary: 'Your awareness is becoming readiness. The next step is to give your change enough structure to become real\u2014without trying to change everything at once.',
      reflection: 'What single change would make the rest of your life easier to reorganize?',
      action: 'Create a 30-day commitment: one thing to start, one to stop and one to continue.'
    },
    expansion: {
      title: 'The Expansion',
      summary: 'Your foundation is relatively aligned. Your next chapter is asking for greater freedom, meaning or contribution\u2014not simply more responsibility.',
      reflection: 'What wants to grow through you now?',
      action: 'Choose one meaningful expansion and one obligation you will decline to protect space for it.'
    }
  };

  let state = { phase: 'intro', step: 0, answers: {}, emailOpen: false };
  const score = value => (Number(value) - 1) * 25;
  const reverse = value => 100 - score(value);
  const average = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function calculate() {
    const a = state.answers;
    const scores = [score(a.q2), score(a.q3), average([reverse(a.q4), score(a.q5)]), score(a.q6)];
    const overall = average(scores);
    let profile = 'expansion';
    if (overall < 35) profile = 'wakeup';
    else if (overall < 58) profile = 'crossroads';
    else if (overall < 78) profile = 'reset';
    return { scores, profile };
  }

  function focusHeading() {
    requestAnimationFrame(() => root.querySelector('[data-audit-heading]')?.focus({ preventScroll: true }));
  }

  function renderIntro() {
    root.innerHTML = `<div class="audit-panel audit-intro">
      <span class="micro">THE CROSSROADS AUDIT</span>
      <h3 data-audit-heading tabindex="-1">Where are you now\u2014and what is asking to change?</h3>
      <p>A short private reflection across alignment, clarity, freedom and readiness. Your answers remain in this page unless you choose to request your report.</p>
      <button class="audit-primary" type="button" data-audit-action="start">Begin the audit</button>
      <small>6 questions \u00b7 About 60\u201390 seconds</small>
    </div>`;
  }

  function renderQuestion() {
    const index = state.step;
    const id = `q${index + 1}`;
    const choices = index === 0 ? domains.map(([, label]) => label) : scale;
    const values = index === 0 ? domains.map(([value]) => value) : [1, 2, 3, 4, 5];
    const selected = state.answers[id];
    const progress = Math.round(((index + 1) / questions.length) * 100);
    root.innerHTML = `<div class="audit-panel audit-question">
      <div class="audit-progress-copy"><span>Question ${index + 1} of ${questions.length}</span><span>${progress}%</span></div>
      <div class="audit-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${questions.length}" aria-valuenow="${index + 1}" aria-label="Question ${index + 1} of ${questions.length}"><span style="width:${progress}%"></span></div>
      <h3 id="audit-question-title" data-audit-heading tabindex="-1">${questions[index]}</h3>
      <div class="audit-options" role="radiogroup" aria-labelledby="audit-question-title">
        ${choices.map((label, choiceIndex) => `<button type="button" class="audit-option${String(selected) === String(values[choiceIndex]) ? ' is-selected' : ''}" role="radio" aria-checked="${String(selected) === String(values[choiceIndex])}" data-audit-answer="${values[choiceIndex]}"><span class="audit-option-marker">${index === 0 ? String(choiceIndex + 1).padStart(2, '0') : choiceIndex + 1}</span><span>${label}</span></button>`).join('')}
      </div>
      <div class="audit-controls"><button type="button" class="audit-secondary" data-audit-action="back">Back</button><button type="button" class="audit-text-button" data-audit-action="restart">Start again</button></div>
    </div>`;
    focusHeading();
  }

  function renderResult() {
    const result = calculate();
    const profile = profiles[result.profile];
    const domain = domains.find(([value]) => value === state.answers.q1)?.[1] || domains[6][1];
    if (state.emailOpen) return renderContact(result);
    root.innerHTML = `<div class="audit-panel audit-result">
      <span class="micro">YOUR CROSSROADS RESULT</span>
      <p class="audit-result-label">Your current stage</p>
      <h3 data-audit-heading tabindex="-1">${profile.title}</h3>
      <p class="audit-result-summary">${profile.summary}</p>
      <p class="audit-domain"><span>This appears most strongly in</span><strong>${domain}</strong></p>
      <div class="audit-scores">${result.scores.map((value, index) => `<div class="audit-score"><div><span>${dimensions[index]}</span><strong>${value}%</strong></div><div class="audit-score-bar" aria-label="${dimensions[index]} ${value}%"><span style="width:${value}%"></span></div></div>`).join('')}</div>
      <div class="audit-result-guidance"><div><span class="micro">A QUESTION TO SIT WITH</span><p>${profile.reflection}</p></div><div><span class="micro">YOUR NEXT SEVEN DAYS</span><p>${profile.action}</p></div></div>
      <div class="audit-result-actions"><button type="button" class="audit-primary" data-audit-action="email">Email my full report</button><a class="audit-secondary" href="#connect">Explore a conversation</a></div>
      <button type="button" class="audit-text-button" data-audit-action="restart">Start again</button>
      <small class="audit-disclaimer">This reflection is not a medical or psychological assessment.</small>
    </div>`;
    focusHeading();
  }

  function renderContact(result) {
    root.innerHTML = `<form class="audit-panel audit-contact" id="audit-result-form">
      <span class="micro">${profiles[result.profile].title}</span>
      <h3 data-audit-heading tabindex="-1">Where should we send your report?</h3>
      <label for="audit-name">First name</label><input id="audit-name" name="firstName" autocomplete="given-name" required>
      <label for="audit-email">Email address</label><input id="audit-email" name="email" type="email" autocomplete="email" required>
      <label class="audit-consent"><input name="deliveryConsent" type="checkbox" required><span>Send my personalized result and process my answers according to the Privacy Policy.</span></label>
      <label class="audit-consent"><input name="marketingConsent" type="checkbox"><span>Yes, I would also like thoughtful follow-up emails from Serge. I can unsubscribe at any time.</span></label>
      <input type="hidden" name="profile" value="${escapeHtml(result.profile)}"><input type="hidden" name="primaryArea" value="${escapeHtml(state.answers.q1)}">
      <div class="audit-result-actions"><button class="audit-primary" type="submit">Send my report</button><button class="audit-secondary" type="button" data-audit-action="close-email">Back to my result</button></div>
      <p class="form-status" id="audit-form-status" role="status" aria-live="polite"></p>
      <small class="audit-disclaimer">Secure email and CRM delivery will be connected before launch.</small>
    </form>`;
    focusHeading();
  }

  function render() {
    if (state.phase === 'questions') renderQuestion();
    else if (state.phase === 'result') renderResult();
    else renderIntro();
  }

  root.addEventListener('click', event => {
    const answer = event.target.closest('[data-audit-answer]');
    if (answer) {
      state.answers[`q${state.step + 1}`] = state.step === 0 ? answer.dataset.auditAnswer : Number(answer.dataset.auditAnswer);
      if (state.step < questions.length - 1) state.step += 1;
      else state.phase = 'result';
      render();
      return;
    }
    const control = event.target.closest('[data-audit-action]');
    if (!control) return;
    const action = control.dataset.auditAction;
    if (action === 'start') { state.phase = 'questions'; state.step = 0; }
    if (action === 'back') { if (state.step > 0) state.step -= 1; else state.phase = 'intro'; }
    if (action === 'restart') state = { phase: 'intro', step: 0, answers: {}, emailOpen: false };
    if (action === 'email') state.emailOpen = true;
    if (action === 'close-email') state.emailOpen = false;
    render();
  });

  root.addEventListener('submit', event => {
    if (event.target.id !== 'audit-result-form') return;
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    document.getElementById('audit-form-status').textContent = 'Preview only: your result has not been sent or stored. Secure delivery will be activated before launch.';
  });

  render();
})();
