import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { approveAccessRequest, fetchAccessRequests, rejectAccessRequest } from '../../communication/backend';
import { UserRow, UserRowAction, UserRowHeader } from '../../components/admin/user-row';
import { SLButton } from '../../components/common/sl-button';
import { ErrorHandler } from '../../components/error-handler';
import ErrorContext from '../../contexts/error-context';
import PageTitleContext from '../../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';
import { AccessRequestItem } from '../../types/backend';

export function PendingUsers() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleApprove(id: number) {
    const ok = await approveAccessRequest(id, setError);
    if (ok) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  }

  async function handleReject(id: number) {
    const ok = await rejectAccessRequest(id, setError);
    if (ok) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  }

  return (
    <main>
      <div className="flex flex-col space-y-2 px-2 mb-2">
        <ErrorHandler />
        {loading ? (
          <p className="text-gray-600">Laddar...</p>
        ) : (
          <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
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
                    onApprove={() => handleApprove(r.id)}
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
    </main>
  );
}
