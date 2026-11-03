'use strict';
// Writes docs/mid_review/references.md from refs.js, so the slides and the list never disagree.
//   cd docs/mid_review/src && node write_references.js
const fs = require('fs');
const path = require('path');
const REFS = require('./refs');

const TYPE = { 'peer-reviewed': 'peer-reviewed', preprint: 'preprint (not peer-reviewed)', workshop: 'workshop paper', position: 'position paper (not peer-reviewed)', code: 'code and data release' };
const lines = [
  '# SCoPe mid-review: references',
  '',
  'Numbered as cited on the slides ([n]). Each entry was checked against its arXiv listing, proceedings page or publisher page in October 2026. The type column separates peer-reviewed work from preprints and other sources.',
  '',
  '| # | Reference | Type | Link |',
  '|---|---|---|---|',
  ...REFS.map((r) => `| ${r.n} | ${r.text.replace(/\|/g, '/')} | ${TYPE[r.type]} | [${r.url.replace(/^https?:\/\//, '')}](${r.url}) |`),
  '',
];
fs.writeFileSync(path.resolve(__dirname, '..', 'references.md'), lines.join('\n'));
console.log(`wrote references.md (${REFS.length} entries)`);
