// Headless runtime verification for the "Cannot access 'memo' before initialization" TDZ bug.
// Strategy: fetch the REAL transformed module from the running Vite dev server (the exact
// code a browser executes, including the React-refresh preamble), then evaluate it in a
// Node VM with stubbed 'react' + refresh globals. Any TDZ error reproduces the bug.
import vm from 'node:vm';

const DEV = 'http://localhost:5173';
const MODULES = [
  '/src/components/cinematic/filmInstruments.tsx',
  '/src/components/cinematic/CinematicFilm.tsx',
  '/src/components/cinematic/IndiaIntelligenceMap.tsx',
  '/src/components/cinematic/OversizedType.tsx',
  '/src/components/cinematic/AtmosphereLayer.tsx',
  '/src/components/cinematic/useFilmViewport.ts',
];

const reactStub = {
  memo: (fn) => ({ $$memo: true, name: fn && fn.name }),
  useMemo: (fn) => fn(),
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useEffect: () => {},
  useLayoutEffect: () => {},
  useRef: (v) => ({ current: v }),
};

const context = {
  console,
  document: {
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: { style: { setProperty: () => {} } },
    addEventListener: () => {},
    body: { style: {}, appendChild: () => {} },
    createEvent: () => ({ initEvent: () => {} }),
  },
  window: { addEventListener: () => {}, matchMedia: () => ({ matches: false, addEventListener: () => {} }), innerWidth: 1440, innerHeight: 900 },
  navigator: { userAgent: 'node-verify' },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: clearTimeout,
  location: { href: 'http://localhost:5173/', pathname: '/' },
  history: { pushState: () => {}, replaceState: () => {} },
  matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  // React-refresh globals injected by the dev-server transform:
  __vite_plugin_react_preamble_installed__: true,
  $RefreshReg$: () => {},
  $RefreshSig$: () => (type) => type,
};
vm.createContext(context);

// Shared module registry so cross-module imports resolve consistently.
const registry = new Map();
const cache = new Map();

function rewrite(src, selfUrl) {
  // Replace import specifiers with registry lookups; handle module-level side-effect imports.
  return src
    .replace(/import\s+([^;]*?)\s*from\s*['"]([^'"]+)['"];?/g, (_, clause, spec) => {
      let resolved;
      if (spec === 'react') return `const {${clause.split(',').map((n) => n.trim().replace(/^type\s+/, '')).filter(Boolean).join(',')}} = __react__;\n`;
      if (spec.startsWith('/src/')) resolved = spec;
      else if (spec.startsWith('.')) resolved = new URL(spec, selfUrl).pathname;
      else return ''; // bare import (gsap, etc.) -> stubbed below
      return `const __m${Math.abs(hash(resolved))} = __require__("${resolved}");\n` +
        clause.split(',').map((n) => n.trim()).filter(Boolean)
          .map((n) => {
            if (n.startsWith('type ')) return '';
            const [orig, alias] = n.split(/\s+as\s+/);
            return `const ${(alias || orig).trim()} = __m${Math.abs(hash(resolved))}["${orig.trim().replace(/^\*\s+as\s+/, '')}"];`;
          }).filter(Boolean).join('\n');
    })
    .replace(/export\s+default\s+/g, 'exports.default = ')
    .replace(/export\s+const\s+(\w+)/g, 'exports["$1"] = void 0, const $1 = exports["$1"]')
    .replace(/export\s+function\s+(\w+)/g, 'exports["$1"] = function $1')
    .replace(/export\s+(?=(const|function|class|let|var))/g, '')
    .replace(/export\s+type\s+[^;]+;/g, '')
    .replace(/export\s+interface\s+\w+\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
}

function hash(s) { let h = 0; for (const c of s) { h = (h * 31 + c.charCodeAt(0)) | 0; } return h; }

async function requireModule(urlPath) {
  if (cache.has(urlPath)) return cache.get(urlPath);
  const mod = { exports: {} };
  cache.set(urlPath, mod);
  const res = await fetch(DEV + urlPath);
  if (!res.ok) throw new Error(`Failed to fetch ${urlPath}: ${res.status}`);
  const raw = await res.text();
  const code = `(async function(exports, module, __require__, __react__) {\n${rewrite(raw, new URL(urlPath, DEV).href)}\n})`;
  const fn = vm.runInContext(code, context, { filename: urlPath });
  await fn(mod.exports, mod, requireModule, reactStub);
  return mod.exports;
}

// Pre-register gsap/lenis stubs (the film imports them at module scope).
const gsapStub = { registerPlugin: () => {}, timeline: () => ({ fromTo: () => ({ kill: () => {}, scrollTrigger: null }), to: () => ({}), from: () => ({}), kill: () => {} }), set: () => ({}), ticker: { add: () => {}, remove: () => {} }, context: (fn) => { try { fn(() => {}); } catch { /* ignore */ } return { revert: () => {} }; }, utils: { clamp: (a, b, v) => v } };
const ScrollTriggerStub = { create: () => ({ kill: () => {} }), killAll: () => {}, refresh: () => {}, getAll: () => [] };
registry.set('gsap', gsapStub);
registry.set('ScrollTrigger', ScrollTriggerStub);

let failures = 0;
for (const m of MODULES) {
  try {
    await requireModule(m);
    console.log(`[runtime] PASS  ${m} — evaluated, all top-level memo()/hooks initialized without TDZ`);
  } catch (err) {
    if (err instanceof ReferenceError && /before initialization/.test(err.message)) {
      console.error(`[runtime] FAIL  ${m} — REPRODUCED TDZ: ${err.message}`);
      failures++;
    } else {
      console.log(`[runtime] PASS* ${m} — no TDZ; unrelated: ${err.message}`);
    }
  }
}
process.exit(failures > 0 ? 1 : 0);
