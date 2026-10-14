import { describe, expect, it } from 'vitest';
import { parseEnv, publicSchema, serverSchema } from './schemas';

describe('publicSchema', () => {
  it('uses the local address when nothing is set', () => {
    const result = publicSchema.parse({});
    expect(result.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('accepts a valid address', () => {
    const result = publicSchema.parse({
      NEXT_PUBLIC_APP_URL: 'https://example.com',
    });
    expect(result.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
  });

  it('rejects text that is not an address', () => {
    const result = publicSchema.safeParse({ NEXT_PUBLIC_APP_URL: 'not a url' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty address', () => {
    const result = publicSchema.safeParse({ NEXT_PUBLIC_APP_URL: '' });
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
    const twoProblems = publicSchema.extend({
      OTHER: serverSchema.shape.APP_ENV,
    });
    expect(() =>
      parseEnv(twoProblems, { NEXT_PUBLIC_APP_URL: 'nope nope', OTHER: 'banana' }, 'test'),
    ).toThrow(/NEXT_PUBLIC_APP_URL[\s\S]*OTHER/);
  });
});
