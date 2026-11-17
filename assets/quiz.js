(() => {
  'use strict';
  function init() {
    const orders = new Map();
    document.querySelectorAll('.bqb:not([data-ready])').forEach((box, quizIndex) => {
      box.dataset.ready = 'true';
      const list = box.querySelector('.bqb-options');
      const original = Array.from(list.children);
      const mode = box.dataset.mode;
      const correctCount = original.filter(r => r.dataset.correct === 'true').length;
      const multi = mode === 'non-immediate' && correctCount > 1;
      let order = orders.get(box.dataset.key);
      if (!order || order.length !== original.length) {
        order = original.map((_, i) => i);
        if (mode !== 'static' && box.dataset.shuffle === 'true') {
          for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
          }
        }
        orders.set(box.dataset.key, order);
      }
      order.forEach(i => list.append(original[i]));
      const rows = Array.from(list.children);
      const inputs = rows.map(r => r.querySelector('input'));
      const status = box.querySelector('.bqb-status');
      const hint = box.querySelector('.bqb-hint');
      const actions = box.querySelector('.bqb-actions');
      const submit = box.querySelector('.bqb-submit');
      let locked = false;
      box.querySelector('.bqb-instruction').textContent = mode === 'static' ? 'Answer key' : multi ? 'Select all correct answers.' : 'Select one answer.';
      rows.forEach((row, i) => {
        const label = box.dataset.number === 'none' ? '' : box.dataset.number === '123' ? String(i + 1) : i < 26 ? String.fromCharCode(65 + i) : String(i + 1);
        row.querySelector('.bqb-number').textContent = label;
        inputs[i].type = multi ? 'checkbox' : 'radio';
        inputs[i].name = 'bqb-' + quizIndex;
        inputs[i].disabled = mode === 'static';
      });
      function paint(reveal) {
        rows.forEach((row, i) => {
          const correct = row.dataset.correct === 'true';
          row.classList.toggle('bqb-selected', inputs[i].checked);
          row.classList.toggle('bqb-correct', reveal && correct);
          row.classList.toggle('bqb-wrong', reveal && inputs[i].checked && !correct);
          row.querySelector('.bqb-mark').textContent = reveal && correct ? '✓' : reveal && inputs[i].checked ? '✗' : '';
        });
      }
      function grade() {
        const ok = mode === 'immediate' ? inputs.some((input, i) => input.checked && rows[i].dataset.correct === 'true') : inputs.every((input, i) => input.checked === (rows[i].dataset.correct === 'true'));
        status.textContent = ok ? 'Correct!' : 'Incorrect. Correct answers are marked ✓.';
        if (mode === 'non-immediate') {
          locked = true;
          inputs.forEach(input => { input.disabled = true; });
          submit.hidden = true;
        }
        if (hint) hint.hidden = false;
        paint(true);
      }
      inputs.forEach(input => input.addEventListener('change', () => {
        if (locked) return;
        if (mode === 'immediate') grade();
        else { paint(false); submit.disabled = !inputs.some(i => i.checked); }
      }));
      submit.addEventListener('click', () => { if (inputs.some(i => i.checked) && !locked) grade(); });
      box.querySelector('.bqb-reset').addEventListener('click', () => {
        locked = false;
        inputs.forEach(input => { input.checked = false; input.disabled = false; });
        status.textContent = '';
        if (hint) hint.hidden = true;
        submit.hidden = mode !== 'non-immediate' || box.dataset.submit === 'false';
        submit.disabled = true;
        paint(false);
        inputs[0].focus();
      });
      actions.hidden = mode === 'static';
      submit.hidden = mode !== 'non-immediate' || box.dataset.submit === 'false';
      submit.disabled = true;
      if (mode === 'static' && hint) hint.hidden = false;
      paint(mode === 'static');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('nav', init);
})();
