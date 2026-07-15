const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `        productReviews[barcode].push({ id: Date.now(), user: user || 'Anonymous', text, rating, date: new Date().toISOString() });`;

const replacement = `        productReviews[barcode].push({ id: Date.now(), user: user_name || user || 'Anonymous', text, rating, date: new Date().toISOString() });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success fallback review patch");
} else {
  console.log("Target fallback review not found!");
}
