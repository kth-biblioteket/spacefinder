import { useEffect, useId, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaveLandingLink, useUiTextAdmin } from "@/lib/useUiText";
import type { Lang } from "@/i18n";

function LanguageLinkFields({ lang }: { lang: Lang }) {
  const { data: labels, isLoading: labelsLoading } = useUiTextAdmin("landing_link_label");
  const { data: urls, isLoading: urlsLoading } = useUiTextAdmin("landing_link_url");
  const save = useSaveLandingLink();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const id = useId();
  useEffect(() => setLabel(labels?.[lang] ?? ""), [labels, lang]);
  useEffect(() => setUrl(urls?.[lang] ?? ""), [urls, lang]);
  const disabled = labelsLoading || urlsLoading || save.isPending;
  return (
    <form className="min-w-0 space-y-3" onSubmit={(event) => {
      event.preventDefault();
      save.mutate({ label, url, lang }, {
        onSuccess: () => toast.success(`Länk sparad (${lang.toUpperCase()})`),
        onError: (error) => toast.error(error.message),
      });
    }}>
      <h4 className="text-sm font-semibold">{lang === "sv" ? "Svenska" : "English"}</h4>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-label`} className="text-sm font-medium">Länktext ({lang.toUpperCase()})</label>
        <Input id={`${id}-label`} value={label} onChange={(e) => setLabel(e.target.value)} disabled={disabled} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-url`} className="text-sm font-medium">Länkadress ({lang.toUpperCase()})</label>
        <Input id={`${id}-url`} type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} disabled={disabled} />
      </div>
      <Button type="submit" size="sm" disabled={disabled}><Save aria-hidden="true" />Spara länk {lang.toUpperCase()}</Button>
    </form>
  );
}

export function LandingLinkEditor() {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-bold">Länk under ingressen</h3>
        <p className="mt-1 text-xs text-muted-foreground">Visas efter introduktionstexten, före filtren. Hela länken döljs alltid i kioskläge. Lämna båda fälten tomma för att ta bort den. Om engelska saknas används den svenska länken.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2"><LanguageLinkFields lang="sv" /><LanguageLinkFields lang="en" /></div>
    </section>
  );
}