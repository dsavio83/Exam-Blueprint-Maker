const fs = require('fs');
const path = 'c:/Users/Dominic/OneDrive/Documents/blueprint-main/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '// --- Question & Answer Entry Component ---';
const endStr = '// --- Reports Component ---';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  let newContent = content.slice(0, startIdx) + content.slice(endIdx);
  
  const importStr = "import { QuestionEntryForm } from './components/QuestionEntryForm';";
  const lastImportIdx = newContent.lastIndexOf('import ');
  const insertIdx = newContent.indexOf('\n', lastImportIdx) + 1;
  newContent = newContent.slice(0, insertIdx) + importStr + '\n' + newContent.slice(insertIdx);
  
  fs.writeFileSync(path, newContent);
  console.log('Replaced successfully');
} else {
  console.log('Indices not found');
}
