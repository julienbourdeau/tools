// Dynamic route handler for serving individual apps
// The [slug] pattern matches any path like /example-app, /counter-app, etc.
export async function onRequest(context) {
  const { params, env, request } = context;
  const slug = params.slug;
  
  // Skip API routes and static assets
  if (slug === 'api' || slug.includes('.')) {
    return env.ASSETS.fetch(request);
  }
  
  try {
    // Fetch the corresponding artifact JS file
    const artifactUrl = new URL(`/artifacts/${slug}.js`, request.url);
    const artifactResponse = await env.ASSETS.fetch(artifactUrl);
    
    if (!artifactResponse.ok) {
      // Artifact not found - return 404 page
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Not Found</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      text-align: center;
      background: white;
      padding: 60px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #333; font-size: 3em; margin-bottom: 10px; }
    p { color: #666; font-size: 1.2em; }
    a { 
      display: inline-block;
      margin-top: 20px;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
    }
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>App "${slug}" not found</p>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>`;
      
      return new Response(html, {
        status: 404,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }
    
    const artifactCode = await artifactResponse.text();
    
    // Convert slug to display name (e.g., "counter-app" -> "Counter App")
    const appName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Create HTML page that loads and runs the artifact
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} | Claude Artifacts</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }
    .back-link {
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 10px 20px;
      background: rgba(0,0,0,0.1);
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      font-weight: 500;
      z-index: 1000;
      transition: background 0.3s;
    }
    .back-link:hover {
      background: rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <a href="/" class="back-link">← Back</a>
  <script>
${artifactCode}
  </script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response('Error loading app: ' + error.message, { status: 500 });
  }
}
