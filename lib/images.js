'use strict';
const fs = require('fs');
const path = require('path');
const IMAGE = /\.(?:png|jpe?g|gif|webp|svg)$/i;
const indexes = new Map();

function clearImageCache() { indexes.clear(); }

function publishedImages(root) {
  if (indexes.has(root)) return indexes.get(root);
  const files = new Set();
  const basenames = new Map();
  function walk(directory, prefix = '') {
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
      const relative = prefix + entry.name;
      // Do not follow symlinks outside the published image directory.
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative + '/');
      else if (entry.isFile() && IMAGE.test(entry.name)) {
        files.add(relative);
        const matches = basenames.get(entry.name) || [];
        matches.push(relative);
        basenames.set(entry.name, matches);
      }
    }
  }
  walk(root);
  const index = { files, basenames };
  indexes.set(root, index);
  return index;
}

function installImages(md, context = {}) {
  const root = context.pluginDir
    ? path.resolve(context.pluginDir, '../../site/img/user')
    : path.resolve('src/site/img/user');
  function resolve(target) {
    let name;
    try { name = decodeURIComponent(target.trim()); } catch { return null; }
    name = name.replace(/^\/img\/user\//, '').replace(/^\.\//, '');
    if (!name || name.startsWith('/') || /[\\\0]/.test(name) ||
        name.split('/').some(p => p === '..' || p === '.') || !IMAGE.test(name)) return null;
    const { files, basenames } = publishedImages(root);
    let relative = files.has(name) ? name : null;
    if (!relative && !name.includes('/')) {
      const matches = basenames.get(name) || [];
      // Duplicate filenames require an explicit vault-relative path.
      if (matches.length === 1) relative = matches[0];
    }
    return relative ? '/img/user/' + relative.split('/').map(encodeURIComponent).join('/') : null;
  }
  const escape = md.utils.escapeHtml;
  const missing = target => '<span class="bqb-image-missing" role="note">Imagen no publicada o ambigua: ' +
    escape(target) + '. Añádela a quiz-images en las propiedades de la nota y vuelve a publicar; si el nombre se repite, usa su ruta completa.</span>';

  md.inline.ruler.before('image', 'bqb_wiki_image', (state, silent) => {
    if (!state.src.startsWith('![[', state.pos)) return false;
    const end = state.src.indexOf(']]', state.pos + 3);
    if (end < 0) return false;
    const parts = state.src.slice(state.pos + 3, end).split(/\\?\|/);
    const target = parts.shift().trim();
    if (!IMAGE.test(target)) return false;
    if (!silent) {
      const src = resolve(target);
      if (!src) {
        const token = state.push('bqb_missing_image', '', 0);
        token.content = target;
      } else {
        let dimensions = null;
        if (parts.length && /^\d+(?:x\d+)?$/.test(parts[parts.length - 1])) dimensions = parts.pop().split('x');
        const token = state.push('image', 'img', 0);
        token.content = parts.join(' | ') || path.posix.basename(target);
        token.children = [];
        const alt = new state.Token('text', '', 0);
        alt.content = token.content;
        token.children.push(alt);
        token.attrs = [['src', src], ['alt', ''], ['loading', 'lazy']];
        if (dimensions) {
          const [width, height] = dimensions.map(Number);
          if (width > 0 && width <= 10000) token.attrSet('width', String(width));
          if (height > 0 && height <= 10000) token.attrSet('height', String(height));
        }
      }
    }
    state.pos = end + 2;
    return true;
  });
  md.renderer.rules.bqb_missing_image = (tokens, idx) => missing(tokens[idx].content);
  const originalImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet('src') || '';
    // Normal Markdown images in quiz fences also bypass the vault exporter.
    if (!/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(src) || src.startsWith('/img/user/')) {
      const published = resolve(src);
      if (!published) return missing(src);
      token.attrSet('src', published);
    }
    token.attrSet('loading', 'lazy');
    return originalImage(tokens, idx, options, env, self);
  };
}

module.exports = { installImages, clearImageCache };
