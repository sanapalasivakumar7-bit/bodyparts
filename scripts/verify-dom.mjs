import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const srcFiles = fs.readdirSync('src').filter(f => f.endsWith('.js'));
const missingIds = [];

for (const file of srcFiles) {
  const code = fs.readFileSync('src/' + file, 'utf8');
  const matches = [...code.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)];
  for (const m of matches) {
    const id = m[1];
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      missingIds.push({ file, id });
    }
  }
}

console.log('Missing IDs check complete:');
if (missingIds.length === 0) {
  console.log('ALL DOM IDs in src/*.js are present in index.html! (0 missing)');
} else {
  console.error('Found missing IDs:', missingIds);
}
