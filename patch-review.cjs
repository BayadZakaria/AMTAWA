const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `      const { barcode, user, text, rating, language = 'en' } = req.body;
      
      // Save review to Supabase
      const { error: insertError } = await supabase.from('product_reviews').insert({
        barcode,
        user_name: user || 'Anonymous',
        rating,
        review_text: text
      });`;

const replacement = `      const { barcode, user, user_name, text, rating, language = 'en' } = req.body;
      
      // Save review to Supabase
      const { error: insertError } = await supabase.from('product_reviews').insert({
        barcode,
        user_name: user_name || user || 'Anonymous',
        rating,
        review_text: text
      });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success review patch");
} else {
  console.log("Target review not found!");
}
