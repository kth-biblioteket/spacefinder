import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CAPACITY_ICON } from "@/lib/defaultCapacityIcon";

const SETTINGS_KEY = "capacity_icon_url";

export function useCapacityIcon() {
  return useQuery({
    queryKey: ["capacity-icon"],
    placeholderData: DEFAULT_CAPACITY_ICON,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return data?.value || DEFAULT_CAPACITY_ICON;
    },
  });
}

export function useSaveCapacityIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string | null) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: SETTINGS_KEY, value: url ?? "" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capacity-icon"] }),
  });
}
