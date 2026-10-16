import { NextResponse, type NextRequest } from 'next/server';
import { confirmParamsSchema, safeNextPath } from '@/features/auth/confirm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/*
 * Finishes email confirmation. Supabase emails the person a link to this
 * address. We check the one-time code with Supabase, which confirms the email
 * and starts a session, and then send the person onward.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const failure = request.nextUrl.clone();
  failure.pathname = '/login';
  failure.search = '?problem=confirm';

  const parsed = confirmParamsSchema.safeParse({
    token_hash: params.get('token_hash'),
    type: params.get('type'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(failure);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: parsed.data.type,
    token_hash: parsed.data.token_hash,
  });

  if (error) {
    console.error('email confirmation failed', { code: error.code });
    return NextResponse.redirect(failure);
  }

  const success = request.nextUrl.clone();
  success.pathname = safeNextPath(params.get('next'));
  success.search = '';
  return NextResponse.redirect(success);
}
