const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            results.push(...scanDir(fullPath));
        } else if (file === 'route.ts') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('auth()') && !content.includes('requireAuth()') && !content.includes('authConfig')) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

const unprotected = scanDir(path.join(__dirname, 'app/api'));
console.log('Unprotected Routes:');
console.log(unprotected.join('\n'));
