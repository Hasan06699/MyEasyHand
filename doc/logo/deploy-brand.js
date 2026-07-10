#!/usr/bin/env node
/**
 * Deploy MyEasyHand brand assets to all projects.
 * Generates app icons with brand background and copies logos everywhere.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..');
const BRAND = path.join(__dirname, 'logo');
const SOURCE_ICON = path.join(__dirname, 'source', 'final-icon.png');

const BRAND_BLUE = '#122B63';
const BRAND_LIGHT = '#F5F7FA';

async function iconOnBackground(size, bg = BRAND_BLUE, iconScale = 0.62) {
  const iconSize = Math.round(size * iconScale);
  const icon = await sharp(SOURCE_ICON)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const offset = Math.round((size - iconSize) / 2);
  const bgColor = bg === BRAND_BLUE
    ? { r: 18, g: 43, b: 99 }
    : { r: 245, g: 247, b: 250 };

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { ...bgColor, alpha: 1 },
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function splashScreen(width, height, bg = BRAND_BLUE) {
  const iconSize = Math.round(Math.min(width, height) * 0.28);
  const icon = await sharp(SOURCE_ICON)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const bgColor = bg === BRAND_BLUE
    ? { r: 18, g: 43, b: 99 }
    : { r: 245, g: 247, b: 250 };

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...bgColor, alpha: 1 },
    },
  })
    .composite([{
      input: icon,
      left: Math.round((width - iconSize) / 2),
      top: Math.round((height - iconSize) / 2),
    }])
    .png()
    .toBuffer();
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Skip missing: ${src}`);
    return;
  }
  ensureDir(dest);
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.relative(ROOT, dest)}`);
}

async function main() {
  if (!fs.existsSync(SOURCE_ICON)) {
    throw new Error('Run npm run generate first — source/final-icon.png missing');
  }

  const mobileDir = path.join(BRAND, 'mobile');
  ensureDir(path.join(mobileDir, 'app-icon-1024-bg.png'));

  const icon1024bg = await iconOnBackground(1024);
  const icon512bg = await iconOnBackground(512);
  const splash1284 = await splashScreen(1284, 2778);
  const adaptiveFg = await sharp(SOURCE_ICON)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(mobileDir, 'app-icon-1024-bg.png'), icon1024bg);
  fs.writeFileSync(path.join(mobileDir, 'app-icon-512-bg.png'), icon512bg);

  const projects = {
    admin: path.join(ROOT, 'myeasyhand-admin'),
    web: path.join(ROOT, 'myeasyhand-web'),
    customerApp: path.join(ROOT, 'myeasyhand-customer-app'),
    employeeApp: path.join(ROOT, 'myeasyhand-employee-app'),
    api: path.join(ROOT, 'myeasyhand-api'),
  };

  console.log('\nAdmin');
  copyFile(path.join(BRAND, 'favicon', 'favicon.ico'), path.join(projects.admin, 'public/images/favicon.ico'));
  copyFile(path.join(BRAND, 'favicon', 'favicon.ico'), path.join(projects.admin, 'src/app/favicon.ico'));
  copyFile(path.join(BRAND, 'svg', 'logo-standard.svg'), path.join(projects.admin, 'public/images/logos/logo-standard.svg'));
  copyFile(path.join(BRAND, 'svg', 'logo-dark.svg'), path.join(projects.admin, 'public/images/logos/logo-dark.svg'));
  copyFile(path.join(BRAND, 'svg', 'logo-white.svg'), path.join(projects.admin, 'public/images/logos/logo-white.svg'));
  copyFile(path.join(BRAND, 'svg', 'icon.svg'), path.join(projects.admin, 'public/images/logos/icon.svg'));
  copyFile(path.join(BRAND, 'admin', 'login-logo.svg'), path.join(projects.admin, 'public/images/logos/login-logo.svg'));
  copyFile(path.join(BRAND, 'admin', 'collapsed-icon.svg'), path.join(projects.admin, 'public/images/logos/collapsed-icon.svg'));
  copyFile(path.join(BRAND, 'png', 'logo-standard.png'), path.join(projects.admin, 'public/images/logos/myeasyhand-logo.png'));

  console.log('\nWeb');
  copyFile(path.join(BRAND, 'favicon', 'favicon.ico'), path.join(projects.web, 'src/app/favicon.ico'));
  copyFile(path.join(BRAND, 'favicon', 'favicon-32.png'), path.join(projects.web, 'src/app/icon.png'));
  copyFile(path.join(BRAND, 'mobile', 'app-icon-180.png'), path.join(projects.web, 'src/app/apple-icon.png'));
  copyFile(path.join(BRAND, 'website', 'header-logo.svg'), path.join(projects.web, 'public/images/logo-header.svg'));
  copyFile(path.join(BRAND, 'website', 'footer-logo.svg'), path.join(projects.web, 'public/images/logo-footer.svg'));
  copyFile(path.join(BRAND, 'svg', 'logo-standard.svg'), path.join(projects.web, 'public/images/logo-standard.svg'));
  copyFile(path.join(BRAND, 'png', 'logo-standard.png'), path.join(projects.web, 'public/images/og-image.png'));

  console.log('\nCustomer app');
  ensureDir(path.join(projects.customerApp, 'assets/images/icon.png'));
  fs.writeFileSync(path.join(projects.customerApp, 'assets/images/icon.png'), icon1024bg);
  fs.writeFileSync(path.join(projects.customerApp, 'assets/images/splash.png'), splash1284);
  fs.writeFileSync(path.join(projects.customerApp, 'assets/images/adaptive-icon.png'), adaptiveFg);
  copyFile(path.join(BRAND, 'png', 'logo-standard.png'), path.join(projects.customerApp, 'assets/images/logo.png'));
  console.log('  ✓ myeasyhand-customer-app/assets/images/*');

  console.log('\nEmployee app');
  ensureDir(path.join(projects.employeeApp, 'assets/images/icon.png'));
  fs.writeFileSync(path.join(projects.employeeApp, 'assets/images/icon.png'), icon1024bg);
  fs.writeFileSync(path.join(projects.employeeApp, 'assets/images/splash.png'), splash1284);
  fs.writeFileSync(path.join(projects.employeeApp, 'assets/images/adaptive-icon.png'), adaptiveFg);
  copyFile(path.join(BRAND, 'png', 'logo-standard.png'), path.join(projects.employeeApp, 'assets/images/logo.png'));
  console.log('  ✓ myeasyhand-employee-app/assets/images/*');

  console.log('\nAPI');
  copyFile(path.join(BRAND, 'svg', 'logo-standard.svg'), path.join(projects.api, 'public/branding/logo-standard.svg'));
  copyFile(path.join(BRAND, 'svg', 'icon.svg'), path.join(projects.api, 'public/branding/icon.svg'));
  copyFile(path.join(BRAND, 'favicon', 'favicon.ico'), path.join(projects.api, 'public/favicon.ico'));
  copyFile(path.join(BRAND, 'png', 'logo-standard.png'), path.join(projects.api, 'public/branding/logo-standard.png'));

  console.log('\n✓ Brand assets deployed to all projects.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
