import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IoShareOutline } from 'react-icons/io5';

import { fetchSharedRoute } from '../communication/backend.ts';
import { SldJourney } from '../components/pane/routes/sld-journey.tsx';
import { LoginTeaser } from '../components/pane/login-teaser';
import { SLButton } from '../components/common/sl-button';
import PageTitleContext from '../contexts/page-title-context.ts';
import { Journey } from '../types/sl-journeyplaner-responses.ts';

export function SharedRouteView() {
  const { id } = useParams<{ id: string }>();
  const { setHeading } = useContext(PageTitleContext);
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null | undefined>(undefined);

  const canShare = !!navigator.canShare?.({ url: window.location.href });

  async function handleShare() {
    await navigator.share({ title: 'Min resväg' });
  }

  useEffect(() => {
    setHeading('Min resväg');
    document.title = 'Min resväg';
    return () => { document.title = 'SL-Dashboard'; };
  }, [setHeading]);

  useEffect(() => {
    if (!id) {
      setJourney(null);
      return;
    }
    fetchSharedRoute(id).then(setJourney);
  }, [id]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {journey === undefined && (
        <p className="text-gray-500 text-sm">Hämtar resväg...</p>
      )}
      {journey === null && (
        <p className="text-gray-600">Länken har gått ut eller är ogiltig.</p>
      )}
      {journey && (
        <SldJourney
          journey={journey}
          deviationEnrichment={new Map()}
          alwaysExpanded={true}
        />
      )}
      <div className="mt-4">
        <LoginTeaser />
      </div>
      <div className="mt-4 flex justify-between items-center">
        {canShare
          ? <button onClick={handleShare} className="text-[#184fc2] hover:text-[#578ff3]" title="Dela resväg">
              <IoShareOutline size={24} />
            </button>
          : <span />
        }
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
    </div>
  );
}
