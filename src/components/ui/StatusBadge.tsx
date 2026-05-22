import type { AccessType, PlaybackType, SourceType } from "@/types/studiohub";
import {
  accessTone,
  accessTypeLabels,
  playbackTone,
  playbackTypeLabels,
  sourceTone,
  sourceTypeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

type BadgeProps =
  | { kind: "access"; value: AccessType; className?: string }
  | { kind: "playback"; value: PlaybackType; className?: string }
  | { kind: "source"; value: SourceType; className?: string };

export function StatusBadge(props: BadgeProps) {
  const tone =
    props.kind === "access"
      ? accessTone(props.value)
      : props.kind === "playback"
        ? playbackTone(props.value)
        : sourceTone(props.value);

  const label =
    props.kind === "access"
      ? accessTypeLabels[props.value]
      : props.kind === "playback"
        ? playbackTypeLabels[props.value]
        : sourceTypeLabels[props.value];

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold",
        tone,
        props.className,
      )}
    >
      {label}
    </span>
  );
}
