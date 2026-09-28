import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const srcFiles = fs.readdirSync('src').filter(f => f.endsWith('.js'));
const missingSelectors = [];

for (const file of srcFiles) {
  const code = fs.readFileSync('src/' + file, 'utf8');
  const matches = [...code.matchAll(/querySelector(All)?\(['"]([^'"]+)['"]\)/g)];
  for (const m of matches) {
    const sel = m[2];
    // check classes or basic selectors
    if (sel.startsWith('.')) {
      const cls = sel.slice(1).split(/[\s:\[\.]/)[0];
      if (!html.includes(`class="`) || !html.includes(cls)) {
        missingSelectors.push({ file, sel, cls });
      }
    }
  }
}

console.log('Class selectors check complete:');
if (missingSelectors.length === 0) {
  console.log('ALL class selectors referenced in src/*.js exist in index.html!');
} else {
  console.log('Potential missing class selectors:', missingSelectors);
}
