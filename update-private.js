const fs = require('fs');
const path = require('path');

const dir = './projects/movement/src/lib/directives';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace `private readonly xyz = ` with `readonly #xyz = `
  content = content.replace(/private\s+readonly\s+([a-zA-Z0-9_]+)\s*=/g, 'readonly #$1 =');
  
  // Replace `private xyz = ` or `private xyz: ` with `#xyz = ` or `#xyz: `
  content = content.replace(/private\s+([a-zA-Z0-9_]+)(\s*[:=])/g, '#$1$2');

  // Replace usages of the private variables we know exist
  const privateVars = ['defaults', 'documentRef', 'host', 'engine', 'stagger', 'player', 'overlay', 'registry'];
  
  privateVars.forEach(v => {
    // replace `this.xyz` with `this.#xyz`
    const regex = new RegExp(`this\\.${v}\\b`, 'g');
    content = content.replace(regex, `this.#${v}`);
  });

  fs.writeFileSync(filePath, content);
});

console.log('Successfully updated directives to use #');
