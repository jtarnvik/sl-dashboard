import { useNavigate } from 'react-router-dom';

import { SLButton } from '../components/common/sl-button';

export function Denied() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-gray-800 text-lg">Du har inte behörighet att logga in.</p>
      <SLButton onClick={() => navigate('/')}>Tillbaka</SLButton>
    </div>
  );
}
