import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTrash } from 'react-icons/fa';

import { approveAccessRequest, fetchAccessRequests, rejectAccessRequest } from '../../communication/backend';
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
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 pr-4">Namn</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2 pr-4">Datum</th>
                    <th className="text-left py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b border-gray-200 last:border-0">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4">{r.email}</td>
                      <td className="py-2 pr-4">{r.createDate}</td>
                      <td className="py-2 flex gap-2">
                        <button
                          className="text-green-600 hover:text-green-800 p-1"
                          onClick={() => handleApprove(r.id)}
                          aria-label="Godkänn"
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 p-1"
                          onClick={() => handleReject(r.id)}
                          aria-label="Avslå"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
