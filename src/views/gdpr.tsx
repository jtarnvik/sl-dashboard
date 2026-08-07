import { useNavigate } from 'react-router-dom';

import { CONTACT_EMAIL } from '../communication/constant';
import { SLButton } from '../components/common/sl-button';

export function Gdpr() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-gray-800">
      <div className="mb-4">
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
      <h1 className="text-2xl font-bold mb-1">Om din data</h1>
      <p className="text-xs text-gray-400 mb-6">Senast uppdaterad: augusti 2026</p>

      <p className="mb-6">
        Den här tjänsten är ett litet hobbyprojekt för pendlingsinformation i Stockholm. Vi tar din
        integritet på allvar och samlar bara in det vi faktiskt behöver.
      </p>

      {/* Deliberately describes categories rather than listing fields. GDPR artikel 13 requires the
          purpose and the legal basis, not an inventory — and an inventory silently goes out of date every
          time a setting is added, which is how this text came to be wrong in the first place. */}
      <h2 className="text-lg font-semibold mb-2">Vad vi lagrar</h2>
      <p className="mb-6">
        Vi lagrar ditt namn och din e-postadress från ditt Google-konto, samt de inställningar och val
        du gör i tjänsten — till exempel vilken hållplats du utgår från och hur du vill att vyerna ska
        visas. Dessa uppgifter används enbart för att tjänsten ska fungera som avsett.
      </p>

      <h2 className="text-lg font-semibold mb-2">Varför vi lagrar det</h2>
      <p className="mb-6">
        Vi lagrar dina uppgifter för att du ska kunna logga in och använda tjänsten. Uppgifterna
        delas inte med någon utomstående och används inte i marknadsföringssyfte.
      </p>

      {/* Says only what GDPR actually requires. Artikel 13 mandates disclosing transfers *out* of the
          EU/EES, not where inside it the servers stand — so naming the host adds no compliance value, and
          not naming it is consistent with the Cloudflare proxy that exists to keep the origin address out
          of public view. Scoped to storage on purpose: it is a claim that can be stood behind, unlike an
          absolute "leaves the EU never" covering every request path. */}
      <h2 className="text-lg font-semibold mb-2">Var lagras det</h2>
      <p className="mb-6">
        Dina uppgifter lagras på servrar inom EU/EES och överförs inte till något land utanför EU/EES.
      </p>

      {/* Required by GDPR artikel 13.2 a. Kept to the one case that is verifiable end to end — an account
          and its data going away together — rather than enumerating the background jobs, which would be
          the same staleness trap the storage list above was. */}
      <h2 className="text-lg font-semibold mb-2">Hur länge vi lagrar det</h2>
      <p className="mb-6">
        Uppgifterna lagras så länge du har ett konto i tjänsten och raderas när du tar bort det.
      </p>

      <h2 className="text-lg font-semibold mb-2">Dina rättigheter</h2>
      <p className="mb-6">
        Enligt GDPR har du rätt att få din data raderad. Du kan när som helst ta bort all din data
        via Mitt konto i appen. Du har också rätt att få veta vilka uppgifter om dig som finns
        lagrade, och att få felaktiga uppgifter rättade. Anser du att dina uppgifter hanteras
        felaktigt har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).
      </p>

      <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
      <p className="mb-6">
        Har du frågor om hur dina uppgifter hanteras, eller vill du utöva någon av dina rättigheter,
        når du oss på{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#184fc2] hover:text-[#578ff3] underline">
          {CONTACT_EMAIL}
        </a>.
      </p>

      <p className="text-xs text-gray-400">
        Den rättsliga grunden för behandlingen av dina personuppgifter är fullgörande av avtal
        (GDPR artikel 6.1 b) — det vill säga att vi behöver uppgifterna för att kunna
        tillhandahålla tjänsten du registrerat dig för.
      </p>
    </div>
  );
}
