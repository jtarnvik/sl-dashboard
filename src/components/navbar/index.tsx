import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { SLButton } from "../common/sl-button";
import { useUser, useUserLoginState, UserLoginState } from "../../hook/use-user";
import PageTitleContext from '../../contexts/page-title-context';
import { SlLogo } from "./sl-logo";
import { NavMenu } from "./nav-menu";

export function Navbar() {
  const loginState = useUserLoginState();
  const { user, login, logout } = useUser();
  const { heading } = useContext(PageTitleContext);
  const navigate = useNavigate();

  const isLoggedIn = loginState === UserLoginState.LoggedIn;
  const isLoading = loginState === UserLoginState.Loading;
  const isOffline = loginState === UserLoginState.BackendOffline;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav
      className="bg-[#2870f0] fixed w-full z-20 top-0 inset-s-0 border-b border-gray-200 dark:border-gray-600">
      <div className="min-h-[53px] max-w-(--breakpoint-xl) flex flex-wrap items-center justify-between mx-auto p-2">
        <div className="flex space-x-2 text-white text-2xl items-center">
          <button onClick={() => navigate('/')} className="focus:outline-hidden cursor-pointer" aria-label="Gå till startsidan">
            <SlLogo />
          </button>
          <span>
            {heading}
          </span>
        </div>
        {isLoggedIn ? (
          <NavMenu logout={logout} isAdmin={isAdmin} />
        ) : isLoading ? (
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : isOffline ? null : (
          <SLButton onClick={login}>
            Logga in
          </SLButton>
        )}
      </div>
    </nav>
  );
}
