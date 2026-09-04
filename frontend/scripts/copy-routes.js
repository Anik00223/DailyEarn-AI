import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('index.html not found in dist directory');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

// SPA route directories to create physical index.html copies for static hosts
const routes = ['register', 'login', 'dashboard', 'analytics'];

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent, 'utf8');
}

// Also create 404.html and 200.html for static site fallbacks (Render, Netlify, Surge)
fs.writeFileSync(path.join(distDir, '404.html'), indexContent, 'utf8');
fs.writeFileSync(path.join(distDir, '200.html'), indexContent, 'utf8');

console.log('✅ Generated static route fallbacks for SPA (/register, /login, /dashboard, /analytics, 404.html)');
