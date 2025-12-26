import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, rmSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { marked } from 'marked';

const POSTS_DIR = 'posts';
const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return { meta: {}, body: content };

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) return { meta: {}, body: content };

  const meta = {};
  for (let i = 1; i < endIndex; i++) {
    const colonIdx = lines[i].indexOf(':');
    if (colonIdx !== -1) {
      const key = lines[i].slice(0, colonIdx).trim();
      const value = lines[i].slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }

  const body = lines.slice(endIndex + 1).join('\n').trim();
  return { meta, body };
}

function extractDescription(body) {
  // Get first paragraph as description, strip markdown
  const firstPara = body.split('\n\n')[0] || '';
  return firstPara
    .replace(/[#*_`\[\]]/g, '')  // Remove markdown syntax
    .replace(/\(.*?\)/g, '')      // Remove link URLs
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim()
    .slice(0, 160);               // Limit to 160 chars
}

function buildPost(filepath, template) {
  const content = readFileSync(filepath, 'utf-8');
  const { meta, body } = parseFrontmatter(content);
  const html = marked(body);

  const slug = basename(filepath, '.md');
  const url = `/posts/${slug}/`;
  const description = meta.description || extractDescription(body);

  const page = template
    .replace(/\{\{title\}\}/g, meta.title || slug)
    .replace(/\{\{date\}\}/g, meta.date || '')
    .replace(/\{\{description\}\}/g, description)
    .replace(/\{\{url\}\}/g, url)
    .replace(/\{\{content\}\}/g, html);

  return { slug, meta, html: page };
}

function buildIndex(posts, template) {
  const sorted = [...posts].sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));

  const list = sorted
    .map(p => `<li><a href="posts/${p.slug}/">${p.meta.title || p.slug}</a> <time>${p.meta.date || ''}</time></li>`)
    .join('\n');

  const content = `<ul class="post-list">\n${list}\n</ul>`;

  return template
    .replace(/\{\{title\}\}/g, 'Blog')
    .replace(/\{\{date\}\}/g, '')
    .replace(/\{\{description\}\}/g, 'Personal blog of Kamil Tomšík - software engineering, web development, and more.')
    .replace(/\{\{url\}\}/g, '/')
    .replace(/\{\{content\}\}/g, content);
}

// Clean dist
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true });
}
mkdirSync(DIST_DIR);
mkdirSync(join(DIST_DIR, 'posts'));

// Copy public assets
if (existsSync(PUBLIC_DIR)) {
  cpSync(PUBLIC_DIR, DIST_DIR, { recursive: true });
}

// Load template
const template = readFileSync('template.html', 'utf-8');

// Build posts
const posts = [];
if (existsSync(POSTS_DIR)) {
  for (const file of readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const post = buildPost(join(POSTS_DIR, file), template);
    mkdirSync(join(DIST_DIR, 'posts', post.slug), { recursive: true });
    writeFileSync(join(DIST_DIR, 'posts', post.slug, 'index.html'), post.html);
    posts.push(post);
    console.log(`Built: ${post.slug}`);
  }
}

// Build index
const indexHtml = buildIndex(posts, template);
writeFileSync(join(DIST_DIR, 'index.html'), indexHtml);
console.log(`Built: index (${posts.length} posts)`);

// Build sitemap
const SITE_URL = 'https://tomsik.cz';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${posts.map(p => `  <url>
    <loc>${SITE_URL}/posts/${p.slug}/</loc>
    ${p.meta.date ? `<lastmod>${p.meta.date}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
writeFileSync(join(DIST_DIR, 'sitemap.xml'), sitemap);
console.log('Built: sitemap.xml');
