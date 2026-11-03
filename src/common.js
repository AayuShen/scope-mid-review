'use strict';
// Shared deck setup: theme, slide layouts, section-aware add(), chart series styling, theme
// application. Used by build_deck.js (main 8-slide deck) and build_extended.js (38 slides).

const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');
const { W, MX, CW, K, make } = require('./lib');
const REFS = require('./refs');

const ROOT = path.resolve(__dirname, '..');
const APPLY_THEME = process.env.PPTX_APPLY_THEME || path.join(__dirname, 'vendor', 'apply_theme.js');

const THEME = {
  name: 'SCoPe Research',
  headFontFace: 'Calibri',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '111827', lt1: 'FFFFFF', dk2: '0F172A', lt2: 'F3F4F6',
    accent1: '2A78D6', accent2: 'EB6834', accent3: '1BAF7A', accent4: '4A3AA7', accent5: 'E34948', accent6: '6B7280',
    hlink: '2A78D6', folHlink: '4A3AA7',
  },
};
const FOOTER = 'SCoPe · Trust-Region Latent Planning with JEPA World Models · Mid-review';

function createDeck(title) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = title;
  pres.subject = 'Reinforcement learning project mid-review';
  pres.author = '[TEAM MEMBERS]';
  pres.company = '[INSTITUTION]';

  pres.defineSlideMaster({
    title: 'TITLE_DARK',
    background: { color: K.dark },
    objects: [
      { placeholder: { options: { name: 'overline', type: 'body', x: 0.7, y: 1.45, w: 7.6, h: 0.32, fontFace: 'Calibri', fontSize: 13, bold: true, color: '6DA7EC', charSpacing: 2, valign: 'middle', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 1.85, w: 7.7, h: 1.95, fontFace: 'Calibri', fontSize: 38, bold: true, color: 'FFFFFF', align: 'left', valign: 'top', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'subtitle', type: 'body', x: 0.7, y: 3.9, w: 7.5, h: 0.95, fontFace: 'Calibri', fontSize: 19, color: K.darkText, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    ],
  });
  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: 'FFFFFF' },
    objects: [
      { placeholder: { options: { name: 'overline', type: 'body', x: MX, y: 0.3, w: 8.2, h: 0.28, fontFace: 'Calibri', fontSize: 11, bold: true, color: K.blue, charSpacing: 1.5, valign: 'middle', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.62, w: CW, h: 0.85, fontFace: 'Calibri', fontSize: 28, bold: true, color: K.ink, align: 'left', valign: 'top', margin: 0 }, text: '' } },
      { text: { text: FOOTER, options: { x: MX, y: 7.05, w: 9, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: K.muted, valign: 'middle', margin: 0 } } },
    ],
    slideNumber: { x: W - MX - 0.6, y: 7.05, w: 0.6, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: K.muted, align: 'right' },
  });
  pres.defineSlideMaster({
    title: 'CLOSING_DARK',
    background: { color: K.dark },
    objects: [
      { placeholder: { options: { name: 'overline', type: 'body', x: MX, y: 0.3, w: 8.2, h: 0.28, fontFace: 'Calibri', fontSize: 11, bold: true, color: '6DA7EC', charSpacing: 1.5, valign: 'middle', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.62, w: CW, h: 0.95, fontFace: 'Calibri', fontSize: 28, bold: true, color: 'FFFFFF', align: 'left', valign: 'top', margin: 0 }, text: '' } },
      { text: { text: FOOTER, options: { x: MX, y: 7.05, w: 9, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: K.darkMuted, valign: 'middle', margin: 0 } } },
    ],
    slideNumber: { x: W - MX - 0.6, y: 7.05, w: 0.6, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: K.darkMuted, align: 'right' },
  });

  const L = make(pres);
  const declared = new Set();
  // Add a slide in a named section with its overline and conclusion-style title.
  function add(section, overline, slideTitle, layout = 'CONTENT') {
    if (!declared.has(section)) {
      pres.addSection({ title: section });
      declared.add(section);
    }
    const slide = pres.addSlide({ masterName: layout, sectionTitle: section });
    if (overline) slide.addText(overline, { placeholder: 'overline' });
    if (slideTitle) slide.addText(slideTitle, { placeholder: 'title' });
    return slide;
  }
  const cite = (...ns) => `[${ns.join(', ')}]`;
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'phase0_metrics.json'), 'utf8'));
  return { pres, L, K, M, REFS, add, cite, ASSETS: path.join(ROOT, 'assets') };
}

// Per-series line styling that pptxgenjs only exposes per chart: series whose name starts
// with "Seed" become thin, "Published" dashed. Editable afterwards in PowerPoint.
async function styleChartSeries(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const charts = Object.keys(zip.files).filter((f) => /^ppt\/charts\/chart\d+\.xml$/.test(f));
  for (const f of charts) {
    let xml = await zip.file(f).async('string');
    if (!xml.includes('<c:lineChart>')) continue;
    xml = xml.replace(/<c:ser>[\s\S]*?<\/c:ser>/g, (ser) => {
      const name = (ser.match(/<c:tx>[\s\S]*?<c:v>([^<]*)<\/c:v>/) || [])[1] || '';
      // The first <a:ln> in a series is its line (the marker's comes later).
      if (name.startsWith('Seed')) return ser.replace(/<a:ln w="\d+"/, '<a:ln w="15875"');
      if (name.startsWith('Published')) {
        return ser.replace(/<a:ln w="\d+"/, '<a:ln w="19050"').replace(/<a:prstDash val="solid"\/>/, '<a:prstDash val="dash"/>');
      }
      return ser;
    });
    zip.file(f, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

// Write the deck, style chart series, then write the theme colours into the package.
async function finish(ctx, fileName) {
  const out = path.join(ROOT, fileName);
  await ctx.pres.writeFile({ fileName: out });
  await styleChartSeries(out);
  const { applyTheme } = require(APPLY_THEME);
  await applyTheme(out, THEME);
  console.log(`wrote ${out}`);
}

module.exports = { createDeck, finish, ROOT };
