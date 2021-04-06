import { Server, Request, ResponseToolkit } from "@hapi/hapi";
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';

type alias = {
    in_primary_domain: string
    id: number
    domain: string
    public_comment: string
    private_comment: string
    goto: string
    address: string
    is_catch_all: number
    active: number
    active_int: number
    sogo_visible: number
    sogo_visible_int: number
    created: string
    modified: string
};

var options = {
    method: 'GET',
    url: 'https://mail.gewis.nl/api/v1/get/alias/all',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY,
    }
} as AxiosRequestConfig;

const headers = {
    method: 'GET',
    url: 'mail.gewis.nl/api/v1/get/alias/all',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY,
    }
}

export const init = async () => {

    const server: Server = new Server({
        port: 3001,
        host: '0.0.0.0'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: async (request: Request, h: ResponseToolkit) => {
            const array = [];
            await axios(options)
                .then((res: AxiosResponse<alias[]>) => {
                    res.data.forEach((alias: alias) => {
                        if (alias.address.includes("@gewis.nl")) array.push(alias.address)
                    });
                    console.log(array)
                })
                .catch(err => {
                    console.log(err);
                });
            return "yooo"
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
