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
      className="flex flex-col gap-3 rounded-md border border-neutral-900 p-4"
    >
      <h2 id="invitations-heading" className="text-lg font-semibold">
        You have been invited
      </h2>
      <ul className="flex flex-col gap-3">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-col gap-2">
            <p className="text-base">
              Join <strong>{invitation.shopName}</strong> as {roleLabels[invitation.role]}
            </p>
            <form action={acceptInvitationAction}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <button
                type="submit"
                className="min-h-12 rounded-md bg-neutral-900 px-4 text-base font-medium text-white"
              >
                Accept invitation
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
