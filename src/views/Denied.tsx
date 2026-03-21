import { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { requestAccess } from '../communication/backend.ts';
import { SLButton } from '../components/common/sl-button';
import ErrorContext from '../contexts/error-context.ts';

export function Denied() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setError } = useContext(ErrorContext);

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const success = await requestAccess(email, message, setError);
    if (success) {
      setSubmitted(true);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-6 w-full max-w-md flex flex-col gap-4">
        <p className="text-gray-800">
          Endast godkända användare får logga in, ansök om godkännande nedan.
        </p>

        {submitted ? (
          <p className="text-gray-800 font-medium">Ansökan skickad.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600" htmlFor="email">E-post</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-gray-800 bg-white focus:outline-none focus:border-[#184fc2]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600" htmlFor="message">Meddelande (valfritt)</label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="border border-gray-300 rounded px-3 py-2 text-gray-800 bg-white focus:outline-none focus:border-[#184fc2] resize-none"
              />
            </div>
            <SLButton onClick={handleSubmit}>Skicka ansökan</SLButton>
          </div>
        )}

        <SLButton onClick={() => navigate('/')}>Tillbaka</SLButton>
      </div>
    </div>
  );
}
