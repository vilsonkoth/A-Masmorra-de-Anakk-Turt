(function () {
  'use strict';

  const LS = {
    textures: 'ANAKK_TUR_CUSTOM_PLAYMAT_TEXTURES_V45',
    cards: 'ANAKK_TUR_CUSTOM_CARD_IMAGES',
    monsters: 'ANAKK_TUR_MONSTER_ART_OVERRIDES',
    empty: 'ANAKK_TUR_EMPTY_DUNGEON_ART',
    avatars: 'ANAKK_TUR_PLAYER_AVATARS_V45',
    coins: 'anakkTur.coinFaces.v2',
    font: 'ANAKK_TUR_CUSTOM_FONT',
    fontName: 'ANAKK_TUR_CUSTOM_FONT_NAME',
    fontScale: 'ANAKK_TUR_FONT_SCALE',
    musicMuted: 'ANAKK_TUR_MUSIC_MUTED',
    soundMuted: 'ANAKK_TUR_SOUND_MUTED',
    sfxVolume: 'ANAKK_TUR_SFX_VOLUME',
    musicVolume: 'ANAKK_TUR_MUSIC_VOLUME',
    videoUrl: 'ANAKK_TUR_TABLE_VIDEO_URL'
  };

  const DBS = {
    cards: ['anakk-tur-local-assets', 2, 'card-art'],
    monsters: ['anakk-tur-local-assets', 2, 'monster-art'],
    coins: ['anakk-tur-coin-assets', 1, 'faces'],
    sfx: ['ANAKK_TUR_SFX_LIBRARY', 1, 'tracks'],
    bgm: ['ANAKK_TUR_BGM_LIBRARY', 1, 'tracks'],
    video: ['anakk-tur-media', 1, 'background']
  };

  function safe(s) {
    return String(s || 'asset').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 140);
  }
  function ext(m) {
    m = m || '';
    if (m.includes('png')) return 'png';
    if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
    if (m.includes('webp')) return 'webp';
    if (m.includes('svg')) return 'svg';
    if (m.includes('wav')) return 'wav';
    if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
    if (m.includes('ogg')) return 'ogg';
    if (m.includes('mp4')) return 'mp4';
    if (m.includes('webm')) return 'webm';
    if (m.includes('ttf')) return 'ttf';
    if (m.includes('woff2')) return 'woff2';
    if (m.includes('woff')) return 'woff';
    return 'bin';
  }
  async function dataBlob(v) { return (await fetch(v)).blob(); }
  function openDb(name, version, store) {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(name, version);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (store && !db.objectStoreNames.contains(store)) db.createObjectStore(store);
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  function getAll(name, version, store) {
    return openDb(name, version, store).then(db => new Promise((resolve, reject) => {
      const r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = () => { db.close(); resolve(r.result || []); };
      r.onerror = () => { db.close(); reject(r.error); };
    }));
  }
  function getKeys(name, version, store) {
    return openDb(name, version, store).then(db => new Promise((resolve, reject) => {
      const r = db.transaction(store, 'readonly').objectStore(store).getAllKeys();
      r.onsuccess = () => { db.close(); resolve(r.result || []); };
      r.onerror = () => { db.close(); reject(r.error); };
    }));
  }
  function getValue(name, version, store, key) {
    return openDb(name, version, store).then(db => new Promise((resolve, reject) => {
      const r = db.transaction(store, 'readonly').objectStore(store).get(key);
      r.onsuccess = () => { db.close(); resolve(r.result); };
      r.onerror = () => { db.close(); reject(r.error); };
    }));
  }
  function putValue(name, version, store, value, key) {
    return openDb(name, version, store).then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    }));
  }
  function download(blob, name) {
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 10000);
  }
  function parseLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  }

  async function exportAssets() {
    if (!window.JSZip) throw new Error('JSZip não carregou.');
    const zip = new JSZip();
    const manifest = {
      format: 'anakk-tur-assets', version: 2, exportedAt: new Date().toISOString(),
      localStorage: [], cardArt: [], monsterArt: [], coins: [], sfx: [], bgm: [], video: false
    };

    const official = [
      'anakk-tur-logo.png','card_back_anakktur_1788030785485.jpg',
      'dungeon_background_1788099020579.jpg','raider-frame-clean.png',
      'monster-frame-clean.png','monster-frame-clean-rewardless.png',
      'frame-combatente.png','frame-conjurador.png','frame-fera.png',
      'habilidade-icone.png','adentrar-icone.png','ultimo-suspiro-icone.png'
    ];
    for (const file of official) {
      try {
        const r = await fetch('/assets/' + file);
        if (r.ok) zip.file('official/' + file, await r.blob());
      } catch {}
    }

    for (const key of Object.values(LS)) {
      if (key === LS.font) continue;
      if (localStorage.getItem(key) !== null) {
        zip.file('config/localStorage/' + safe(key) + '.json', localStorage.getItem(key));
        manifest.localStorage.push(key);
      }
    }

    try {
      const font = localStorage.getItem(LS.font);
      if (font && font.startsWith('data:')) {
        const b = await dataBlob(font);
        const name = safe(localStorage.getItem(LS.fontName) || ('custom-font.' + ext(b.type)));
        zip.file('fonts/' + name, b);
        manifest.font = 'fonts/' + name;
      }
    } catch {}

    try {
      const overrides = parseLS(LS.cards, {});
      for (const [key, marker] of Object.entries(overrides)) {
        let b;
        if (typeof marker === 'string' && marker.startsWith('idb://card-art::')) {
          b = await getValue(DBS.cards[0], DBS.cards[1], DBS.cards[2], key);
        } else if (typeof marker === 'string' && marker.startsWith('data:image/')) {
          b = await dataBlob(marker);
        }
        if (b) {
          const path = 'card-art/' + encodeURIComponent(key) + '.' + ext(b.type);
          zip.file(path, b);
          manifest.cardArt.push({ key, path });
        }
      }
    } catch (e) { console.warn('Export card-art:', e); }

    try {
      const overrides = parseLS(LS.monsters, {});
      const keys = await getKeys(DBS.monsters[0], DBS.monsters[1], DBS.monsters[2]);
      for (const key of keys) {
        const b = await getValue(DBS.monsters[0], DBS.monsters[1], DBS.monsters[2], key);
        if (b) {
          const name = String(key);
          const path = 'monster-art/' + encodeURIComponent(name) + '.' + ext(b.type);
          zip.file(path, b);
          manifest.monsterArt.push({ key: name, path });
        }
      }
      for (const [key, marker] of Object.entries(overrides)) {
        if (manifest.monsterArt.some(x => x.key === key)) continue;
        if (typeof marker === 'string' && marker.startsWith('data:image/')) {
          const b = await dataBlob(marker);
          const path = 'monster-art/' + encodeURIComponent(key) + '.' + ext(b.type);
          zip.file(path, b);
          manifest.monsterArt.push({ key, path });
        }
      }
    } catch (e) { console.warn('Export monster-art:', e); }

    try {
      const faces = parseLS(LS.coins, {});
      for (const face of ['skull', 'dragon']) {
        let b = await getValue(DBS.coins[0], DBS.coins[1], DBS.coins[2], face);
        if (!b && faces[face] && String(faces[face]).startsWith('data:image/')) b = await dataBlob(faces[face]);
        if (b) {
          const path = 'coins/' + face + '.' + ext(b.type);
          zip.file(path, b);
          manifest.coins.push({ face, path });
        }
      }
    } catch (e) { console.warn('Export coins:', e); }

    try {
      const tracks = await getAll(DBS.sfx[0], DBS.sfx[1], DBS.sfx[2]);
      for (const t of tracks) {
        if (!t || !t.blob) continue;
        const path = 'sfx/' + safe(t.id) + '.' + ext(t.blob.type);
        zip.file(path, t.blob);
        manifest.sfx.push({ id:t.id, slot:t.slot, cardKey:t.cardKey, name:t.name, createdAt:t.createdAt, path });
      }
    } catch (e) { console.warn('Export SFX:', e); }

    try {
      const tracks = await getAll(DBS.bgm[0], DBS.bgm[1], DBS.bgm[2]);
      for (const t of tracks) {
        if (!t || !t.blob) continue;
        const path = 'music/' + safe(t.id) + '.' + ext(t.blob.type);
        zip.file(path, t.blob);
        manifest.bgm.push({ id:t.id, name:t.name, createdAt:t.createdAt, active:!!t.active, path });
      }
    } catch (e) { console.warn('Export BGM:', e); }

    try {
      const url = localStorage.getItem(LS.videoUrl);
      if (url) {
        manifest.videoUrl = url;
      } else {
        const b = await getValue(DBS.video[0], DBS.video[1], DBS.video[2], 'table-video');
        if (b) {
          manifest.video = true;
          manifest.videoPath = 'videos/dungeon-background.' + ext(b.type);
          zip.file(manifest.videoPath, b);
        }
      }
    } catch (e) { console.warn('Export video:', e); }

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('README.txt',
      'A MASMORRA DE ANAKK TUR — PACOTE COMPLETO DE ARTES E AUDIO\\n' +
      'Este pacote foi gerado pelo navegador e reúne as personalizações salvas localmente.\\n' +
      'Inclui artes, moeda, avatares, cardbacks, fonte, SFX, BGM, vídeo e configurações.\\n'
    );
    const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}});
    download(blob, 'Anakk-Tur-Assets-' + new Date().toISOString().slice(0,10) + '.zip');
  }

  async function importAssets(file) {
    if (!window.JSZip) throw new Error('JSZip não carregou.');
    const zip = await JSZip.loadAsync(file);
    const mf = zip.file('manifest.json');
    if (!mf) throw new Error('ZIP sem manifest.json. Use um pacote exportado pelo Anakk Tur.');
    const manifest = JSON.parse(await mf.async('text'));

    for (const key of (manifest.localStorage || [])) {
      const f = zip.file('config/localStorage/' + safe(key) + '.json');
      if (f) localStorage.setItem(key, await f.async('text'));
    }

    const cards = parseLS(LS.cards, {});
    for (const item of (manifest.cardArt || [])) {
      const f = zip.file(item.path); if (!f) continue;
      await putValue(DBS.cards[0], DBS.cards[1], DBS.cards[2], await f.async('blob'), item.key);
      cards[item.key] = 'idb://card-art::' + encodeURIComponent(item.key);
    }
    localStorage.setItem(LS.cards, JSON.stringify(cards));

    const monsters = parseLS(LS.monsters, {});
    for (const item of (manifest.monsterArt || [])) {
      const f = zip.file(item.path); if (!f) continue;
      await putValue(DBS.monsters[0], DBS.monsters[1], DBS.monsters[2], await f.async('blob'), item.key);
      monsters[item.key] = 'idb://' + item.key;
    }
    localStorage.setItem(LS.monsters, JSON.stringify(monsters));

    const faces = parseLS(LS.coins, {});
    for (const item of (manifest.coins || [])) {
      const f = zip.file(item.path); if (!f) continue;
      await putValue(DBS.coins[0], DBS.coins[1], DBS.coins[2], await f.async('blob'), item.face);
      faces[item.face] = 'idb://coin::' + item.face;
    }
    localStorage.setItem(LS.coins, JSON.stringify(faces));

    for (const item of (manifest.sfx || [])) {
      const f = zip.file(item.path); if (!f) continue;
      await putValue(DBS.sfx[0], DBS.sfx[1], DBS.sfx[2], {
        id:item.id, slot:item.slot, cardKey:item.cardKey, name:item.name,
        blob:await f.async('blob'), createdAt:item.createdAt
      }, item.id);
    }

    for (const item of (manifest.bgm || [])) {
      const f = zip.file(item.path); if (!f) continue;
      await putValue(DBS.bgm[0], DBS.bgm[1], DBS.bgm[2], {
        id:item.id, name:item.name, blob:await f.async('blob'),
        createdAt:item.createdAt, active:!!item.active
      }, item.id);
    }

    if (manifest.video && manifest.videoPath) {
      const f = zip.file(manifest.videoPath);
      if (f) {
        await putValue(DBS.video[0], DBS.video[1], DBS.video[2], await f.async('blob'), 'table-video');
        localStorage.removeItem(LS.videoUrl);
      }
    } else if (manifest.videoUrl) {
      localStorage.setItem(LS.videoUrl, manifest.videoUrl);
    }

    if (manifest.font) {
      const f = zip.file(manifest.font);
      if (f) {
        const b = await f.async('blob');
        const reader = new FileReader();
        const data = await new Promise(r => { reader.onload=()=>r(reader.result); reader.readAsDataURL(b); });
        localStorage.setItem(LS.font, data);
        localStorage.setItem(LS.fontName, manifest.font.split('/').pop());
      }
    }

    alert('Assets importados com sucesso. O jogo será recarregado.');
    location.reload();
  }

  function installUi() {
    const buttons = Array.from(document.querySelectorAll('button'));
    const exportBtn = buttons.find(b => (b.textContent || '').toUpperCase().includes('EXPORTAR ASSETS'));
    if (exportBtn && !exportBtn.dataset.anakkTransfer) {
      exportBtn.dataset.anakkTransfer = '1';
      exportBtn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopImmediatePropagation();
        exportAssets().catch(err => { console.error(err); alert('Falha ao exportar assets: ' + (err.message || err)); });
      }, true);

      const importLabel = document.createElement('label');
      importLabel.textContent = 'IMPORTAR ASSETS';
      importLabel.style.cssText = exportBtn.getAttribute('style') || '';
      importLabel.className = exportBtn.className;
      importLabel.style.cursor = 'pointer';
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.zip,application/zip';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (file) importAssets(file).catch(err => { console.error(err); alert('Falha ao importar assets: ' + (err.message || err)); });
      });
      importLabel.appendChild(input);
      exportBtn.parentElement && exportBtn.parentElement.appendChild(importLabel);
    }
  }

  window.AnakkAssetTransfer = { exportAssets, importAssets };
  const obs = new MutationObserver(installUi);
  obs.observe(document.documentElement, {childList:true, subtree:true});
  setTimeout(installUi, 500);
  setTimeout(installUi, 1500);
})();
