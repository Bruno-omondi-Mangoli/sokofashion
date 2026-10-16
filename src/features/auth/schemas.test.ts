import { describe, expect, it } from 'vitest';
import { credentialsSchema, forgotPasswordSchema, newPasswordSchema } from './schemas';

describe('credentialsSchema', () => {
  it('trims and lowercases the email', () => {
    const result = credentialsSchema.parse({
      email: '  Bruno@Example.COM ',
      password: 'longenough1',
    });
    expect(result.email).toBe('bruno@example.com');
  });

  it('rejects an email that is not an email', () => {
    const result = credentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'longenough1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = credentialsSchema.safeParse({
      email: 'a@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a password of exactly 8 characters', () => {
    const result = credentialsSchema.safeParse({
      email: 'a@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a password longer than 72 characters', () => {
    const result = credentialsSchema.safeParse({
      email: 'a@example.com',
      password: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields, which is what an empty form sends', () => {
    const result = credentialsSchema.safeParse({ email: null, password: null });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('trims and lowercases the email', () => {
    const result = forgotPasswordSchema.parse({
      email: '  Wanjiku@Example.COM ',
    });
    expect(result.email).toBe('wanjiku@example.com');
  });

  it('rejects an email that is not an email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it('accepts two matching passwords', () => {
    const result = newPasswordSchema.safeParse({
      password: 'longenough1',
      confirmPassword: 'longenough1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects passwords that do not match', () => {
    const result = newPasswordSchema.safeParse({
      password: 'longenough1',
      confirmPassword: 'longenough2',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = newPasswordSchema.safeParse({
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 72 characters', () => {
    const long = 'a'.repeat(73);
    const result = newPasswordSchema.safeParse({
      password: long,
      confirmPassword: long,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = newPasswordSchema.safeParse({
      password: null,
      confirmPassword: null,
    });
    expect(result.success).toBe(false);
  });
});
