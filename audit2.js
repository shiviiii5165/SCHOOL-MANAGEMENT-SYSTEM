const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

const availableIcons = Object.keys(lucide);

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(i => i.trim()).filter(Boolean);
        imports.forEach(i => {
          if (!availableIcons.includes(i)) {
            console.log('INVALID ICON:', i, 'in', fullPath);
          }
        });
      }
    }
  }
}
scanDir('./app');
scanDir('./components');
console.log('Scan complete.');
