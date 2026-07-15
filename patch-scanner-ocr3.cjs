const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

const target3 = `            </div>

            <button
              type="submit" disabled={addingProduct}`;

const replacement3 = `              {newImageBase64 && (
                <button
                  type="button"
                  onClick={handleExtractOCR}
                  disabled={isExtractingOCR}
                  className="w-full mt-3 bg-slate-800 text-white rounded-xl px-4 py-3 font-bold hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isExtractingOCR ? <Search className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isExtractingOCR 
                    ? (language === 'fr' ? 'Extraction en cours...' : 'Extracting text...') 
                    : (language === 'fr' ? 'Extraire nom & ingrédients (OCR)' : 'Auto-fill from photo (OCR)')}
                </button>
              )}
            </div>

            <button
              type="submit" disabled={addingProduct}`;

if (content.includes(target3)) {
  content = content.replace(target3, replacement3);
  fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
  console.log("Success Scanner 3");
} else {
  console.log("Target Scanner 3 not found!");
}
