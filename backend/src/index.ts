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

    console.log(process.env.NODE_ENV);
    console.log(process.env.API_KEY);
    initAliasDictionary();

    server.route({
        method: 'GET',
        path: '/api/email/{email}/aliases',
        handler: async (request: Request, h: ResponseToolkit) => {
            return getAliasUser(request.params.email);
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

const alias_dict: {[key: string]: { aliases:string[]} } = {}

function resolveAlias(alias: string){
    const result = {to: alias, from: null as null|any[]}
    if (Object.prototype.hasOwnProperty.call(alias_dict, alias)) {
        // Alias is an alias.
        alias_dict[alias].aliases.forEach((al) => {
            if (result.from === null) {
                result.from = [resolveAlias(al)]
            } else {
                result.from.push(resolveAlias(al));
            }
        })
    }
    return result
}

function getAliasUser(alias: string){
    return resolveAlias(alias)
}

async function initAliasDictionary() {
    await axios(options)
        .then((res: AxiosResponse<alias[]>) => {
            res.data.forEach((alias: alias) => {
                alias.goto.split(',').forEach((goto) => {
                    if (alias.active === 1) {
                        if (Object.prototype.hasOwnProperty.call(alias_dict, goto)) {
                            alias_dict[goto].aliases.push(alias.address)
                        } else {
                            alias_dict[goto] = { aliases: [alias.address]}
                        }
                    }
                })
            });
        })
        .catch(err => {
            console.log(err);
        });
}

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
