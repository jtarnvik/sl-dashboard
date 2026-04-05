export interface CommonDeviation {
  message: string;
  heading?: string;
  shortMessage?: string;
}

export interface EnrichedDeviation extends CommonDeviation {
  id: number | null;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  action: 'SHOWN' | 'HIDDEN_ACCESSIBILITY' | 'HIDDEN_BY_USER' | 'UNKNOWN';
  delays: boolean | null;
  cancelations: boolean | null;
}

export interface BackendInterpretationResult {
  id: number | null;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  action: 'SHOWN' | 'HIDDEN_ACCESSIBILITY' | 'HIDDEN_BY_USER' | 'UNKNOWN';
  delays: boolean | null;
  cancelations: boolean | null;
}

export function isValidDeviationText(text: string): boolean {
  // Sometimes SL passes "." as deviation messages. Ignore those.
  return text.trim().length > 1;
}

export function isShown(d: EnrichedDeviation): boolean {
  return d.action !== 'HIDDEN_ACCESSIBILITY' && d.action !== 'HIDDEN_BY_USER';
}

export function enrichDeviations(
  deviations: CommonDeviation[],
  results: BackendInterpretationResult[]
): EnrichedDeviation[] {
  return deviations
    .map((deviation, i) => {
      const result = results[i];
      if (!result) {
        return null;
      }
      return { ...deviation, ...result };
    })
    .filter((d): d is EnrichedDeviation => d !== null);
}
