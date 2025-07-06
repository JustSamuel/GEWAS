import { Server } from '@hapi/hapi';
import MailCowClient from 'ts-mailcow-api';
import log4js from 'log4js';
import { registerEmailAliasRoute } from './routes/aliases';
import { createAliasDictionary } from './services/alias-service';

log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: 'info' } },
});
const logger = log4js.getLogger('app');

type Env = { API_KEY: string; BASE_URL: string };
const env: Env = {
  API_KEY: process.env.API_KEY ?? '',
  BASE_URL: process.env.BASE_URL ?? '',
};
if (!env.API_KEY || !env.BASE_URL) {
  logger.fatal('Missing environment variables: API_KEY and/or BASE_URL');
  process.exit(1);
}

export const mcc: MailCowClient = new MailCowClient(env.BASE_URL, env.API_KEY);

export const init = async () => {
  const server: Server = new Server({
    port: process.env.PORT ? Number(process.env.PORT) : 9404,
    host: '0.0.0.0',
    routes: {
      cors: { origin: ['*'] },
    },
  });

  registerEmailAliasRoute(server);

  try {
    await createAliasDictionary();
    await server.start();
    logger.info(`Server running on ${server.info.uri}`);
  } catch (err) {
    logger.fatal('Server failed to start:', err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    try {
      await server.stop({ timeout: 10000 });
      logger.warn('Server stopped.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('unhandledRejection', (err) => {
    logger.fatal('UNHANDLED REJECTION', err);
    process.exit(1);
  });
};

if (require.main === module) {
  void init();
}
