// Геометрия логотипа из приложения → assets/js/logo-data.js.
//
// Источник один — ../Pathway/src/ui/logo-geometry.ts (его генерирует
// assets/logo-anim в приложении). Сайт берёт оттуда же, чтобы сборка логотипа
// на странице совпадала с заставкой в приложении кадр в кадр.
// Запуск из корня сайта: node tools/sync-logo.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(site, '..', 'Pathway', 'src', 'ui', 'logo-geometry.ts');
const ts = fs.readFileSync(src, 'utf8');

const str = (name) => ts.match(new RegExp(`export const ${name} =\\s*'([^']+)'`))[1];
const nums = (name) => ts.match(new RegExp(`export const ${name}[^=]*= \\[([^\\]]+)\\]`))[1].split(',').map(Number);
const point = (name) => {
  const m = ts.match(new RegExp(`export const ${name} = \\{ x: ([\\d.-]+), y: ([\\d.-]+) \\}`));
  return { x: Number(m[1]), y: Number(m[2]) };
};
const bands = [...ts.match(/ROAD_BANDS[^=]*= \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const data = {
  road: str('ROAD_PATH'),
  arrow: str('ARROW_PATH'),
  bands,
  routeX: nums('ROUTE_X'),
  routeY: nums('ROUTE_Y'),
  anchor: point('ARROW_ANCHOR'),
  tip: point('ARROW_TIP'),
  finalAngle: Number(ts.match(/ARROW_FINAL_ANGLE = ([\d.-]+)/)[1]),
};

const out = path.join(site, 'assets', 'js', 'logo-data.js');
fs.writeFileSync(
  out,
  `// Сгенерировано tools/sync-logo.mjs из приложения — не править.\nwindow.PATHWAY_LOGO = ${JSON.stringify(data)};\n`,
);
console.log(`записано: ${path.relative(site, out)}, полос: ${bands.length}`);
