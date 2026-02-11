import { config } from './config';
import { getApp } from './app';

const PORT = config.port;

void (async () => {
  const app = await getApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[tvdcontrol-backend] listening on :${PORT}`);
  });
})();
