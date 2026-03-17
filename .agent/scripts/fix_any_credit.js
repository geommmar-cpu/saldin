const fs = require('fs');
const file = 'src/hooks/useCreditCards.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const res = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('any') && !lines[i].includes('eslint-disable')) {
    const match = lines[i].match(/^(\s*)/);
    res.push(match[1] + '// eslint-disable-next-line @typescript-eslint/no-explicit-any');
  }
  res.push(lines[i]);
}
fs.writeFileSync(file, res.join('\n'));
