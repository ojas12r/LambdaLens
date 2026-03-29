import fs from 'fs';
import path from 'path';

// Define the directories considered as backend code
const BACKEND_DIRS = ['app/api', 'lib', 'scripts/localstack'];
const OUTPUT_FILE = 'backend-codebase.md';

function generateTree(dir, prefix = '') {
  let output = '';
  if (!fs.existsSync(dir)) return output;

  const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(dir, file);
    const isLast = i === files.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    
    output += `${prefix}${marker}${file}\n`;
    
    if (fs.statSync(fullPath).isDirectory()) {
      output += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
    }
  }
  return output;
}

function processDirectory(dir, markdownContent = '') {
  if (!fs.existsSync(dir)) return markdownContent;

  const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      markdownContent = processDirectory(fullPath, markdownContent);
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.sh') || file.endsWith('.mjs')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      const ext = path.extname(file).slice(1);
      
      const langMap = {
        'ts': 'typescript',
        'js': 'javascript',
        'mjs': 'javascript',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'sh': 'bash'
      };
      
      const lang = langMap[ext] || ext;
      
      markdownContent += `\n### \`${relativePath}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
    }
  }
  
  return markdownContent;
}

let result = '# Backend Codebase Documentation\n\n## File Structure\n\n```text\n';

for (const dir of BACKEND_DIRS) {
  if (fs.existsSync(dir)) {
    result += `${dir}\n`;
    result += generateTree(dir);
  }
}

result += '```\n\n## Source Code\n';

for (const dir of BACKEND_DIRS) {
  result = processDirectory(dir, result);
}

fs.writeFileSync(OUTPUT_FILE, result);
console.log(`Successfully generated backend documentation to ${OUTPUT_FILE}`);
