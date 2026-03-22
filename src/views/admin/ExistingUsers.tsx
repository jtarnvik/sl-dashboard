import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

import { deleteAllowedUser, fetchAllowedUsers } from '../../communication/backend';
import { Navbar } from '../../components/navbar';
import { SLButton } from '../../components/common/sl-button';
import { ErrorHandler } from '../../components/error-handler';
import ErrorContext from '../../contexts/error-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';
import { AllowedUserItem } from '../../types/backend';

export function ExistingUsers() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const [users, setUsers] = useState<AllowedUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchAllowedUsers(setError).then(data => {
      setUsers(data.slice().sort((a, b) => a.name.localeCompare(b.name, 'sv')));
      setLoading(false);
    });
  }, [loginState, user]);

  async function handleDelete(id: number) {
    const ok = await deleteAllowedUser(id, setError);
    if (ok) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  }

  return (
    <>
      <Navbar heading="Användare" />
      <main>
        <div className="flex flex-col space-y-2 px-2 mb-2 mt-16">
          <ErrorHandler />
          {loading ? (
            <p className="text-gray-600">Laddar...</p>
          ) : (
            <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
              {users.length === 0 ? (
                <p className="text-gray-600">Inga användare.</p>
              ) : (
                <table className="w-full text-sm text-gray-800">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 pr-4">Namn</th>
                      <th className="text-left py-2 pr-4">Email</th>
                      <th className="text-left py-2 pr-4">Roll</th>
                      <th className="text-left py-2 pr-4">Datum</th>
                      <th className="text-left py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-200 last:border-0">
                        <td className="py-2 pr-4">{u.name}</td>
                        <td className="py-2 pr-4">{u.email}</td>
                        <td className="py-2 pr-4">{u.role ?? '—'}</td>
                        <td className="py-2 pr-4">{u.createDate}</td>
                        <td className="py-2">
                          {u.role !== 'ADMIN' && (
                            <button
                              className="text-red-600 hover:text-red-800 p-1"
                              onClick={() => handleDelete(u.id)}
                              aria-label="Ta bort"
                            >
                              <FaTrash />
                            </button>
                          )}
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
    </>
  );
}
