sed -i '/res.json(plan);/a\
    } catch (error: any) {' server.ts
