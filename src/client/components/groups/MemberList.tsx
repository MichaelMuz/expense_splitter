/**
 * MemberList component - displays group members with actions
 */

interface Member {
  id: string;
  name: string;
  role: string;
  userId: string | null;
  joinedAt: string;
  user?: {
    email?: string;
  } | null;
}

interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  isOwner?: boolean;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMember?: (memberId: string, name: string) => void;
}

export function MemberList({
  members,
  currentUserId,
  isOwner = false,
  onRemoveMember,
  onUpdateMember,
}: MemberListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRemove = (memberId: string, memberName: string) => {
    if (window.confirm(`Remove ${memberName} from this group?`)) {
      onRemoveMember?.(memberId);
    }
  };

  const handleRename = (memberId: string, currentName: string) => {
    const newName = prompt('Enter new name:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
      onUpdateMember?.(memberId, newName.trim());
    }
  };

  const currentUserMember = members.find((m) => m.userId === currentUserId);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Members ({members.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {members.map((member) => {
          const isVirtual = !member.userId;
          const isCurrentUser = member.userId === currentUserId;
          const canEdit = isOwner || isCurrentUser;
          const canRemove = isOwner && member.role !== 'owner';

          return (
            <div key={member.id} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    {member.role === 'owner' && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                        Owner
                      </span>
                    )}
                    {isVirtual && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                        Virtual
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                        You
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {member.user?.email && <p>{member.user.email}</p>}
                    <p>Joined {formatDate(member.joinedAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {canEdit && onUpdateMember && (
                    <button
                      onClick={() => handleRename(member.id, member.name)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Rename
                    </button>
                  )}
                  {canRemove && onRemoveMember && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                    >
                      Remove
                    </button>
                  )}
                  {!canEdit && !canRemove && isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
