/**
 * GroupCard component - displays a group summary card
 */

interface Member {
  id: string;
  name: string;
  role: string;
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    createdAt: string;
    members: Member[];
    _count?: {
      expenses: number;
    };
  };
  onClick?: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white shadow rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
          <p className="text-sm text-gray-500">
            Created {formatDate(group.createdAt)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Members:</span>
          <span className="font-medium text-gray-900">
            {group.members.length}
          </span>
        </div>

        {group._count && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Expenses:</span>
            <span className="font-medium text-gray-900">
              {group._count.expenses}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {group.members.slice(0, 3).map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded"
            >
              {member.name}
            </span>
          ))}
          {group.members.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded">
              +{group.members.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
