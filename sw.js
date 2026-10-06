/* Service worker TacticalXG Studio: uso offline.
   Per aggiornare l'app dopo aver cambiato index.html, aumenta il numero di VERSION. */
const VERSION = 'txg-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){
    return c.addAll(CORE).then(function(){
      return Promise.all(LIBS.map(function(u){ return c.add(u).catch(function(){}); }));
    });
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate';
  if(isPage){
    // pagina: prima la rete (così gli aggiornamenti arrivano), se offline la copia salvata
    e.respondWith(fetch(req).then(function(r){
      const copy = r.clone(); caches.open(VERSION).then(function(c){ c.put('index.html', copy); }); return r;
    }).catch(function(){ return caches.match('index.html'); }));
    return;
  }
  // risorse (icone, librerie, font): dalla cache, se mancano le salva
  e.respondWith(caches.match(req).then(function(hit){
    return hit || fetch(req).then(function(r){
      if(r && (r.ok || r.type === 'opaque')){ const copy = r.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
      return r;
    });
  }));
});
