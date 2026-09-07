import { Check, Circle, X } from "lucide-react";
import type { StopStatus } from "@/lib/api";

export function StopStatusIcon({ status, position }: { status: StopStatus; position: number }) {
  if (status === "delivered")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-4" />
      </span>
    );
  if (status === "failed")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-[#b45309] text-white">
        <X className="size-4" />
      </span>
    );
  return (
    <span className="relative grid size-8 place-items-center rounded-full border-2 border-[#1d4ed8] text-sm font-semibold text-[#1d4ed8]">
      {position}
      <Circle className="sr-only" />
    </span>
  );
}
