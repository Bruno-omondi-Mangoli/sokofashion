import { describe, expect, it } from 'vitest';
import { parseEnv, publicSchema, serverSchema } from './schemas';

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'a-long-enough-placeholder-key',
};

describe('publicSchema', () => {
  it('uses the local address when no app address is set', () => {
    const result = publicSchema.parse(validPublic);
    expect(result.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('accepts a valid app address', () => {
    const result = publicSchema.parse({
      ...validPublic,
      NEXT_PUBLIC_APP_URL: 'https://example.com',
    });
    expect(result.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
  });

  it('rejects an app address that is not an address', () => {
    const result = publicSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_APP_URL: 'not a url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty app address', () => {
    const result = publicSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_APP_URL: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing Supabase address', () => {
    const result = publicSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validPublic.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a Supabase address that is not an address', () => {
    const result = publicSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_SUPABASE_URL: 'nope',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing or too short publishable key', () => {
    const result = publicSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('serverSchema', () => {
  it('defaults to local when nothing is set', () => {
    expect(serverSchema.parse({}).APP_ENV).toBe('local');
  });

  it('accepts staging and production', () => {
    expect(serverSchema.parse({ APP_ENV: 'staging' }).APP_ENV).toBe('staging');
    expect(serverSchema.parse({ APP_ENV: 'production' }).APP_ENV).toBe('production');
  });

  it('rejects an unknown environment name', () => {
    expect(serverSchema.safeParse({ APP_ENV: 'banana' }).success).toBe(false);
  });

  it('rejects the wrong letter case', () => {
    expect(serverSchema.safeParse({ APP_ENV: 'Production' }).success).toBe(false);
  });
});

describe('parseEnv', () => {
  it('returns the clean values when the input is valid', () => {
    const result = parseEnv(serverSchema, { APP_ENV: 'staging' }, 'server');
    expect(result.APP_ENV).toBe('staging');
  });

  it('throws an error naming the group and the bad variable', () => {
    expect(() => parseEnv(serverSchema, { APP_ENV: 'banana' }, 'server')).toThrow(
      /Invalid server environment variables[\s\S]*APP_ENV/,
    );
  });

  it('lists every problem in one error', () => {
    expect(() =>
      parseEnv(
        publicSchema,
        {
          NEXT_PUBLIC_APP_URL: 'nope nope',
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validPublic.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        'public',
      ),
    ).toThrow(/NEXT_PUBLIC_APP_URL[\s\S]*NEXT_PUBLIC_SUPABASE_URL/);
  });
});
