const fs = require('fs');
const path = require('path');

const files = [
    'components/AnswerKeyView.tsx',
    'services/docExport.ts',
    'services/massViewExport.ts'
];

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const oldContent = content;
    
    content = content.replace(/சமக்ர சிக்ஷா கேர\u0D33\u0D02/g, 'சமக்ர சிக்ஷா கேரளம்');
    
    if (content !== oldContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed Malayalam characters in ${file}`);
    } else {
        console.log(`No changes needed in ${file}`);
    }
});
