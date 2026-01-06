import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:white;padding:20px">Fatal Error: Root element not found.</div>';
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to mount application:", error);
  rootElement.innerHTML = `<div style="color:#e2e8f0; background-color:#020617; height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; font-family:sans-serif;">
    <h1 style="font-size:1.5rem; font-weight:bold; margin-bottom:1rem;">Erro ao iniciar</h1>
    <p style="opacity:0.8">Tente recarregar a página.</p>
  </div>`;
}