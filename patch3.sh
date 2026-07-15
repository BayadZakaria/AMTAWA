sed -i "s/import('vite').then((viteModule) => { viteModule.createServer({/import('vite').then((viteModule) => viteModule.createServer({/g" server.ts
sed -i "s/    }).then(v => app.use(v.middlewares)); });/    }).then(v => app.use(v.middlewares));/g" server.ts
