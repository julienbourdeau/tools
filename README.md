# Claude Artifacts Hosting

A simple Cloudflare Pages project to host Claude artifacts. Each JavaScript file in the `artifacts/` folder becomes a standalone app accessible at its own URL path.

## How It Works

- **`artifacts/`** - Drop your Claude artifact JS files here
- **`functions/`** - Cloudflare Pages Functions that handle routing
- **`public/`** - Generated output directory (created by build script)

### URL Routing

| File | URL |
|------|-----|
| `artifacts/my-app.js` | `domain.com/my-app` |
| `artifacts/counter-app.js` | `domain.com/counter-app` |
| `artifacts/example-app.js` | `domain.com/example-app` |

The home page (`domain.com/`) automatically lists all available apps.

## Adding a New App

1. Create a new `.js` file in the `artifacts/` folder
2. Name it with the URL slug you want (e.g., `my-cool-app.js` → `/my-cool-app`)
3. The build process will automatically pick it up

### Example Artifact

```javascript
// artifacts/hello-world.js
const app = document.createElement('div');
app.innerHTML = `
  <h1>Hello World</h1>
  <p>This is a Claude artifact!</p>
`;
document.body.appendChild(app);
```

## Deployment

### Cloudflare Pages Setup

1. Connect your GitHub repository to Cloudflare Pages
2. Set the following build configuration:
   - **Build command:** `sh build.sh`
   - **Build output directory:** `public`
3. Deploy!

### Local Development

To test locally with Wrangler:

```bash
# Install wrangler
npm install -g wrangler

# Run the build
sh build.sh

# Start local dev server
wrangler pages dev public --binding ASSETS=public
```

## Project Structure

```
.
├── artifacts/           # Your Claude artifact JS files
│   ├── counter-app.js
│   └── example-app.js
├── functions/           # Cloudflare Pages Functions
│   ├── index.js         # Home page (lists all apps)
│   ├── [slug].js        # Dynamic route (serves individual apps)
│   └── api/
│       └── apps.js      # API endpoint for app list
├── public/              # Build output (generated)
├── build.sh             # Build script
└── README.md
```

## Requirements

- Cloudflare Pages (free tier works!)
- No Node.js, npm, or other build tools required - just shell scripts

## Security Note

The JavaScript files in the `artifacts/` folder are executed directly in the browser. Only add trusted code to this folder - these files are treated as first-party scripts and have full access to the page. File names must contain only alphanumeric characters, hyphens, and underscores.