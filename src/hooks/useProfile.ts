import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

// Use the generated type from Supabase
export type ProfileData = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<ProfileData, "id" | "user_id" | "created_at">>) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });
};

// Check if user has completed onboarding
export const useCheckOnboarding = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking onboarding:", error);
        return false;
      }

      return data?.onboarding_completed === true;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};
