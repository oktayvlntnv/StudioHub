import { clsx, type ClassValue } from "clsx";
import type { MediaItem, MediaProviderLink } from "@/types/studiohub";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getYear(date?: string) {
  if (!date) return "TBA";
  return date.slice(0, 4);
}

export function getPrimaryLink(item: MediaItem) {
  return (
    item.providerLinks[0] ??
    ({
      id: `${item.id}-missing-link`,
      mediaItemId: item.id,
      providerName: "No provider link",
      playbackType: "external_link",
      accessType: "unknown",
      sourceType: item.sourceType,
      isFree: false,
      isLegalConfirmed: false,
      availabilityCountry: [],
      notes: "Add an official provider link before playback.",
    } satisfies MediaProviderLink)
  );
}

export function formatRuntime(minutes?: number) {
  if (!minutes) return "Runtime unknown";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  return `${hours}h ${mins}m`;
}

export function optionList(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
