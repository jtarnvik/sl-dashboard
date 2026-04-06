import { STOP_HINT_KEY } from '../communication/constant.ts';

export function saveStopHint(settings: SettingsData): void {
  try {
    localStorage.setItem(STOP_HINT_KEY, JSON.stringify({
      stopPointId: settings.stopPointId,
      stopPointName: settings.stopPointName,
      useAiInterpretation: settings.useAiInterpretation,
    }));
  } catch {
    // localStorage may be unavailable in some contexts; silently ignore
  }
}

export function loadStopHint(): SettingsData | null {
  try {
    const raw = localStorage.getItem(STOP_HINT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.stopPointId === 'string' &&
      typeof parsed.stopPointName === 'string' &&
      typeof parsed.useAiInterpretation === 'boolean'
    ) {
      return parsed as SettingsData;
    }
    return null;
  } catch {
    return null;
  }
}
