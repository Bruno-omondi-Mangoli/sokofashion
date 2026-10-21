import { publicEnv } from '@/lib/env/public';
import { buildPublicUrl } from './paths';

export function publicPhotoUrl(path: string): string {
  return buildPublicUrl(publicEnv.NEXT_PUBLIC_SUPABASE_URL, path);
}
