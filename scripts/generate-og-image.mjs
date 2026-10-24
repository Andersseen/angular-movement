#!/usr/bin/env node
/**
 * Renders `public/og-image.png` (1200×630) from the brand tokens, so the social card can be
 * regenerated instead of hand-edited. Needs Playwright's Chromium:
 *
 *   node scripts/generate-og-image.mjs
 */
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const html = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;
  background:radial-gradient(900px 500px at 15% 0%, oklch(0.32 0.14 268), oklch(0.12 0.02 268) 70%);color:oklch(0.96 0.005 268);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif">
  <div style="display:flex;align-items:center;gap:20px">
    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" style="color:oklch(0.72 0.18 268)">
      <path d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z" fill="currentColor" fill-opacity="0.8"/>
      <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor"/>
    </svg>
    <span style="font-size:36px;font-weight:700;letter-spacing:-0.02em">Angular Movement</span>
  </div>
  <div>
    <div style="font-size:82px;line-height:1.04;font-weight:800;letter-spacing:-0.04em;max-width:960px">
      Motion for Angular that follows your <span style="color:oklch(0.72 0.18 268)">state</span>.
    </div>
    <div style="margin-top:28px;font-size:30px;line-height:1.4;color:oklch(0.78 0.01 268);max-width:900px">
      Declarative directives on the Web Animations API — presence, variants, scroll and signals.
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:26px;color:oklch(0.78 0.01 268)">
    <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px 18px;border:1px solid oklch(0.35 0.03 268);border-radius:12px">npm i angular-movement</span>
    <span>angular-movement.andersseen.dev</span>
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: resolve('public/og-image.png') });
await browser.close();
console.log('wrote public/og-image.png');
