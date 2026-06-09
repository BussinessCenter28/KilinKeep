// Assistant API. Calls the glaze-suggest Edge Function (which holds the Anthropic
// key server-side). Never calls Anthropic directly.
import { invokeFunction } from '@/lib/functions';

export interface GlazeSuggestion {
  likely_cause: string;
  suggested_change: string;
}

export function getGlazeSuggestion(testId: string): Promise<GlazeSuggestion> {
  return invokeFunction<GlazeSuggestion>('glaze-suggest', { test_id: testId });
}
