const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next' && item.name !== '.git') {
        files = files.concat(scanDir(full));
      }
    } else if (/\.(tsx|ts|jsx|js|json|css|md)$/.test(item.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = scanDir('src');
const pictographicRegex = /\p{Extended_Pictographic}/u;

console.log('--- EXTENDED PICTOGRAPHIC AUDIT IN src/ ---');
let count = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(pictographicRegex);
    if (match) {
      console.log(`${file}:${idx + 1}: [${match[0]}] in line: ${line.trim().slice(0, 80)}`);
      count++;
    }
  });
}
console.log('Total Extended_Pictographic found in src/:', count);
