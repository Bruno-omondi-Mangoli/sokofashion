import { describe, expect, it } from 'vitest';
import { credentialsSchema } from './schemas';

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
