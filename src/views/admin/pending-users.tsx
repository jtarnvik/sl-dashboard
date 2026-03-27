import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { approveAccessRequest, fetchAccessRequests, rejectAccessRequest } from '../../communication/backend';
import { UserRow, UserRowAction, UserRowHeader } from '../../components/admin/user-row';
import { ModalDialog } from '../../components/common/modal-dialog';
import { SLButton } from '../../components/common/sl-button';
import { ErrorHandler } from '../../components/error-handler';
import ErrorContext from '../../contexts/error-context';
import PageTitleContext from '../../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';
import { AccessRequestItem } from '../../types/backend';

function buildMailtoHref(email: string, name: string): string {
  const subject = encodeURIComponent('Välkommen till SL Dashboard');
  const body = encodeURIComponent(
    `Hej ${name}!\n\nDin ansökan till SL Dashboard har godkänts och du kan nu logga in.`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function PendingUsers() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedUser, setApprovedUser] = useState<AccessRequestItem | null>(null);

  useEffect(() => {
    setHeading('Väntande användare');
  }, []);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchAccessRequests(setError).then(data => {
      setRequests(data.slice().sort((a, b) => a.name.localeCompare(b.name, 'sv')));
      setLoading(false);
    });
  }, [loginState, user]);

  async function handleApprove(request: AccessRequestItem) {
    const ok = await approveAccessRequest(request.id, setError);
    if (ok) {
      setRequests(prev => prev.filter(r => r.id !== request.id));
      setApprovedUser(request);
      window.dispatchEvent(new Event('pendingCountChanged'));
    }
  }

  async function handleReject(id: number) {
    const ok = await rejectAccessRequest(id, setError);
    if (ok) {
      setRequests(prev => prev.filter(r => r.id !== id));
      window.dispatchEvent(new Event('pendingCountChanged'));
    }
  }

  return (
    <main>
      <div className="flex flex-col space-y-2 px-2 mb-2">
        <ErrorHandler />
        {loading ? (
          <p className="text-gray-600">Laddar...</p>
        ) : (
          <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow-sm p-4">
            {requests.length === 0 ? (
              <p className="text-gray-600">Inga väntande förfrågningar.</p>
            ) : (
              <div>
                <UserRowHeader showRoleLabel={false} />
                {requests.map(r => (
                  <UserRow
                    key={r.id}
                    item={r}
                    actions={[UserRowAction.ShowMessage, UserRowAction.Approve, UserRowAction.Reject]}
                    onApprove={() => handleApprove(r)}
                    onReject={() => handleReject(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
        </div>
      </div>

      {approvedUser && (
        <ModalDialog
          isOpen={true}
          onClose={() => setApprovedUser(null)}
          title="Ansökan godkänd"
          actions={
            <a
              href={buildMailtoHref(approvedUser.email, approvedUser.name)}
              className="rounded-sm bg-[#184fc2] text-sm text-white hover:bg-[#578ff3] p-[6px]"
            >
              Skicka välkomstmail
            </a>
          }
        >
          <p className="text-gray-800">
            <span className="font-medium">{approvedUser.name}</span> har lagts till som användare.
          </p>
        </ModalDialog>
      )}
    </main>
  );
}
