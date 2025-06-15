import { Server, Request } from '@hapi/hapi';
import MailCowClient from 'ts-mailcow-api';
import Joi from 'joi';
import env from './env';
import { createAliasDictionary, getAliasUser } from './routes/aliases';

export const mcc: MailCowClient = new MailCowClient(env.BASE_URL, env.API_KEY);

export const init = async () => {
  const server: Server = new Server({
    port: 9404,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/api/email/{email}/aliases',
    options: {
      validate: {
        params: Joi.object({
          email: Joi.string().email().required(),
        }),
        failAction: (_request, _h, err) => {
          // Throw validation error as a Boom 400
          throw err;
        },
      },
    },
    handler: (request: Request) => {
      const { email } = request.params as { email: string };
      return getAliasUser(email);
    },
  });

  await server.start();
  await createAliasDictionary();
  console.info('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});
