import { NextResponse, type NextRequest } from 'next/server';
import { confirmParamsSchema, safeNextPath } from '@/features/auth/confirm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/*
 * Finishes the email links Supabase sends: confirming an email address and
 * recovering a password. We check the one-time code with Supabase, which
 * starts a session, and then send the person onward.
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
    console.error('email link verification failed', { code: error.code });
    return NextResponse.redirect(failure);
  }

  /* A recovery link always leads to the new password page, whatever "next" says */
  const destination =
    parsed.data.type === 'recovery' ? '/reset-password' : safeNextPath(params.get('next'));

  const success = request.nextUrl.clone();
  success.pathname = destination;
  success.search = '';
  return NextResponse.redirect(success);
}
