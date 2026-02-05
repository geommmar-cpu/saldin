import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type IncomeRow = Tables<"incomes">;
export type IncomeInsert = TablesInsert<"incomes">;
export type IncomeUpdate = TablesUpdate<"incomes">;

export const useIncomes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["incomes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching incomes:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useIncomeStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["income-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 1);
      endOfMonth.setHours(0, 0, 0, 0);

      // Fetch non-recurring incomes for the specific month
      const { data: monthlyIncomes, error: monthlyError } = await supabase
        .from("incomes")
        .select("amount, type, is_recurring, date")
        .eq("is_recurring", false)
        .gte("date", startOfMonth.toISOString().split('T')[0])
        .lt("date", endOfMonth.toISOString().split('T')[0]);

      if (monthlyError) {
        console.error("Error fetching monthly incomes:", monthlyError);
        throw monthlyError;
      }

      // Fetch recurring incomes that started before or during the target month
      const { data: recurringIncomes, error: recurringError } = await supabase
        .from("incomes")
        .select("amount, type, is_recurring, date")
        .eq("is_recurring", true)
        .lte("date", endOfMonth.toISOString().split('T')[0]);

      if (recurringError) {
        console.error("Error fetching recurring incomes:", recurringError);
        throw recurringError;
      }

      const allIncomes = [...(monthlyIncomes || []), ...(recurringIncomes || [])];
      const total = allIncomes.reduce((acc, i) => acc + Number(i.amount), 0);
      
      const recurringTotal = (recurringIncomes || []).reduce((acc, i) => acc + Number(i.amount), 0);
      const variableTotal = (monthlyIncomes || []).reduce((acc, i) => acc + Number(i.amount), 0);

      return {
        total,
        fixedTotal: recurringTotal,
        variableTotal,
        count: allIncomes.length,
      };
    },
    enabled: !!user,
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (income: Omit<IncomeInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("incomes")
        .insert({
          ...income,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      toast.success("Receita registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating income:", error);
      toast.error("Erro ao registrar receita");
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Receita removida!");
    },
    onError: (error) => {
      console.error("Error deleting income:", error);
      toast.error("Erro ao remover receita");
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: IncomeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("incomes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["income-stats"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Receita atualizada!");
    },
    onError: (error) => {
      console.error("Error updating income:", error);
      toast.error("Erro ao atualizar receita");
    },
  });
};

export const useIncomeById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["income", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching income:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!id,
  });
};
