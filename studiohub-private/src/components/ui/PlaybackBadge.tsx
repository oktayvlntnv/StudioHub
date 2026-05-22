import type { PlaybackType } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PlaybackBadge({ value }: { value: PlaybackType }) {
  return <StatusBadge kind="playback" value={value} />;
}
