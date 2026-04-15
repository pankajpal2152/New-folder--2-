import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ==========================================
// APPLICATION ENTRY POINT
// ==========================================
// This file initializes React and mounts it to the 'root' div inside your public index.html.

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  // StrictMode enables additional checks and warnings in development mode.
  // It is highly recommended for enterprise apps to catch hidden bugs early.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);