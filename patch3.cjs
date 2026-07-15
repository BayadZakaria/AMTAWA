const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

const target = `{ing.percent ? <span className="opacity-40 text-[8px] font-normal mt-0.5">{ing.percent < 1 ? ing.percent.toFixed(1) : Math.round(ing.percent)}%</span> : null}`;

const replacement = `{ing.percent ? <span className="opacity-40 text-[8px] font-normal mt-0.5">{ing.percent < 1 ? (ing.percent < 0.1 ? '< 0.1' : ing.percent.toFixed(1).replace(/\\.0$/, '')) : Math.round(ing.percent)}%</span> : null}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
  console.log("Success 3");
} else {
  console.log("Target 3 not found!");
}
