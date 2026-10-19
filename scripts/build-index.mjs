#!/usr/bin/env node
/**
 * public/ 안의 .html 파일(index.html 제외)을 스캔해서
 * public/index.html 갤러리를 생성한다. 의존성 없음 — 순수 Node.
 *
 * 각 페이지의 <title>, <meta name="description">, 수정시각을 뽑아
 * 카드로 나열하고, 간단한 검색 필터를 붙인다.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const OUT = join(PUBLIC_DIR, 'index.html');

const SITE_TITLE = 'supercat · 공유';
const SITE_SUBTITLE = '팀이 만든 HTML을 한 곳에서';

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) acc.push(full);
  }
  return acc;
}

function extract(html) {
  const pick = (re) => {
    const m = html.match(re);
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  };
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i);
  return { title, desc };
}

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (d) =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const files = walk(PUBLIC_DIR)
  .filter((f) => relative(PUBLIC_DIR, f) !== 'index.html')
  .map((f) => {
    const rel = relative(PUBLIC_DIR, f).split(sep).join('/');
    const { title, desc } = extract(readFileSync(f, 'utf8'));
    const name = rel.replace(/\.html$/i, '');
    return {
      href: './' + rel,
      path: '/' + name,
      title: title || name.split('/').pop(),
      desc,
      mtime: statSync(f).mtime,
    };
  })
  .sort((a, b) => b.mtime - a.mtime);

const cards = files
  .map(
    (f) => `
      <a class="card" href="${esc(f.href)}"
         data-search="${esc((f.title + ' ' + f.desc + ' ' + f.path).toLowerCase())}">
        <div class="card-title">${esc(f.title)}</div>
        ${f.desc ? `<div class="card-desc">${esc(f.desc)}</div>` : ''}
        <div class="card-meta"><span class="card-path">${esc(f.path)}</span><span>${fmtDate(f.mtime)}</span></div>
      </a>`
  )
  .join('');

const empty = `<div class="empty"><code>public/</code> 폴더에 <code>.html</code> 파일을 넣고 <code>git push</code> 하면 여기에 자동으로 나타나요.</div>`;

const page = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(SITE_TITLE)}</title>
<meta name="description" content="${esc(SITE_SUBTITLE)}">
<style>
  :root {
    --bg: #fafafa; --fg: #18181b; --muted: #71717a; --line: #e4e4e7;
    --card: #ffffff; --accent: #4f46e5; --chip: #f4f4f5;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0b0e; --fg: #f4f4f5; --muted: #a1a1aa; --line: #27272a;
      --card: #141418; --accent: #818cf8; --chip: #1c1c22;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: ui-sans-serif, system-ui, -apple-system, "Apple SD Gothic Neo", "Pretendard", sans-serif;
    line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 20px 80px; }
  header { margin-bottom: 28px; }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.01em; }
  .sub { color: var(--muted); font-size: 14px; margin: 0; }
  .search {
    margin-top: 20px; width: 100%; padding: 11px 14px; font-size: 15px;
    border: 1px solid var(--line); border-radius: 10px; background: var(--card); color: var(--fg);
  }
  .search:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
  .grid { margin-top: 20px; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .card {
    display: block; padding: 16px; border: 1px solid var(--line); border-radius: 12px;
    background: var(--card); text-decoration: none; color: inherit; transition: border-color .12s, transform .12s;
  }
  .card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .card-title { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }
  .card-desc { color: var(--muted); font-size: 13px; margin-top: 6px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-meta { margin-top: 12px; display: flex; justify-content: space-between; gap: 8px;
    color: var(--muted); font-size: 12px; }
  .card-path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--chip); padding: 1px 6px; border-radius: 5px; }
  .empty { margin-top: 28px; padding: 32px; text-align: center; color: var(--muted);
    border: 1px dashed var(--line); border-radius: 12px; font-size: 14px; }
  .empty code, .foot code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--chip); padding: 1px 6px; border-radius: 5px; }
  .foot { margin-top: 32px; color: var(--muted); font-size: 12px; }
  .nohit { display: none; margin-top: 24px; color: var(--muted); font-size: 14px; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(SITE_TITLE)}</h1>
      <p class="sub">${esc(SITE_SUBTITLE)}</p>
      ${files.length ? `<input class="search" type="search" placeholder="검색… (제목·설명·경로)" aria-label="검색">` : ''}
    </header>
    <main>
      ${files.length ? `<div class="grid">${cards}</div><p class="nohit">검색 결과가 없어요.</p>` : empty}
    </main>
    <p class="foot">총 ${files.length}개 · 생성 ${fmtDate(new Date())}</p>
  </div>
  <script>
    const q = document.querySelector('.search');
    if (q) {
      const cards = [...document.querySelectorAll('.card')];
      const nohit = document.querySelector('.nohit');
      q.addEventListener('input', () => {
        const v = q.value.trim().toLowerCase();
        let hits = 0;
        for (const c of cards) {
          const show = !v || c.dataset.search.includes(v);
          c.style.display = show ? '' : 'none';
          if (show) hits++;
        }
        nohit.style.display = hits ? 'none' : 'block';
      });
    }
  </script>
</body>
</html>
`;

writeFileSync(OUT, page);
console.log(`✓ index 생성 완료 — ${files.length}개 페이지`);
