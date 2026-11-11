// Kiểm tĩnh: mọi data-act / data-chg / data-inp trong giao diện đều có hàm ACT tương ứng; không module, không fetch.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js');
const src = ['ui', 'ui-panels', 'ui-war', 'ui-replay', 'ui-cities', 'main'].map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n');
const used = new Set(); for (const m of src.matchAll(/data-(?:act|chg|inp)="([A-Za-z0-9_]+)"/g)) used.add(m[1]);
const have = new Set([...src.matchAll(/ACT\.([A-Za-z0-9_]+)\s*=/g)].map(m => m[1]));
const missing = [...used].filter(x => !have.has(x));
const all = fs.readdirSync(dir).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const bad = [/type="module"/, /\bfetch\(/, /XMLHttpRequest/, /\bimport\s+[\w{]/].filter(r => r.test(all)).map(String);
console.log('hành động trong giao diện: ' + used.size + ', thiếu hàm xử lý: ' + (missing.length ? missing.join(', ') : 'không') + '; mẫu cấm (module/fetch): ' + (bad.length ? bad.join(', ') : 'không'));
process.exit(missing.length || bad.length ? 1 : 0);
