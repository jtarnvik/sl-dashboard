export function OfflineBanner() {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg shadow-sm px-4 py-3 text-sm text-gray-800" role="alert">
      Ingen kontakt med servern — inloggning är inte tillgänglig just nu. Försöker återansluta automatiskt.
    </div>
  );
}
