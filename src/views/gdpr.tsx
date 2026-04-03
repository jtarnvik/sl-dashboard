import { useNavigate } from 'react-router-dom';

import { SLButton } from '../components/common/sl-button';

export function Gdpr() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-gray-800">
      <div className="mb-4">
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
      <h1 className="text-2xl font-bold mb-1">Om din data</h1>
      <p className="text-xs text-gray-400 mb-6">Senast uppdaterad: april 2026</p>

      <p className="mb-6">
        Den här tjänsten är ett litet hobbyprojekt för pendlingsinformation i Stockholm. Vi tar din
        integritet på allvar och samlar bara in det vi faktiskt behöver.
      </p>

      <h2 className="text-lg font-semibold mb-2">Vad vi lagrar</h2>
      <p className="mb-6">
        Vi lagrar ditt namn och din e-postadress. Dessa hämtas från ditt Google-konto när du loggar
        in och används enbart för att identifiera dig i tjänsten.
      </p>

      <h2 className="text-lg font-semibold mb-2">Varför vi lagrar det</h2>
      <p className="mb-6">
        Vi lagrar dina uppgifter för att du ska kunna logga in och använda tjänsten. Uppgifterna
        delas inte med någon utomstående och används inte i marknadsföringssyfte.
      </p>

      <h2 className="text-lg font-semibold mb-2">Var lagras det</h2>
      <p className="mb-6">
        Tjänsten körs på Render med servrar i Frankfurt och din data lagras i Supabase med servrar i
        Irland — båda inom EU. Data krypteras i vila och lämnar aldrig EU.
      </p>

      <h2 className="text-lg font-semibold mb-2">Dina rättigheter</h2>
      <p className="mb-6">
        Enligt GDPR har du rätt att få din data raderad. Du kan när som helst ta bort all din data
        via menyn i appen. Om du har frågor om hur dina uppgifter hanteras är du välkommen att
        kontakta oss direkt.
      </p>

      <p className="text-xs text-gray-400">
        Den rättsliga grunden för behandlingen av dina personuppgifter är fullgörande av avtal
        (GDPR artikel 6.1 b) — det vill säga att vi behöver uppgifterna för att kunna
        tillhandahålla tjänsten du registrerat dig för.
      </p>
    </div>
  );
}
