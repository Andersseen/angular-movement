const fs = require('fs');

const pkgPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

// Add lint-staged config
pkg['lint-staged'] = {
  "*.ts": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.html": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{css,scss,less,md,json}": [
    "prettier --write"
  ]
};

// Add explicit lint script to scripts if missing
pkg.scripts['lint'] = "ng lint";
pkg.scripts['format'] = "prettier --write '**/*.{ts,html,css,scss,md,json}'";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json updated with lint-staged and scripts');
