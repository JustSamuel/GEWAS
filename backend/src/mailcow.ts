// mailcow.ts
import MailCowClient from 'ts-mailcow-api';
export type Env = { API_KEY: string; BASE_URL: string };

export function makeMailCowClient(env: Env) {
  return new MailCowClient(env.BASE_URL, env.API_KEY);
}
