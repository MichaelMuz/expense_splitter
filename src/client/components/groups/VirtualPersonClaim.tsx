/**
 * VirtualPersonClaim component - shows virtual members that can be claimed
 */

interface Member {
  id: string;
  name: string;
  userId: string | null;
}

interface VirtualPersonClaimProps {
  members: Member[];
}

export function VirtualPersonClaim({ members }: VirtualPersonClaimProps) {
  const virtualMembers = members.filter((m) => !m.userId);

  if (virtualMembers.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-yellow-900 mb-2">
        Virtual Members
      </h4>
      <p className="text-sm text-yellow-800 mb-3">
        The following members don't have accounts yet. When someone joins using
        the invite link, they will automatically claim one of these virtual
        member slots.
      </p>

      <div className="space-y-2">
        {virtualMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-yellow-300 rounded"
          >
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">
              {member.name}
            </span>
            <span className="text-xs text-gray-500">(Unclaimed)</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-yellow-700">
        Virtual members can still be included in expenses. They will be claimed
        in the order they were created when new users join.
      </p>
    </div>
  );
}
