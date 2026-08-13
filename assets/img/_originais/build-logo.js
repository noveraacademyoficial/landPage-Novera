const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const DIR = 'D:/Claude/Landpage Novera/assets/img';
const SRC = path.join(DIR, 'logo png.png');

(async () => {
  // ---- Perfil de opacidade por linha ----------------------------------
  // A arte tem o emblema em cima e o wordmark "NOVERA ACADEMY" embaixo,
  // separados por uma faixa de linhas totalmente transparentes.
  // Em vez de chutar uma porcentagem, procuramos essa faixa.
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const rowHasInk = [];
  for (let y = 0; y < H; y++) {
    let ink = 0;
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 12) { ink++; if (ink > 3) break; }
    }
    rowHasInk.push(ink > 3);
  }

  const firstInk = rowHasInk.indexOf(true);
  const lastInk  = rowHasInk.lastIndexOf(true);

  // Maior sequencia de linhas vazias dentro do conteudo = separacao emblema/texto
  let gapStart = -1, gapEnd = -1, bestLen = 0, runStart = -1;
  for (let y = firstInk; y <= lastInk; y++) {
    if (!rowHasInk[y]) {
      if (runStart === -1) runStart = y;
    } else if (runStart !== -1) {
      const len = y - runStart;
      if (len > bestLen) { bestLen = len; gapStart = runStart; gapEnd = y; }
      runStart = -1;
    }
  }

  console.log(`conteudo: y=${firstInk}..${lastInk} | maior faixa vazia: y=${gapStart}..${gapEnd} (${bestLen}px)`);

  if (bestLen < 3) throw new Error('nao encontrei separacao clara entre emblema e texto');

  // Limites horizontais do emblema (para recortar justo, sem cortar as asas)
  let minX = W, maxX = 0;
  for (let y = firstInk; y < gapStart; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    }
  }
  console.log(`emblema: x=${minX}..${maxX}, y=${firstInk}..${gapStart}`);

  // ---- 1) EMBLEMA sozinho (nav, modal, favicon) -----------------------
  const bw = maxX - minX + 1;
  const bh = gapStart - firstInk;
  await sharp(SRC)
    .extract({ left: minX, top: firstInk, width: bw, height: bh })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, 'logo-novera.png'));

  // ---- 2) LOCKUP COMPLETO (CTA final) ---------------------------------
  await sharp(SRC)
    .extract({ left: 0, top: firstInk, width: W, height: lastInk - firstInk + 1 })
    .resize({ width: 640, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, 'logo-novera-full.png'));

  // ---- 3) OG COVER (preview em redes sociais) -------------------------
  await sharp(path.join(DIR, 'travel-rome.jpg'))
    .resize(1200, 630, { fit: 'cover', position: 'top' })
    .modulate({ saturation: 0.75 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(DIR, 'og-cover.jpg'));

  for (const f of ['_logo-full-tmp.png', '_logo-badge-tmp.png']) {
    const p = path.join(DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('');
  for (const f of ['logo-novera.png', 'logo-novera-full.png', 'og-cover.jpg']) {
    const p = path.join(DIR, f);
    const m = await sharp(p).metadata();
    console.log(`${f}  ${m.width}x${m.height}  ${(fs.statSync(p).size / 1024).toFixed(0)}KB  alpha=${m.hasAlpha}`);
  }
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
