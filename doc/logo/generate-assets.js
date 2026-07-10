#!/usr/bin/env node
/**
 * MyEasyHand Brand Asset Generator
 * Builds all deliverables from the final master logo files (no redrawn artwork).
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;

const BASE = __dirname;
const ROOT = path.join(BASE, 'logo');
const SOURCE_DIR = path.join(BASE, 'source');

const SOURCES = {
  full: path.join(SOURCE_DIR, 'final-logo.png'),
  icon: path.join(SOURCE_DIR, 'final-icon.png'),
};

async function removeLightBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const samples = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
  ];

  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [x, y] of samples) {
    const i = (y * width + x) * channels;
    bgR += data[i];
    bgG += data[i + 1];
    bgB += data[i + 2];
  }
  bgR = Math.round(bgR / samples.length);
  bgG = Math.round(bgG / samples.length);
  bgB = Math.round(bgB / samples.length);

  const tolerance = 42;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.sqrt(
      (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
    );
    if (dist <= tolerance) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function trimTransparent(input) {
  return sharp(input).trim({ threshold: 10 }).png().toBuffer();
}

async function recolorWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] > 16) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function recolorDark(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 16) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isTeal = g > 90 && b > 90 && g >= r && b >= r - 20;

    if (isTeal) {
      continue;
    }

    if (max < 120 || (b > r && b > g && max > 60)) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function loadMaster(kind) {
  const raw = fs.readFileSync(SOURCES[kind]);
  return trimTransparent(await removeLightBackground(raw));
}

async function resizePng(input, width, height) {
  const img = sharp(input);
  if (height) {
    return img
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }
  return img
    .resize(width, null, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

function writePng(filePath, buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

async function exportScales(buffer, pngPath, baseWidth) {
  for (const scale of [1, 2, 4]) {
    const suffix = scale === 1 ? '' : `@${scale}x`;
    const out = pngPath.replace('.png', `${suffix}.png`);
    writePng(out, await resizePng(buffer, baseWidth * scale));
  }
}

async function writeSvgFromPng(svgPath, pngBuffer, label) {
  const meta = await sharp(pngBuffer).metadata();
  const base64 = pngBuffer.toString('base64');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${meta.width} ${meta.height}" role="img" aria-label="${label}">
  <title>${label}</title>
  <image width="${meta.width}" height="${meta.height}" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;
  fs.mkdirSync(path.dirname(svgPath), { recursive: true });
  fs.writeFileSync(svgPath, svg, 'utf8');
}

async function main() {
  if (!fs.existsSync(SOURCES.full) || !fs.existsSync(SOURCES.icon)) {
    throw new Error(
      'Missing source files. Place final-logo.png and final-icon.png in doc/logo/source/'
    );
  }

  const fullStandard = await loadMaster('full');
  const iconStandard = await loadMaster('icon');
  const fullWhite = await recolorWhite(fullStandard);
  const fullDark = await recolorDark(fullStandard);
  const iconWhite = await recolorWhite(iconStandard);

  const masters = {
    'logo-standard': fullStandard,
    'logo-dark': fullDark,
    'logo-white': fullWhite,
    icon: iconStandard,
  };

  const svgDir = path.join(ROOT, 'svg');
  const pngDir = path.join(ROOT, 'png');

  for (const [name, buffer] of Object.entries(masters)) {
    const meta = await sharp(buffer).metadata();
    const baseWidth = name === 'icon' ? 176 : Math.round(meta.width * (176 / meta.height));
    await exportScales(buffer, path.join(pngDir, `${name}.png`), baseWidth);
    const png1x = await resizePng(buffer, baseWidth);
    await writeSvgFromPng(path.join(svgDir, `${name}.svg`), png1x, `MyEasyHand ${name}`);
  }

  const iconMeta = await sharp(iconStandard).metadata();
  const iconSquare = await resizePng(
    iconStandard,
    Math.max(iconMeta.width, iconMeta.height),
    Math.max(iconMeta.width, iconMeta.height)
  );

  const mobileSizes = [
    ['app-icon-1024.png', 1024],
    ['app-icon-512.png', 512],
    ['app-icon-256.png', 256],
    ['app-icon-180.png', 180],
  ];
  for (const [name, size] of mobileSizes) {
    writePng(
      path.join(ROOT, 'mobile', name),
      await resizePng(iconSquare, size, size)
    );
  }

  const websiteJobs = [
    ['header-logo', fullStandard, 480],
    ['footer-logo', fullStandard, 400],
  ];
  for (const [name, buffer, width] of websiteJobs) {
    await exportScales(buffer, path.join(ROOT, 'website', `${name}.png`), width);
    const png1x = await resizePng(buffer, width);
    await writeSvgFromPng(
      path.join(ROOT, 'website', `${name}.svg`),
      png1x,
      `MyEasyHand ${name}`
    );
  }

  const adminJobs = [
    ['sidebar-logo', fullStandard, 360],
    ['login-logo', fullStandard, 560],
    ['collapsed-icon', iconStandard, 88],
  ];
  for (const [name, buffer, width] of adminJobs) {
    await exportScales(buffer, path.join(ROOT, 'admin', `${name}.png`), width);
    const png1x = await resizePng(buffer, width);
    await writeSvgFromPng(
      path.join(ROOT, 'admin', `${name}.svg`),
      png1x,
      `MyEasyHand ${name}`
    );
  }

  const faviconSizes = [16, 32, 48];
  const faviconPaths = [];
  for (const size of faviconSizes) {
    const out = path.join(ROOT, 'favicon', `favicon-${size}.png`);
    writePng(out, await resizePng(iconSquare, size, size));
    faviconPaths.push(out);
  }
  writePng(
    path.join(ROOT, 'favicon', 'favicon.ico'),
    await pngToIco(faviconPaths)
  );

  const guidelineAssets = path.join(ROOT, 'guideline', 'assets');
  fs.mkdirSync(guidelineAssets, { recursive: true });
  for (const [name, buffer] of Object.entries(masters)) {
    writePng(path.join(guidelineAssets, `${name}.png`), await resizePng(buffer, name === 'icon' ? 176 : 620));
    await writeSvgFromPng(
      path.join(guidelineAssets, `${name}.svg`),
      await resizePng(buffer, name === 'icon' ? 176 : 620),
      `MyEasyHand ${name}`
    );
  }

  console.log('✓ Brand assets rebuilt from final master logos.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
