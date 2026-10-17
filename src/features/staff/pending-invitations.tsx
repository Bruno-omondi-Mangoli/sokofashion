import { Button } from '@/components/ui/button';
import { acceptInvitationAction } from './actions';
import { roleLabels, type PendingInvitation } from './types';

type PendingInvitationsProps = {
  invitations: PendingInvitation[];
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="invitations-heading"
      className="bg-paper border-primary flex flex-col gap-4 rounded-xl border-2 p-5"
    >
      <h2 id="invitations-heading" className="font-display text-title text-ink">
        You have been invited
      </h2>
      <ul className="flex flex-col gap-4">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-col gap-3">
            <p className="text-base">
              Join <strong>{invitation.shopName}</strong> as {roleLabels[invitation.role]}
            </p>
            <form action={acceptInvitationAction}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <Button type="submit" className="w-full sm:w-auto">
                Accept invitation
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
