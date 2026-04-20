const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/AdminQuestionConsolidator.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Malayalam 'lam' (U+0D33 + U+0D02) or similar
// Tamil 'lam' (U+0BA3 + U+0BAE + U+0BCD)
const correctTamil = 'கேரளம்';
const incorrectMalayalam = 'கேர\u0D33\u0D02'; 

content = content.replace(/சமக்ர சிக்ஷா கேர\u0D33\u0D02/g, 'சமக்ர சிக்ஷா கேரளம்');
content = content.replace(/சமக்ர சிக்ஷா கேரளம்/g, 'சமக்ர சிக்ஷா கேரளம்'); // Just to be sure

fs.writeFileSync(filePath, content);
console.log('Fixed Malayalam characters in AdminQuestionConsolidator.tsx');
