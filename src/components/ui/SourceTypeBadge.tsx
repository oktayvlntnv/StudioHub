import type { SourceType } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SourceTypeBadge({ value }: { value: SourceType }) {
  return <StatusBadge kind="source" value={value} />;
}
