import {Server, Request, ResponseToolkit} from "@hapi/hapi";
import env from "./envvars";
import MailCowClient from 'ts-mailcow-api';
import {createAliasDictionary, getAliasUser} from "./routes/aliases";
import {getCrazy88Scoreboard, getScores} from "./routes/intro";

export const mcc: MailCowClient = new MailCowClient(env.BASE_URL, env.API_KEY);

export const init = async () => {
    const server: Server = new Server({
        port: 9404,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*']
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/email/{email}/aliases',
        handler: async (request: Request, h: ResponseToolkit) => {
            return getAliasUser(request.params.email);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/intro21/scoreboard',
        handler: async (request: Request, h: ResponseToolkit) => {
            return getCrazy88Scoreboard();
        }
    });

    await server.start();
    await getScores();
    await createAliasDictionary();
    console.log('Server running on %s', server.info.uri);
};


process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
