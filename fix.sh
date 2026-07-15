sed -i '/} catch (error: any) {/i\
      res.json(scanResult);' server.ts
sed -i '452d' server.ts
