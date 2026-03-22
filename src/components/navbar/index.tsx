import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SLButton } from "../common/sl-button";
import { useUser, useUserLoginState, UserLoginState } from "../../hook/use-user";
import { SlLogo } from "./sl-logo";

type Props = {
  heading: string
}

export function Navbar({ heading }: Props) {
  const loginState = useUserLoginState();
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = loginState === UserLoginState.LoggedIn;
  const isLoading = loginState === UserLoginState.Loading;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loginEnabled = import.meta.env.VITE_FEATURE_LOGIN === 'true';

  return (
    <nav
      className="bg-[#2870f0] fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="min-h-[53px] max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-2">
        <div className="flex space-x-2 text-white text-2xl">
          <SlLogo />
          <span>
            {heading}
          </span>
        </div>
        {loginEnabled && (
          isLoggedIn && isAdmin ? (
            <div className="relative" ref={menuRef}>
              <button
                className="text-white text-2xl px-2 py-1 focus:outline-none hover:bg-[#578ff3] rounded"
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="Meny"
              >
                ☰
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
          ) : (
            <SLButton onClick={isLoggedIn ? logout : login} disabled={isLoading}>
              {isLoggedIn ? "Logga ut" : "Logga in"}
            </SLButton>
          )
        )}
      </div>
    </nav>
  );
}
