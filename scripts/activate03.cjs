const fs = require('fs');

let c = fs.readFileSync('tests/customer/03_zipCode.spec.ts', 'utf8');
// Activate skipped tests:
// 1. replace `// test.skip` with `test` (and same for inner lines)
// wait, the tests are block-commented out with `//`.
// We just need to remove `// ` at the start of the line from line 307 to end.

const lines = c.split('\\n');
for (let i = 306; i < lines.length; i++) {
    if (lines[i].startsWith('// test.skip')) {
        lines[i] = lines[i].replace('// test.skip', 'test');
    } else if (lines[i].startsWith('// ')) {
        lines[i] = lines[i].substring(3);
    } else if (lines[i].startsWith('//')) {
        lines[i] = lines[i].substring(2);
    }
}
fs.writeFileSync('tests/customer/03_zipCode.spec.ts', lines.join('\\n'));
console.log('Uncommented 03_zipCode.spec.ts successfully.');
