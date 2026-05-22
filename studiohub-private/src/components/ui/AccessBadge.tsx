import type { AccessType } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AccessBadge({ value }: { value: AccessType }) {
  return <StatusBadge kind="access" value={value} />;
}
