import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { defaultCategories, type CategoryConfig } from "@/lib/categories";
import { Tag, LucideIcon } from "lucide-react";

export type CategoryRow = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

// Convert a DB custom category to a CategoryConfig shape
function toLocalConfig(row: CategoryRow): CategoryConfig {
  return {
    id: row.id, // UUID from DB
    name: row.name,
    icon: Tag, // Default icon for custom categories
    group: "outros",
    color: row.color || "text-muted-foreground",
    isCustom: true,
  };
}

/**
 * Fetch user's custom categories from Supabase.
 */
export const useCustomCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      return (data || []) as CategoryRow[];
    },
    enabled: !!user,
  });
};

/**
 * Returns all categories: default + custom, merged.
 */
export const useAllCategories = () => {
  const { data: customCategories = [], isLoading } = useCustomCategories();

  const allCategories: CategoryConfig[] = [
    ...defaultCategories,
    ...customCategories.map(toLocalConfig),
  ];

  return { allCategories, customCategories, isLoading };
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: { name: string; type: string; color?: string; icon?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Check for duplicates (local + custom)
      const normalizedName = category.name.trim().toLowerCase();
      const localDuplicate = defaultCategories.find(
        (c) => c.name.toLowerCase() === normalizedName
      );
      if (localDuplicate) {
        throw new Error(`Já existe uma categoria padrão "${localDuplicate.name}"`);
      }

      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", normalizedName)
        .maybeSingle();

      if (existing) {
        throw new Error("Já existe uma categoria com esse nome");
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: category.name.trim(),
          type: category.type,
          color: category.color || null,
          icon: category.icon || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar categoria");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida!");
    },
    onError: () => {
      toast.error("Erro ao remover categoria");
    },
  });
};
