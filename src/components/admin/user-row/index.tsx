import { FaCheck, FaTrash } from 'react-icons/fa';

import { UserRowItem } from '../../../types/backend';
import './index.css';

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

export function UserRowHeader() {
  return (
    <div className="user-row user-row-header">
      <div className="user-row-name">Namn</div>
      <div className="user-row-role">Roll</div>
      <div className="user-row-email">Email</div>
      <div className="user-row-date">Datum</div>
      <div className="user-row-actions"></div>
    </div>
  );
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
    <div className="user-row">
      <div className="user-row-name">{item.name}</div>
      <div className="user-row-role">
        {item.role != null && <span>{item.role}</span>}
      </div>
      <div className="user-row-email">{item.email}</div>
      <div className="user-row-date">{item.createDate}</div>
      <div className="user-row-actions">
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
      </div>
    </div>
  );
}
