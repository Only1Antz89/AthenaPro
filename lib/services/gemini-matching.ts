import { buildAiSuggestedEventMetadata } from "@/lib/domain/matching";
import type { Event } from "@/types/domain";

export interface GeminiMatchingAdapter {
  inferEventHints(input: Pick<Event, "description" | "eventType" | "requiredRoles">): Promise<{
    suggestedServiceTier: Event["serviceTier"];
    aiSuggestedTags: string[];
    aiSuggestedRoles: string[];
  } | null>;
}

class NoopGeminiMatchingAdapter implements GeminiMatchingAdapter {
  async inferEventHints(input: Pick<Event, "description" | "eventType" | "requiredRoles">) {
    return buildAiSuggestedEventMetadata(input);
  }
}

let adapter: GeminiMatchingAdapter = new NoopGeminiMatchingAdapter();

export function getGeminiMatchingAdapter() {
  return adapter;
}

export function setGeminiMatchingAdapter(nextAdapter: GeminiMatchingAdapter) {
  adapter = nextAdapter;
}
