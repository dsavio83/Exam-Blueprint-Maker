const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.match(/\.(ts|tsx|js|jsx|csv|html)$/)) {
                results.push(file);
            }
        }
    });
    return results;
}

const rootDir = path.join(__dirname, '..');
walk(rootDir).forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('\u0D33') || content.includes('\u0D02')) {
        console.log(`Potential Malayalam character found in: ${path.relative(rootDir, filePath)}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('\u0D33') || line.includes('\u0D02')) {
                console.log(`  L${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
