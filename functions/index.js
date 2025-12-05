// Home page - Lists all available apps
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // In Cloudflare Pages, we can use the ASSETS binding to list files
    // But since we can't list directory contents directly,
    // we'll fetch the artifacts list from a manifest or scan at build time
    
    // For now, we'll generate the list dynamically by reading the artifacts folder
    // This is handled by the build process - see _worker.js approach below
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Artifacts</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1a1a2e;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .apps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .apps-list li {
      margin-bottom: 15px;
    }
    .apps-list a {
      display: block;
      padding: 20px 25px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
      border-radius: 12px;
      text-decoration: none;
      color: #333;
      font-weight: 500;
      font-size: 1.1em;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .apps-list a:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: translateX(10px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .arrow {
      float: right;
      opacity: 0.5;
    }
    .apps-list a:hover .arrow {
      opacity: 1;
    }
    .empty {
      text-align: center;
      color: #888;
      padding: 40px;
    }
    footer {
      text-align: center;
      margin-top: 30px;
      color: rgba(255,255,255,0.8);
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛠️ Claude Artifacts</h1>
    <p class="subtitle">A collection of tools and apps</p>
    <ul class="apps-list" id="apps-list">
      <li class="empty">Loading apps...</li>
    </ul>
  </div>
  <footer>
    Powered by Cloudflare Pages
  </footer>
  <script>
    // Fetch the list of apps from the API
    fetch('/api/apps')
      .then(r => r.json())
      .then(apps => {
        const list = document.getElementById('apps-list');
        if (apps.length === 0) {
          list.innerHTML = '<li class="empty">No apps available yet.</li>';
          return;
        }
        list.innerHTML = apps.map(app => 
          '<li><a href="/' + app.slug + '">' + app.name + '<span class="arrow">→</span></a></li>'
        ).join('');
      })
      .catch(err => {
        console.error('Failed to load apps:', err);
        document.getElementById('apps-list').innerHTML = 
          '<li class="empty">Failed to load apps. Please try again.</li>';
      });
  </script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    return new Response('Error loading home page: ' + error.message, { status: 500 });
  }
}
