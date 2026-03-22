import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RxHamburgerMenu } from 'react-icons/rx';

type Props = {
  logout: () => void
}

export function NavMenu({ logout }: Props) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-white text-2xl px-2 py-1 focus:outline-none hover:bg-[#578ff3] rounded"
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Meny"
      >
        <RxHamburgerMenu />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded shadow-lg z-30">
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
            onClick={() => { navigate('/admin/pending'); setMenuOpen(false); }}
          >
            Väntande användare
          </button>
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
            onClick={() => { navigate('/admin/users'); setMenuOpen(false); }}
          >
            Användare
          </button>
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
            onClick={() => { logout(); setMenuOpen(false); }}
          >
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
