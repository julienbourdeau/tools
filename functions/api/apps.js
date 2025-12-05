// API endpoint to list all available apps
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // Try to fetch the manifest file that contains the list of apps
    // This manifest is generated at build time
    const manifestUrl = new URL('/artifacts-manifest.json', context.request.url);
    const manifestResponse = await env.ASSETS.fetch(manifestUrl);
    
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      return new Response(JSON.stringify(manifest.apps), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
    
    // If manifest doesn't exist, return empty array
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
