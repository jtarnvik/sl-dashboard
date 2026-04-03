import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RxHamburgerMenu } from 'react-icons/rx';

import { deleteAccount, fetchAccessRequestCount } from '../../../communication/backend';
import { ModalDialog } from '../../common/modal-dialog';
import { SLButton } from '../../common/sl-button';
import ErrorContext from '../../../contexts/error-context';

type Props = {
  logout: () => void
  isAdmin: boolean
}

export function NavMenu({ logout, isAdmin }: Props) {
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function loadPendingCount() {
    const count = await fetchAccessRequestCount();
    setPendingCount(count);
  }

  useEffect(() => {
    if (isAdmin) {
      fetchAccessRequestCount().then(setPendingCount);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && menuOpen) {
      fetchAccessRequestCount().then(setPendingCount);
    }
  }, [isAdmin, menuOpen]);

  useEffect(() => {
    window.addEventListener('pendingCountChanged', loadPendingCount);
    return () => window.removeEventListener('pendingCountChanged', loadPendingCount);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPending = pendingCount !== null && pendingCount > 0;

  async function handleDeleteAccount() {
    setConfirmDeleteOpen(false);
    const success = await deleteAccount(setError);
    if (success) {
      await logout();
      navigate('/');
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="relative text-white text-2xl px-2 py-1 focus:outline-hidden hover:bg-[#578ff3] rounded-sm"
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Meny"
      >
        <RxHamburgerMenu />
        {hasPending && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center leading-none px-0.5">
            {pendingCount}
          </span>
        )}
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-sm shadow-lg z-30">
          {isAdmin && (
            <>
              <button
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${pendingCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-100'}`}
                onClick={() => { if (pendingCount !== 0) { navigate('/admin/pending'); setMenuOpen(false); } }}
                disabled={pendingCount === 0}
              >
                <span>Väntande användare</span>
                {hasPending && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center leading-none px-0.5">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                onClick={() => { navigate('/admin/users'); setMenuOpen(false); }}
              >
                Användare
              </button>
              <hr className="border-gray-200" />
            </>
          )}
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
            onClick={() => { window.dispatchEvent(new Event('openSettings')); setMenuOpen(false); }}
          >
            Inställningar
          </button>
          <hr className="border-gray-200" />
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
            onClick={() => { logout(); setMenuOpen(false); }}
          >
            Logga ut
          </button>
          <hr className="border-gray-200" />
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 text-sm"
            onClick={() => { setMenuOpen(false); setConfirmDeleteOpen(true); }}
          >
            Ta bort mitt konto
          </button>
          <hr className="border-gray-200" />
          <button
            className="w-full text-left px-4 py-2 text-gray-400 hover:bg-gray-100 text-xs"
            onClick={() => { navigate('/gdpr'); setMenuOpen(false); }}
          >
            Om din data
          </button>
        </div>
      )}
      <ModalDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Ta bort konto"
        actions={
          <SLButton onClick={handleDeleteAccount}>Ta bort</SLButton>
        }
      >
        <p>Är du säker på att du vill ta bort ditt konto? All din data raderas permanent och kan inte återställas.</p>
      </ModalDialog>
    </div>
  );
}
