const CACHE_NAME = 'palm-springs-bakery-v10';
const APP_FILES = ['./','./index.html','./manifest.webmanifest','./manifest.webmanifest?v=10','./report-pdf.js','./icons/icon-192.png','./icons/icon-192.png?v=10','./icons/icon-512.png','./icons/icon-512.png?v=10','./icons/apple-touch-icon.png','./icons/apple-touch-icon.png?v=10'];
self.addEventListener('install', e => {e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate', e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('palm-springs-bakery-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return; if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));return;} e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
