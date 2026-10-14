import { serverEnv } from '@/lib/env/server';

export function GET() {
  return Response.json({ status: 'ok', environment: serverEnv.APP_ENV });
}
