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

  // Create a simple index page listing all artifacts
  const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tools</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-900 text-white p-8">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Tools</h1>
    <ul class="space-y-3">
      ${artifactFiles.map(file => {
        const name = file.replace(/\.(js|jsx|ts|tsx)$/, '');
        return `<li><a href="/${name}/" class="text-amber-400 hover:text-amber-300 underline">${name}</a></li>`;
      }).join('\n      ')}
    </ul>
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
