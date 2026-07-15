sed -i "s/    const vite = createViteServer({/    import('vite').then((viteModule) => { viteModule.createServer({/g" server.ts
sed -i "s/    vite.then(v => app.use(v.middlewares));/    }).then(v => app.use(v.middlewares)); });/g" server.ts
