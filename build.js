const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = './artifacts';
const OUTPUT_DIR = './public';
const watchMode = process.argv.includes('--watch');

// HTML template for each artifact
function generateHTML(artifactName, bundleFileName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artifactName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script src="${bundleFileName}"></script>
</body>
</html>`;
}

async function build() {
  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get all artifact files
  const artifactFiles = fs.readdirSync(ARTIFACTS_DIR)
    .filter(file => /\.(js|jsx|ts|tsx)$/.test(file));

  if (artifactFiles.length === 0) {
    console.log('No artifacts found in', ARTIFACTS_DIR);
    return;
  }

  console.log(`Found ${artifactFiles.length} artifact(s):`);

  for (const file of artifactFiles) {
    const artifactName = file.replace(/\.(js|jsx|ts|tsx)$/, '');
    const inputPath = path.join(ARTIFACTS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, artifactName);
    const bundleFileName = 'bundle.js';

    console.log(`  Building: ${artifactName}`);

    // Create output directory for this artifact
    fs.mkdirSync(outputPath, { recursive: true });

    // Create a wrapper that imports the artifact and renders it
    const wrapperCode = `
import { createRoot } from 'react-dom/client';
import Component from '${path.resolve(inputPath)}';

const root = createRoot(document.getElementById('root'));
root.render(<Component />);
`;

    // Bundle with esbuild - bundle everything including React
    await esbuild.build({
      stdin: {
        contents: wrapperCode,
        resolveDir: process.cwd(),
        loader: 'tsx',
      },
      bundle: true,
      outfile: path.join(outputPath, bundleFileName),
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
      },
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      minify: true,
    });

    // Generate HTML file
    const htmlContent = generateHTML(artifactName, bundleFileName);
    fs.writeFileSync(path.join(outputPath, 'index.html'), htmlContent);

    console.log(`    -> ${outputPath}/index.html`);
  }

  // Create a retro NES-style index page listing all artifacts
  const toolsList = artifactFiles.map(file => {
    const name = file.replace(/\.(js|jsx|ts|tsx)$/, '');
    const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `<a href="/${name}/"><button type="button" class="nes-btn is-primary">${displayName}</button></a>`;
  }).join('\n          ');

  const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tools Dungeon</title>
  <link href="https://unpkg.com/nes.css@latest/css/nes.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    html, body, pre, code, kbd, samp {
      font-family: "Press Start 2P", cursive;
    }
    body {
      background-color: #212529;
      color: #fff;
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
    }
    .nes-container {
      background-color: #212529;
      color: #fff;
    }
    .nes-container.is-dark {
      background-color: #212529;
    }
    .title {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .title h1 {
      color: #92cc41;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #888;
      font-size: 0.6rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    .intro-text {
      font-size: 0.7rem;
      line-height: 1.8;
      margin-bottom: 2rem;
      color: #ccc;
    }
    .tools-section {
      margin-top: 2rem;
    }
    .tools-section h2 {
      font-size: 0.8rem;
      color: #f7d51d;
      margin-bottom: 1rem;
    }
    .tools-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .tools-list a {
      text-decoration: none;
    }
    .tools-list .nes-btn {
      width: 100%;
      font-size: 0.7rem;
    }
    .footer {
      margin-top: 3rem;
      text-align: center;
      font-size: 0.5rem;
      color: #666;
    }
    .blink {
      animation: blink 1s steps(1) infinite;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
    .hearts {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin: 1.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="nes-container is-dark with-title">
      <h3 class="title" style="color: #fff; background-color: #212529;">Welcome, Hero!</h3>

      <div class="title">
        <h1>TOOLS DUNGEON</h1>
      </div>

      <p class="subtitle">~ A collection of legendary utilities ~</p>

      <div class="hearts">
        <i class="nes-icon is-medium heart"></i>
        <i class="nes-icon is-medium heart"></i>
        <i class="nes-icon is-medium heart"></i>
      </div>

      <p class="intro-text">
        You have entered the TOOLS DUNGEON.<br><br>
        Here lie powerful artifacts forged in the fires of code.<br><br>
        Choose your weapon wisely...<span class="blink">_</span>
      </p>

      <div class="tools-section">
        <h2><i class="nes-icon trophy is-small"></i> Available Quests</h2>
        <div class="tools-list">
          ${toolsList}
        </div>
      </div>

      <p class="footer">
        <i class="nes-icon coin is-small"></i>
        PRESS START TO CONTINUE
        <i class="nes-icon coin is-small"></i>
      </p>
    </section>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHTML);
  console.log(`\nCreated index page at ${OUTPUT_DIR}/index.html`);
  console.log('Build complete!');
}

async function watch() {
  console.log('Watching for changes in', ARTIFACTS_DIR);

  // Initial build
  await build();

  // Watch for changes
  let debounceTimer = null;
  fs.watch(ARTIFACTS_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename || !/\.(js|jsx|ts|tsx)$/.test(filename)) return;

    // Debounce rapid changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected: ${filename}`);
      try {
        await build();
      } catch (err) {
        console.error('Build failed:', err.message);
      }
    }, 100);
  });

  console.log('Press Ctrl+C to stop watching.\n');
}

if (watchMode) {
  watch().catch(err => {
    console.error('Watch failed:', err);
    process.exit(1);
  });
} else {
  build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
