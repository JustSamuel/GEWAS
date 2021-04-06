import { Server, Request, ResponseToolkit } from "@hapi/hapi";
export const init = async () => {
    const server: Server = new Server({
        port: 3001,
        host: 'localhost'
    });
    server.route({
        method: 'GET',
        path: '/',
        handler: (request: Request, h: ResponseToolkit) => {
            console.log(request + ", " + h)
            return 'Hello World!';
        }
    });
    await server.start();
    console.log('Server running on %s', server.info.uri);
};
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
