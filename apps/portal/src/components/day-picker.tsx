import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftIso, todayIso } from "@/lib/format";

export function DayPicker({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const isToday = date === todayIso();
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => onChange(shiftIso(date, -1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <Input type="date" aria-label="Delivery date" className="w-[11rem]" value={date} onChange={(e) => e.target.value && onChange(e.target.value)} />
      <Button variant="outline" size="icon" aria-label="Next day" onClick={() => onChange(shiftIso(date, 1))}>
        <ChevronRight className="size-4" />
      </Button>
      {!isToday && (
        <Button variant="ghost" size="sm" onClick={() => onChange(todayIso())}>
          Today
        </Button>
      )}
    </div>
  );
}
