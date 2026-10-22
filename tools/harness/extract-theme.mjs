import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('/Applications/DeepSeek Harness.app/Contents/Resources/app.asar', 'utf8');
function grab(name) {
  const marker = `var ${name} = `;
  const at = src.indexOf(marker);
  if (at < 0) throw new Error('missing ' + name);
  let i = at + marker.length;
  if (src[i] !== '"') throw new Error('not a string: ' + name);
  let out = '';
  i += 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
    if (ch === '"') break;
    out += ch; i += 1;
  }
  return JSON.parse('"' + out + '"');
}
const parts = ['base_css_default', 'design_platform_css_default', 'corner_shape_css_default'].map((n) => {
  try { return `/* --- ${n} --- */\n` + grab(n); } catch (e) { console.error('skip', n, e.message); return ''; }
});
const css = `/* DSH host theme tokens, extracted from the installed DeepSeek Harness app.asar
   (ui-theme base.css / design-platform.css / corner-shape.css).
   Regenerate with: node tools/harness/extract-theme.mjs
   Do not hand-edit values; the harness only needs the --dsw-*/--ds-* custom properties. */
` + parts.join('\n\n') + `
/* --- harness host shell --- */
body{--dsw-alias-settings-card-fill:var(--dsw-alias-bg-layer-2);}
`;
writeFileSync('tools/harness/theme.css', css);
console.log('wrote tools/harness/theme.css', css.length, 'bytes');
