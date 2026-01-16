import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global error handler for catching deployment-specific issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error caught:", message, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === "") {
    root.innerHTML = `<div style="padding: 40px; text-align: center; font-family: sans-serif;">
      <h2 style="color: #78350F;">Oops! Something went wrong.</h2>
      <p style="color: #64748b;">${message}</p>
      <button onclick="window.location.reload()" style="background: #D97706; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px;">Retry</button>
    </div>`;
  }
};

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Application Render Error:", error);
    container.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h3>Failed to load application</h3>
      <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>`;
  }
} else {
  console.error("Critical Error: Root element #root not found in index.html");
}