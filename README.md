# Tools

Builds Claude artifacts (React components) into standalone static pages.

https://tools.julienbourdeau.com/

## How It Works

1. Place React components (`.tsx`, `.jsx`, `.ts`, `.js`) in `./artifacts/`
2. Run `npm run build`
3. Each artifact becomes a standalone page in `./public/<artifact-name>/`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Builds all artifacts to `./public/` |
| `npm run watch` | Watches `./artifacts/` and rebuilds on changes |

## Deployment

Hosted on Cloudflare Pages: https://dash.cloudflare.com/669ef771a6c3f4e7ca7b031c8ca690e5/pages/view/tools

Build settings:
- Build command: `npm run build`
- Output directory: `public`
