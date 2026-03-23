import { FaCheck, FaTrash } from 'react-icons/fa';

import { UserRowItem } from '../../../types/backend';

export enum UserRowAction {
  Approve,
  Reject,
  Delete,
}

type Props = {
  item: UserRowItem;
  actions: UserRowAction[];
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
}

export function UserRow({ item, actions, onApprove, onReject, onDelete }: Props) {
  if (actions.includes(UserRowAction.Approve) && onApprove === undefined) {
    throw new Error('UserRow: Approve action requires onApprove callback');
  }
  if (actions.includes(UserRowAction.Reject) && onReject === undefined) {
    throw new Error('UserRow: Reject action requires onReject callback');
  }
  if (actions.includes(UserRowAction.Delete) && onDelete === undefined) {
    throw new Error('UserRow: Delete action requires onDelete callback');
  }

  return (
    <tr className="border-b border-gray-200 last:border-0">
      <td className="py-2 pr-4">{item.name}</td>
      <td className="py-2 pr-4">{item.email}</td>
      {item.role !== undefined && (
        <td className="py-2 pr-4">{item.role ?? '—'}</td>
      )}
      <td className="py-2 pr-4">{item.createDate}</td>
      <td className="py-2 flex gap-2">
        {actions.includes(UserRowAction.Approve) && (
          <button
            className="text-green-600 hover:text-green-800 p-1"
            onClick={onApprove}
            aria-label="Godkänn"
          >
            <FaCheck />
          </button>
        )}
        {actions.includes(UserRowAction.Reject) && (
          <button
            className="text-red-600 hover:text-red-800 p-1"
            onClick={onReject}
            aria-label="Avslå"
          >
            <FaTrash />
          </button>
        )}
        {actions.includes(UserRowAction.Delete) && item.role !== 'ADMIN' && (
          <button
            className="text-red-600 hover:text-red-800 p-1"
            onClick={onDelete}
            aria-label="Ta bort"
          >
            <FaTrash />
          </button>
        )}
      </td>
    </tr>
  );
}
