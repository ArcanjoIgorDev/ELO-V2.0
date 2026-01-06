import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("CRITICAL ERROR DURING MOUNT:", error);
  document.body.innerHTML = `<div style="color:white; padding:20px; font-family:sans-serif;">
    <h1>Erro Fatal</h1>
    <p>Ocorreu um erro ao carregar a aplicação. Por favor, recarregue a página.</p>
    <pre style="color:red; background:#111; padding:10px; border-radius:5px; overflow:auto;">${error instanceof Error ? error.message : String(error)}</pre>
  </div>`;
}