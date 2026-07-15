sed -i 's/isAdditive: boolean, percent?: number}/isAdditive: boolean, isBad?: boolean, percent?: number}/' server.ts

sed -i 's/const isAdditive = name.toLowerCase().match(\/^e\\d{3,4}i?i?i?\/) != null || ing.id?.includes('\''en:e'\'');/const isAdditive = name.toLowerCase().match(\/^e\\d{3,4}i?i?i?\/) != null || ing.id?.includes('\''en:e'\'');\n              let isBad = isAdditive || name.toLowerCase().includes('\''sucre'\'') || name.toLowerCase().includes('\''sugar'\'') || name.toLowerCase().includes('\''palme'\'') || name.toLowerCase().includes('\''palm'\'') || name.toLowerCase().includes('\''glucose'\'') || name.toLowerCase().includes('\''fructose'\'');/' server.ts

sed -i 's/ingredientsDetailed.push({ name, isAllergen, isAdditive, percent: ing.percent_estimate });/ingredientsDetailed.push({ name, isAllergen, isAdditive, isBad, percent: ing.percent_estimate });/' server.ts

sed -i 's/const isAdditive = name.toLowerCase().match(\/^e\\d{3,4}i?i?i?\/) != null;/const isAdditive = name.toLowerCase().match(\/^e\\d{3,4}i?i?i?\/) != null;\n              let isBad = isAdditive || name.toLowerCase().includes('\''sucre'\'') || name.toLowerCase().includes('\''sugar'\'') || name.toLowerCase().includes('\''palme'\'') || name.toLowerCase().includes('\''palm'\'') || name.toLowerCase().includes('\''glucose'\'') || name.toLowerCase().includes('\''fructose'\'');/' server.ts

sed -i 's/ingredientsDetailed.push({ name, isAllergen, isAdditive });/ingredientsDetailed.push({ name, isAllergen, isAdditive, isBad });/' server.ts

