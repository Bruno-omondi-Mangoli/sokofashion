'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { credentialsSchema } from './schemas';
import type { AuthFormState } from './types';

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
      notice: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: 'We could not create that account. Try again, or use a different email.',
      notice: null,
    };
  }

  /*
   * When email confirmation is switched on, there is no session yet.
   * The same message is shown whether or not the email already exists.
   */
  if (!data.session) {
    return {
      error: null,
      notice: 'Check your email to confirm your account, then log in.',
    };
  }

  redirect('/dashboard');
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { error: 'Wrong email or password', notice: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  /* One message for every failure, so attackers cannot tell which emails exist */
  if (error) {
    return { error: 'Wrong email or password', notice: null };
  }

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
