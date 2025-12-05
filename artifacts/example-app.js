// Example Claude Artifact - Example App
// This is a sample JavaScript app that will be served at /example-app

const app = document.createElement('div');
app.innerHTML = `
  <h1>Example App</h1>
  <p>This is an example Claude artifact.</p>
  <p>Current time: ${new Date().toLocaleString()}</p>
`;
document.body.appendChild(app);
