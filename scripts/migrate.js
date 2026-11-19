/**
 * Migração única: organiza o conteúdo legado do Bahamaflix.
 *
 * - HTMLs antigos  -> archive/
 * - Imagens        -> media/ (mantendo as subpastas originais)
 * - Scripts antigos-> archive/tools/
 * - Arquivos de verificação do Google e config de deploy ficam na raiz.
 *
 * Executar uma vez: node scripts/migrate.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_RE = /\.(jpe?g|png|webp|gif|svg|ico|mp4|woff2?)$/i;
const KEEP_FILES = /^(google[a-z0-9]+\.html|ads\.txt|netlify\.toml|README\.md|\.htaccess)$/i;
const SKIP_DIRS = new Set(['.git', 'archive', 'media', 'assets', 'data', 'scripts', '.vscode']);

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); }

function move(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    return true;
  }
  return false;
}

function walk(srcDir, archiveDir, mediaDir) {
  if (!fs.existsSync(srcDir)) return;
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, ent.name);
    if (ent.isDirectory()) {
      walk(src, path.join(archiveDir, ent.name), path.join(mediaDir, ent.name));
      try { fs.rmdirSync(src); } catch {}
    } else if (ent.isFile()) {
      const rel = path.relative(ROOT, src);
      if (IMAGE_RE.test(ent.name)) move(src, path.join(mediaDir, ent.name));
      else if (/\.html?$/i.test(ent.name)) move(src, path.join(archiveDir, ent.name));
      else move(src, path.join(archiveDir, 'tools', ent.name));
    }
  }
}

ensure(path.join(ROOT, 'archive'));
ensure(path.join(ROOT, 'media'));
ensure(path.join(ROOT, 'assets', 'css'));
ensure(path.join(ROOT, 'assets', 'js'));
ensure(path.join(ROOT, 'data'));

for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (SKIP_DIRS.has(ent.name)) continue;
  const src = path.join(ROOT, ent.name);
  if (ent.isDirectory()) {
    walk(src, path.join(ROOT, 'archive', ent.name), path.join(ROOT, 'media', ent.name));
    try { fs.rmdirSync(src); } catch {}
  } else if (ent.isFile() && !KEEP_FILES.test(ent.name)) {
    if (IMAGE_RE.test(ent.name)) move(src, path.join(ROOT, 'media', ent.name));
    else if (/\.html?$/i.test(ent.name)) move(src, path.join(ROOT, 'archive', ent.name));
    else move(src, path.join(ROOT, 'archive', 'tools', ent.name));
  }
}

const count = (dir) => {
  let n = 0;
  const walk2 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk2(p); else n++;
    }
  };
  if (fs.existsSync(dir)) walk2(dir);
  return n;
};
console.log('Arquivos em archive/:', count(path.join(ROOT, 'archive')));
console.log('Arquivos em media/ :', count(path.join(ROOT, 'media')));
console.log('Migração concluída.');
