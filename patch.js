import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'Nutriscore: ${scanResult.nutriscore}\nPerform a rigorous "Yuka-style"',
  'Nutriscore: ${scanResult.nutriscore}${medicalContextStr}\nPerform a rigorous "Yuka-style"'
);

content = content.replace(
  '// --- NEW: AI-Driven Nutritional Analysis (Yuka-style) ---',
  `let medicalContextStr = '';
      if (userAllergyList.length > 0) {
        medicalContextStr += \`\\nUser Allergies: \${userAllergyList.join(', ')}\`;
      }
      if (warnings.length > 0) {
        medicalContextStr += \`\\nHealth Warnings for User: \${warnings.join('; ')}\`;
      }

      // --- NEW: AI-Driven Nutritional Analysis (Yuka-style) ---`
);

fs.writeFileSync('server.ts', content, 'utf8');
