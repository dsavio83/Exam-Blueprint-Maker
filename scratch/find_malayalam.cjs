const fs = require('fs');
const glob = require('glob');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const pattern = '**/*.{ts,tsx,js,jsx,csv,html}';

glob.sync(pattern, { cwd: rootDir, ignore: ['node_modules/**', '.git/**', '.kilo/**'] }).forEach(file => {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('\u0D33') || content.includes('\u0D02')) {
        console.log(`Potential Malayalam character found in: ${file}`);
        // Let's see the context
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('\u0D33') || line.includes('\u0D02')) {
                console.log(`  L${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
