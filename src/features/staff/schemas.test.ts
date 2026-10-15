import { describe, expect, it } from 'vitest';
import { inviteStaffSchema } from './schemas';

describe('inviteStaffSchema', () => {
  it('accepts an attendant invitation', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'a@example.com',
      role: 'attendant',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a manager invitation', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'a@example.com',
      role: 'manager',
    });
    expect(result.success).toBe(true);
  });

  it('trims and lowercases the email', () => {
    const result = inviteStaffSchema.parse({
      email: '  Wanjiku@Example.COM ',
      role: 'attendant',
    });
    expect(result.email).toBe('wanjiku@example.com');
  });

  it('rejects an email that is not an email', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'not-an-email',
      role: 'attendant',
    });
    expect(result.success).toBe(false);
  });

  it('rejects the owner role', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'a@example.com',
      role: 'owner',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'a@example.com',
      role: 'boss',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing role', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'a@example.com',
      role: null,
    });
    expect(result.success).toBe(false);
  });
});
