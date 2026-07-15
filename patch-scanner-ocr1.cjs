const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

const target1 = `  const [newImageBase64, setNewImageBase64] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);`;

const replacement1 = `  const [newImageBase64, setNewImageBase64] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
  console.log("Success Scanner 1");
} else {
  console.log("Target Scanner 1 not found!");
}
