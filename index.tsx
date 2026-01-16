import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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
    container.innerHTML = `<div style="padding: 20px; color: red;">Failed to load Honeybees Daycare app. Please check the console for details.</div>`;
  }
} else {
  console.error("Critical Error: Root element #root not found in index.html");
}