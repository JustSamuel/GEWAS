import Joi from 'joi';
import {getAliasUser} from '../services/alias-service';

/**
 * Registers the email alias API endpoint on the Hapi server.
 *
 * @param server - The Hapi server instance to attach the route to.
 */
export function registerEmailAliasRoute(server: import('@hapi/hapi').Server) {
  server.route({
    method: 'GET',
    path: '/api/v1/email/{email}/aliases',
    options: {
      validate: {
        params: Joi.object({
          email: Joi.string().email().required(),
        }),
        failAction: (_request, _h, err) => {
          // Throws fast on validation errors, per Hapi standards.
          throw err;
        },
      },
      tags: ['api', 'aliases'],
      description: 'Get all aliases and forwards for an email address',
      notes: 'Returns a nested structure describing all aliases/forwards for the given email.',
    },
    handler: (request, h) => {
      const { email } = request.params as { email: string };
      try {
        return getAliasUser(email);
      } catch (error) {
          const errorMsg =
              error instanceof Error
                  ? error.message
                  : typeof error === 'string'
                      ? error
                      : JSON.stringify(error);
          request.log(['error'], `Failed to get aliases for ${email}: ${errorMsg}`);
          return h
              .response({
                  statusCode: 500,
                  error: 'Internal Server Error',
                  message: 'Failed to retrieve aliases.',
              })
              .code(500);
      }
    },
  });
}
