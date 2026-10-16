import { describe, expect, it } from 'vitest';
import { confirmParamsSchema, safeNextPath } from './confirm';

describe('confirmParamsSchema', () => {
  it('accepts a normal confirmation link', () => {
    const result = confirmParamsSchema.safeParse({
      token_hash: 'abcdef1234567890',
      type: 'email',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a password recovery link', () => {
    const result = confirmParamsSchema.safeParse({
      token_hash: 'abcdef1234567890',
      type: 'recovery',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a type that this route does not handle', () => {
    const result = confirmParamsSchema.safeParse({
      token_hash: 'abcdef1234567890',
      type: 'magiclink',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing token', () => {
    const result = confirmParamsSchema.safeParse({
      token_hash: null,
      type: 'email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a token that is too short', () => {
    const result = confirmParamsSchema.safeParse({
      token_hash: 'abc',
      type: 'email',
    });
    expect(result.success).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('allows the dashboard', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard');
  });

  it('allows onboarding', () => {
    expect(safeNextPath('/onboarding')).toBe('/onboarding');
  });

  it('refuses a full address on another website', () => {
    expect(safeNextPath('https://evil.example')).toBe('/dashboard');
  });

  it('refuses an address that starts with two slashes', () => {
    expect(safeNextPath('//evil.example')).toBe('/dashboard');
  });

  it('refuses a path that is not on the list', () => {
    expect(safeNextPath('/admin')).toBe('/dashboard');
  });

  it('falls back to the dashboard when nothing is given', () => {
    expect(safeNextPath(null)).toBe('/dashboard');
  });
});
