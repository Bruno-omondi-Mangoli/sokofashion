import 'server-only';
import { parseEnv, serverSchema } from './schemas';

/*
 * Values here exist only on the server. Database keys and payment secrets
 * will be added to the schema in later phases. Never add the NEXT_PUBLIC_ prefix to a secret.
 */
export const serverEnv = parseEnv(serverSchema, { APP_ENV: process.env.APP_ENV }, 'server');
