# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build    # Generate static HTML in dist/
```

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys to GitHub Pages on push to `main` branch.

## Architecture

This is a custom static site generator for a personal blog (tomsik.cz), hosted on GitHub Pages.

**Core files:**
- `build.js` - Single-file SSG that converts markdown posts to HTML
- `template.html` - HTML template with `{{title}}`, `{{date}}`, and `{{content}}` placeholders
- `posts/*.md` - Blog posts with YAML frontmatter (title, date)

**Build process:**
1. Cleans and recreates `dist/`
2. Copies `public/` assets if present
3. Parses each markdown file's frontmatter and converts body with `marked`
4. Generates individual post pages and an index sorted by date

**Frontmatter format:**
```yaml
---
title: Post Title
date: 2024-01-15
---
```

Posts without frontmatter use the filename as title.
