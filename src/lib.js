'use strict';
// Drawing helpers for the SCoPe mid-review deck (pptxgenjs 3.12, LAYOUT_WIDE 13.333 x 7.5 in).
// Everything is a native, editable PowerPoint element; no rendered images except project screenshots.

const W = 13.333;
const H = 7.5;
const MX = 0.6; // side margin
const CW = W - 2 * MX; // content width
const TOP = 1.6; // first content row under the title
const BOT = 6.85; // last content row above the footer

// Palette (hex). Theme-linked colours are used through pres.SchemeColor where an option accepts them.
const K = {
  ink: '111827', body: '1F2937', sub: '4B5563', muted: '6B7280', faint: '9CA3AF',
  line: 'D1D5DB', hair: 'E5E7EB', panel: 'F3F4F6', panel2: 'F9FAFB', white: 'FFFFFF',
  dark: '0F172A', dark2: '1E293B', dark3: '334155', darkText: 'CBD5E1', darkMuted: '94A3B8',
  blue: '2A78D6', blueTint: 'EAF2FC', blueDark: '1C5CAB',
  orange: 'EB6834', orangeTint: 'FDF0EA', orangeDark: 'B8471A',
  aqua: '1BAF7A', aquaTint: 'E8F7F1', aquaDark: '0E7A53',
  violet: '4A3AA7', violetTint: 'EFEDF9',
  red: 'E34948', redTint: 'FDEDED', redDark: 'B42318',
  amber: 'C98500', amberTint: 'FDF6E3',
};

// Evidence labels required by the brief: every number on a slide carries one of these.
const EVIDENCE = {
  MEASURED: { color: K.blue, label: 'MEASURED' },
  PUBLISHED: { color: K.orange, label: 'PUBLISHED' },
  ILLUSTRATIVE: { color: K.muted, label: 'ILLUSTRATIVE' },
  TARGET: { color: K.violet, label: 'TARGET' },
  PROPOSED: { color: K.violet, label: 'PROPOSED' },
};

// Implementation status used in every architecture view (box border + tag; never colour alone).
const STATUS = {
  REUSED: { tag: 'REUSED', fill: K.panel2, border: K.faint, dash: 'solid', tagFill: K.panel, tagText: K.sub, tagLine: K.line },
  BUILT: { tag: 'BUILT', fill: K.white, border: K.aqua, dash: 'solid', tagFill: K.aquaTint, tagText: K.aquaDark, tagLine: K.aqua },
  PATCHED: { tag: 'REUSED + PATCHED', fill: K.white, border: K.aqua, dash: 'solid', tagFill: K.aquaTint, tagText: K.aquaDark, tagLine: K.aqua },
  PILOT: { tag: 'PILOT', fill: K.white, border: K.amber, dash: 'solid', tagFill: K.amberTint, tagText: '8A5A00', tagLine: K.amber },
  PARTIAL: { tag: 'INTERFACE BUILT', fill: K.white, border: K.violet, dash: 'dash', tagFill: K.amberTint, tagText: '8A5A00', tagLine: K.amber },
  PLANNED: { tag: 'PLANNED', fill: K.white, border: K.violet, dash: 'dash', tagFill: K.violetTint, tagText: K.violet, tagLine: K.violet },
  PROPOSED: { tag: 'PROPOSED', fill: K.white, border: K.violet, dash: 'dash', tagFill: K.violetTint, tagText: K.violet, tagLine: K.violet },
  STRETCH: { tag: 'STRETCH', fill: K.white, border: K.faint, dash: 'dash', tagFill: K.panel, tagText: K.sub, tagLine: K.line },
};

// Math-style sub/superscripts: "u_k", "z_{t+5}", "x^{2}" become real subscript/superscript runs.
// A single-character subscript must not be followed by a letter or digit, so file names such as
// phase0_metrics.json or eval_state are left alone.
const MATH_RE = /_\{([^}]*)\}|\^\{([^}]*)\}|_([A-Za-z0-9θ])(?![A-Za-z0-9])|\^([A-Za-z0-9])(?![A-Za-z0-9])/g;
function mathRuns(str, base = {}) {
  const out = [];
  let last = 0; let m;
  MATH_RE.lastIndex = 0;
  while ((m = MATH_RE.exec(str))) {
    if (m.index > last) out.push({ text: str.slice(last, m.index), options: Object.assign({}, base) });
    const sub = m[1] !== undefined ? m[1] : m[3];
    const sup = m[2] !== undefined ? m[2] : m[4];
    if (sub !== undefined) out.push({ text: sub, options: Object.assign({}, base, { subscript: true }) });
    else out.push({ text: sup, options: Object.assign({}, base, { superscript: true }) });
    last = MATH_RE.lastIndex;
  }
  if (last < str.length) out.push({ text: str.slice(last), options: Object.assign({}, base) });
  return out;
}
function hasMath(str) { MATH_RE.lastIndex = 0; return typeof str === 'string' && MATH_RE.test(str); }
// Apply to a string or an array of runs; breakLine stays on the last piece of each run.
function mr(t) {
  if (typeof t === 'string') return hasMath(t) ? mathRuns(t) : t;
  return t.flatMap((r) => {
    if (!hasMath(r.text)) return [r];
    const base = Object.assign({}, r.options || {}); const br = base.breakLine; delete base.breakLine;
    const pieces = mathRuns(r.text, base);
    if (br) pieces[pieces.length - 1].options.breakLine = true;
    return pieces;
  });
}

function make(pres) {
  const S = pres.shapes;

  // Text box. margin is [top, right, bottom, left] in points here, converted to pptxgenjs' [l, r, b, t].
  function text(slide, t, o) {
    const m = o.margin === undefined ? [0, 0, 0, 0] : (Array.isArray(o.margin) ? o.margin : [o.margin, o.margin, o.margin, o.margin]);
    const opts = Object.assign({
      fontFace: 'Calibri', fontSize: 14, color: K.body, valign: 'top', isTextBox: true, fit: 'none', wrap: true,
    }, o, { margin: [m[3], m[1], m[2], m[0]] });
    delete opts.math;
    slide.addText(o.math === false ? t : mr(t), opts);
  }

  function rect(slide, o) {
    const shape = o.radius ? S.ROUNDED_RECTANGLE : S.RECTANGLE;
    const opts = {
      x: o.x, y: o.y, w: o.w, h: o.h,
      fill: o.fill === null ? { type: 'none' } : { color: o.fill || K.white, transparency: o.transparency || 0 },
      line: o.line === null ? { type: 'none' } : { color: o.line || K.line, width: o.lineW || 1, dashType: o.dash || 'solid' },
    };
    if (o.radius) opts.rectRadius = o.radius;
    if (o.name) opts.objectName = o.name;
    slide.addShape(shape, opts);
  }

  function ellipse(slide, o) {
    slide.addShape(S.OVAL, {
      x: o.x, y: o.y, w: o.w, h: o.h,
      fill: o.fill === null ? { type: 'none' } : { color: o.fill || K.white },
      line: o.line === null ? { type: 'none' } : { color: o.line || K.line, width: o.lineW || 1, dashType: o.dash || 'solid' },
      objectName: o.name,
    });
  }

  // Straight line from (x1, y1) to (x2, y2); arrowhead at the end unless head === false.
  function arrow(slide, x1, y1, x2, y2, o = {}) {
    const line = { color: o.color || K.sub, width: o.w || 1.25, dashType: o.dash || 'solid' };
    if (o.head !== false) line.endArrowType = o.headType || 'triangle';
    if (o.tail) line.beginArrowType = 'triangle';
    slide.addShape(S.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      flipH: x2 < x1, flipV: y2 < y1, line, objectName: o.name,
    });
  }

  // Orthogonal polyline through points [[x, y], ...]; arrowhead only on the last segment.
  function path(slide, pts, o = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const last = i === pts.length - 2;
      arrow(slide, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], Object.assign({}, o, { head: last ? o.head !== false : false, tail: i === 0 && o.tail }));
    }
  }

  // Small rounded pill with a coloured dot and an ink label (evidence chip).
  function chip(slide, kind, x, y, o = {}) {
    const e = EVIDENCE[kind];
    const label = o.label || e.label;
    const w = 0.42 + label.length * 0.085;
    const dark = !!o.dark;
    rect(slide, { x, y, w, h: 0.28, radius: 0.5, fill: dark ? K.dark2 : K.white, line: e.color, lineW: 1 });
    ellipse(slide, { x: x + 0.11, y: y + 0.09, w: 0.1, h: 0.1, fill: e.color, line: null });
    text(slide, label, { x: x + 0.27, y, w: w - 0.3, h: 0.28, fontSize: 10, bold: true, color: dark ? K.white : K.ink, valign: 'middle', charSpacing: 0.5 });
    return w;
  }

  // Right-aligned row of evidence chips in the slide's top-right corner.
  function chips(slide, kinds, o = {}) {
    let x = W - MX;
    const widths = kinds.map((k) => 0.42 + (EVIDENCE[k].label).length * 0.085);
    for (let i = kinds.length - 1; i >= 0; i--) {
      x -= widths[i];
      chip(slide, kinds[i], x, o.y || 0.3, o);
      x -= 0.1;
    }
  }

  // Implementation-status tag (text label, so status is never colour alone).
  function tag(slide, status, x, y, o = {}) {
    const s = STATUS[status];
    const w = o.w || (0.22 + s.tag.length * 0.068);
    rect(slide, { x, y, w, h: 0.22, radius: 0.3, fill: s.tagFill, line: s.tagLine, lineW: 0.75, dash: s.dash === 'dash' ? 'dash' : 'solid' });
    text(slide, s.tag, { x, y, w, h: 0.22, fontSize: 8.5, bold: true, color: s.tagText, align: 'center', valign: 'middle', charSpacing: 0.3 });
    return w;
  }

  // Architecture component: bordered box with title and body lines; the status tag sits on the
  // top border (right-aligned) so it costs no interior space. Border style repeats the status.
  function comp(slide, o) {
    const s = STATUS[o.status || 'REUSED'];
    rect(slide, { x: o.x, y: o.y, w: o.w, h: o.h, radius: 0.06, fill: o.fill || s.fill, line: o.border || s.border, lineW: o.lineW || 1.25, dash: s.dash, name: o.name });
    const runs = [{ text: o.title, options: { bold: true, fontSize: o.titleSize || 12, color: K.ink, breakLine: !!o.body } }];
    const lines = o.body ? (Array.isArray(o.body) ? o.body : [o.body]) : [];
    lines.forEach((l, i) => runs.push({ text: l, options: { fontSize: o.bodySize || 10.5, color: K.sub, breakLine: i < lines.length - 1 } }));
    text(slide, runs, { x: o.x + 0.1, y: o.y + 0.11, w: o.w - 0.2, h: o.h - 0.15, align: o.align || 'left', valign: o.valign || 'top', lineSpacingMultiple: 0.95, paraSpaceAfter: 1 });
    if (!o.noTag) {
      const tw = 0.24 + s.tag.length * 0.066;
      tag(slide, o.status || 'REUSED', o.x + o.w - tw - 0.1, o.y - 0.11, { w: tw });
    }
  }

  // Container band for a subsystem: tinted rounded area with a small caps label.
  function band(slide, o) {
    rect(slide, { x: o.x, y: o.y, w: o.w, h: o.h, radius: 0.04, fill: o.fill || K.panel2, line: o.line || K.hair, lineW: 0.75, dash: o.dash || 'solid' });
    text(slide, o.label, { x: o.x + 0.12, y: o.y + 0.03, w: o.labelW || 4, h: 0.24, fontSize: 10, bold: true, color: o.labelColor || K.muted, charSpacing: 1.2, valign: 'middle' });
  }

  // Label sitting on a line (white backing so it stays readable over connectors).
  function label(slide, t, x, y, w, o = {}) {
    text(slide, t, Object.assign({ x, y, w, h: o.h || 0.24, fontSize: 10, color: K.sub, align: 'center', valign: 'middle', italic: !!o.italic, fill: o.fill === undefined ? { color: K.white } : o.fill }, o.text || {}));
  }

  // Numbered marker (circle with digit) for step lists and diagrams.
  function num(slide, n, x, y, o = {}) {
    const d = o.d || 0.34;
    ellipse(slide, { x, y, w: d, h: d, fill: o.fill || K.ink, line: null });
    text(slide, String(n), { x, y, w: d, h: d, fontSize: o.size || 12, bold: true, color: o.color || K.white, align: 'center', valign: 'middle' });
  }

  // Structured speaker notes (plain text; one block per slide).
  function notes(slide, n) {
    const parts = [];
    if (n.script) parts.push(`SCRIPT (read aloud, about ${n.script.time})\n${n.script.text}`);
    if (n.time && !n.script) parts.push(`TIMING: ${n.time}`);
    parts.push(`WHAT TO SAY\n${n.say}`);
    parts.push(`TAKEAWAY\n${n.takeaway}`);
    if (n.visual) parts.push(`HOW TO EXPLAIN THE VISUAL\n${n.visual}`);
    if (n.why) parts.push(`WHY WE DID IT THIS WAY\n${n.why}`);
    if (n.careful) parts.push(`QUALIFY CAREFULLY\n${n.careful}`);
    if (n.q) parts.push(`LIKELY QUESTION\nQ: ${n.q}\nA: ${n.a}`);
    if (n.sources) parts.push(`SOURCES\n${n.sources}`);
    slide.addNotes(parts.join('\n\n'));
  }

  return { text, rect, ellipse, arrow, path, chip, chips, tag, comp, band, label, num, notes, mr, S };
}

module.exports = { W, H, MX, CW, TOP, BOT, K, EVIDENCE, STATUS, make, mr };
