'use strict';
// Writes ../SCoPe_speaker_script.txt from script.js (run after editing the script).
const fs = require('fs');
const path = require('path');
const S = require('./script.js');

const NAMES = ['Title', 'The problem', 'JEPA, DINO-WM and existing work', 'RL formulation', 'System architecture', 'Evidence so far', 'Progress and next steps', 'References'];
const words = S.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
const secs = S.reduce((n, s) => { const [m, ss] = s.time.split(':').map(Number); return n + m * 60 + ss; }, 0);
let out = `SCoPe MID-REVIEW: SPEAKER SCRIPT (about ${Math.round(secs / 60)} minutes, ${words} words)\nReplace [TEAM MEMBERS] and [GUIDE NAME] with your names before presenting.\n`;
S.forEach((s, i) => { out += `\n=== Slide ${i + 1} - ${NAMES[i]} (${s.time}) ===\n\n${s.text}\n`; });
const file = path.join(__dirname, '..', 'SCoPe_speaker_script.txt');
fs.writeFileSync(file, out.replace(/\n/g, '\r\n'));
console.log(`wrote ${file}: ${words} words, ${(secs / 60).toFixed(1)} min of slide time`);
