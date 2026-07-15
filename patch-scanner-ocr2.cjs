const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

const target2 = `  const handleAddCustomProduct = async (e: React.FormEvent) => {`;

const replacement2 = `  const handleExtractOCR = async () => {
    if (!newImageBase64) return;
    setIsExtractingOCR(true);
    try {
      const res = await fetch('/api/ocr-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: newImageBase64, language })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.productName) setNewProductName(data.productName);
        if (data.ingredients) setNewIngredients(data.ingredients);
      }
    } catch (e) {
      console.error("OCR Failed:", e);
    } finally {
      setIsExtractingOCR(false);
    }
  };

  const handleAddCustomProduct = async (e: React.FormEvent) => {`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
  console.log("Success Scanner 2");
} else {
  console.log("Target Scanner 2 not found!");
}
