import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { clearHiddenDeviations, deleteAccount } from '../communication/backend';
import { ErrorHandler } from '../components/error-handler';
import { ModalDialog } from '../components/common/modal-dialog';
import { SLButton } from '../components/common/sl-button';
import ErrorContext from '../contexts/error-context';
import PageTitleContext from '../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user';

export function MyAccount() {
  const loginState = useUserLoginState();
  const { logout } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setHeading('Mitt konto');
  }, [setHeading]);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn) {
      navigate('/');
    }
  }, [loginState, navigate]);

  async function handleClearHiddenDeviations() {
    const success = await clearHiddenDeviations(setError);
    if (success) {
      window.dispatchEvent(new Event('hiddenDeviationsReset'));
    }
  }

  async function handleDeleteAccount() {
    setConfirmDeleteOpen(false);
    const success = await deleteAccount(setError);
    if (success) {
      await logout();
      navigate('/');
    }
  }

  return (
    <main>
      <div className="flex flex-col space-y-2 px-2 mb-2">
        <ErrorHandler />
        <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3">
          <button
            className="text-sm text-[#184fc2] hover:text-[#578ff3] cursor-pointer self-start"
            onClick={handleClearHiddenDeviations}
          >
            Återställ dolda avvikelser
          </button>
          <hr className="border-gray-200" />
          <button
            className="text-sm text-red-600 hover:text-red-800 cursor-pointer self-start"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Ta bort mitt konto
          </button>
          <hr className="border-gray-200" />
          <Link to="/gdpr" className="text-xs text-gray-400 hover:text-gray-600">
            Om din data
          </Link>
        </div>
        <div className="flex justify-end">
          <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
        </div>
      </div>
      <ModalDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Ta bort konto"
        actions={<SLButton onClick={handleDeleteAccount}>Ta bort</SLButton>}
      >
        <p>Är du säker på att du vill ta bort ditt konto? All din data raderas permanent och kan inte återställas.</p>
      </ModalDialog>
    </main>
  );
}
