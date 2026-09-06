const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src');

const replacements = {
  'green-50': 'blue-50',
  'green-100': 'blue-100',
  'green-200': 'blue-200',
  'green-300': 'blue-300',
  'green-400': 'blue-400',
  'green-500': 'blue-600',
  'green-600': 'blue-700',
  'green-700': 'blue-800',
  '#4CAF50': '#2563EB',
  '#22C55E': '#2563EB',
  '#16A34A': '#2563EB',
  '#15803D': '#2563EB',
  '#10B981': '#2563EB',
  '#059669': '#2563EB',
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(jsx|js|css)$/.test(file)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [from, to] of Object.entries(replacements)) {
        if (content.includes(from)) {
          content = content.split(from).join(to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated:', full);
      }
    }
  }
}

walk(root);
console.log('Color replacement completed.');