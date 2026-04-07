const fs = require('fs');
const path = require('path');

const dir = './projects/movement/src/lib/directives';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const matches = [...content.matchAll(/#([a-zA-Z0-9_]+)/g)];
  const privateFields = new Set(matches.map(m => m[1]));

  privateFields.forEach(field => {
    // replace `this.field` with `this.#field`
    const regex = new RegExp("this\\\\." + field + "\\\\b", "g");
    const regexCorrect = new RegExp("this\\." + field + "\\b", "g");
    content = content.replace(regexCorrect, "this.#" + field);
  });

  fs.writeFileSync(filePath, content);
});

console.log('Fixed this. usages for `#` fields');
