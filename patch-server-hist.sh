sed -i '/const idToUseScan = req.body.userId || req.body.user_id;/,/}/d' server.ts
sed -i '/const userId = req.body.user?.id;/,/}/d' server.ts
