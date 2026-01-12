/**
 * InviteLink component - displays and copies the invite link
 */

import { useState } from 'react';

interface InviteLinkProps {
  inviteCode: string;
}

export function InviteLink({ inviteCode }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite Link</h3>
      <p className="text-sm text-gray-600 mb-3">
        Share this link with others to invite them to the group
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={inviteUrl}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Anyone with this link can join the group. If there are virtual
          members (people without accounts), the first person to join will claim the first
          available virtual member slot.
        </p>
      </div>
    </div>
  );
}
