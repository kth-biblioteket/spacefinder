import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TextSchedule } from "@/lib/textSchedule";

export function TextScheduleFields({ kind, schedule, onChange }: {
  kind: "notice" | "info";
  schedule: TextSchedule;
  onChange: (schedule: TextSchedule) => void;
}) {
  const id = useId();
  return <div className="space-y-3 sm:col-span-2">
    <p className="text-sm font-medium">Tidsinställning för {kind === "notice" ? "den gula rutan" : "den ofärgade informationen"}</p>
    <p id={`${id}-help`} className="text-xs text-muted-foreground">Svensk tid (Stockholm). Tom starttid visar texten direkt; tom sluttid visar den tills vidare. Endast denna ruta påverkas.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(["from", "to"] as const).map((edge) => {
        const key = `${kind}_${edge}` as const;
        return <div key={edge} className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-${edge}`}>{edge === "from" ? "Publiceras från" : "Slutar visas"}</Label>
          <Input id={`${id}-${edge}`} type="datetime-local" value={schedule[key] ?? ""} aria-describedby={`${id}-help`}
            className="w-full min-w-0" onChange={(e) => onChange({ ...schedule, [key]: e.target.value })} />
        </div>;
      })}
    </div>
  </div>;
}