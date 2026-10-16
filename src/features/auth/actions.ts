'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { credentialsSchema, forgotPasswordSchema, newPasswordSchema } from './schemas';
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

/*
 * Sends a password reset email. The answer is the same whether or not the
 * email has an account, so attackers cannot use this form to find out who
 * has one. Only a rate limit message is different, and it reveals nothing.
 */
export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { error: 'Enter a valid email address', notice: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error) {
    console.error('password reset request failed', { code: error.code });
    if (error.code === 'over_email_send_rate_limit') {
      return {
        error: 'Too many requests. Wait a few minutes and try again.',
        notice: null,
      };
    }
  }

  return {
    error: null,
    notice: 'If an account exists for that email, we have sent a link to reset your password.',
  };
}

/*
 * Saves the new password. This only works for someone who just used a valid
 * recovery link, because that link is what created their session. Afterwards
 * every other logged in device is signed out.
 */
export async function updatePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
      notice: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return {
      error: 'This reset link has expired. Please request a new one.',
      notice: null,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error('password update failed', { code: error.code });
    return {
      error: 'We could not change your password. Try a different password and try again.',
      notice: null,
    };
  }

  await supabase.auth.signOut({ scope: 'others' });
  redirect('/dashboard');
}
