sed -i 's/parsedAi = JSON.parse(cleanJson);/try { parsedAi = JSON.parse(cleanJson); } catch(e) { console.error("Bad JSON", cleanJson); }/g' server.ts
