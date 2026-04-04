export interface CommonDeviation {
  message: string;
  heading?: string;
  shortMessage?: string;
}

export interface EnrichedDeviation extends CommonDeviation {
  id: number;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  action: 'SHOWN' | 'HIDDEN_ACCESSIBILITY' | 'HIDDEN_BY_USER' | 'UNKNOWN';
  delays: boolean | null;
  cancelations: boolean | null;
}

export interface BackendInterpretationResult {
  id: number;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  action: 'SHOWN' | 'HIDDEN_ACCESSIBILITY' | 'HIDDEN_BY_USER' | 'UNKNOWN';
  delays: boolean | null;
  cancelations: boolean | null;
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
