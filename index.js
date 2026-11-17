"use strict";
const { parseQuiz } = require('./lib/parse');

module.exports = {
  setupMarkdown(md, context = {}) {
    const settings = context.settings || {};
    // Only hex literals enter CSS: invalid settings fall back to the theme.
    const colorProperties = {"backgroundColor": "background", "textColor": "text", "borderColor": "border", "accentColor": "accent", "selectedColor": "selected", "correctColor": "correct", "correctBackgroundColor": "correct-background", "incorrectColor": "incorrect", "incorrectBackgroundColor": "incorrect-background", "buttonColor": "button", "buttonTextColor": "button-text"};
    const palette = Object.entries(colorProperties).flatMap(([key, property]) => {
      const value = typeof settings[key] === 'string' ? settings[key].trim() : '';
      return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
        ? ['--bqb-' + property + ':' + value] : [];
    }).join(';');
    // Separate renderer prevents nested quiz recursion and disallows raw HTML.
    const safe = require('markdown-it')({ html: false, linkify: true });
    safe.use(require('markdown-it-mathjax3'));
    const esc = md.utils.escapeHtml;
    const previous = md.renderer.rules.fence;
    const isQuiz = token => token.type === 'fence' && token.info.trim() === 'quiz';
    md.renderer.rules.fence = function(tokens, idx, options, env, self) {
      if (!isQuiz(tokens[idx])) return previous ? previous(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
      try {
        let data = parseQuiz(tokens[idx].content);
        const local = data.attrs;
        if (local.binding) {
          const matches = tokens.filter(isQuiz).map(t => parseQuiz(t.content))
            .filter(q => q.attrs.id && q.attrs.id.toLowerCase() === local.binding.target);
          if (matches.length !== 1 || matches[0].attrs.binding) {
            return '<p class="bqb-error">Quiz reference unavailable: ' + esc(local.binding.target) + ' (use one original question on this page).</p>';
          }
          data = matches[0];
        }
        const attrs = { ...data.attrs };
        for (const key of ['mode', 'shuffle', 'number', 'submit', 'reset']) {
          if (local[key] !== null) attrs[key] = local[key];
        }
        const mode = local.binding?.type === 'bind' ? 'static' :
          (['static','immediate','non-immediate'].includes(attrs.mode || settings.mode) ? (attrs.mode || settings.mode) : 'non-immediate');
        const number = ['abc','123','none'].includes(attrs.number || settings.number) ? (attrs.number || settings.number) : 'abc';
        const shuffle = attrs.shuffle ?? (typeof settings.shuffle === 'boolean' ? settings.shuffle : true);
        const submit = attrs.submit ?? (typeof settings.submit === 'boolean' ? settings.submit : true);
        if (data.options.length < 2 || !data.options.some(o => o.state === 'c')) {
          return '<p class="bqb-error">Quiz needs at least two options and one [c] correct answer.</p>';
        }
        const key = data.attrs.id || 'block-' + (tokens[idx].map || [idx])[0];
        const rows = data.options.map(o => '<div class="bqb-option" data-correct="' + (o.state === 'c') + '"><label><input type="checkbox"><span class="bqb-number" aria-hidden="true"></span><span class="bqb-text">' + safe.render(o.text) + '</span><span class="bqb-mark" aria-hidden="true"></span></label></div>').join('');
        return '<section class="bqb" style="' + esc(palette) + '" aria-label="Quiz" data-mode="' + mode + '" data-number="' + number + '" data-shuffle="' + shuffle + '" data-submit="' + submit + '" data-key="' + esc(key) + '">' +
          (local.stem === false ? '' : '<div class="bqb-question">' + safe.render(data.question) + '</div>') +
          '<p class="bqb-instruction"></p><div class="bqb-options">' + rows + '</div>' +
          (data.details ? '<div class="bqb-hint" hidden>' + safe.render(data.details) + '</div>' : '') +
          '<p class="bqb-status" role="status" aria-live="polite"></p><div class="bqb-actions" hidden><button type="button" class="bqb-submit">Check answer</button><button type="button" class="bqb-reset">Reset</button></div>' +
          '<noscript>JavaScript is required to answer this quiz. Correct options are marked below.</noscript></section>\n';
      } catch (error) {
        console.warn('[better-quizbox] Could not render quiz:', error.message);
        return '<p class="bqb-error">This quiz could not be rendered. Check its syntax.</p>';
      }
    };
  }
};
