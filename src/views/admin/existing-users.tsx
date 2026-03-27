import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteAllowedUser, fetchAllowedUsers } from '../../communication/backend';
import { UserRow, UserRowAction, UserRowHeader } from '../../components/admin/user-row';
import { SLButton } from '../../components/common/sl-button';
import { ErrorHandler } from '../../components/error-handler';
import ErrorContext from '../../contexts/error-context';
import PageTitleContext from '../../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';
import { AllowedUserItem } from '../../types/backend';

export function ExistingUsers() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [users, setUsers] = useState<AllowedUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeading('Användare');
  }, [setHeading]);

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
  }, [loginState, user, navigate, setError]);

  async function handleDelete(id: number) {
    const ok = await deleteAllowedUser(id, setError);
    if (ok) {
      setUsers(prev => prev.filter(u => u.id !== id));
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
            {users.length === 0 ? (
              <p className="text-gray-600">Inga användare.</p>
            ) : (
              <div>
                <UserRowHeader />
                {users.map(u => (
                  <UserRow
                    key={u.id}
                    item={u}
                    actions={[UserRowAction.Delete]}
                    onDelete={() => handleDelete(u.id)}
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
