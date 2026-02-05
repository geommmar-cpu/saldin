import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DebtRow = Tables<"debts">;
export type DebtInsert = TablesInsert<"debts">;
export type DebtUpdate = TablesUpdate<"debts">;

export const useDebts = (status?: "active" | "paid" | "all") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["debts", user?.id, status],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("debts")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching debts:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useDebtStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["debt-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const targetDate = new Date(targetYear, targetMonth, 1);

      const { data, error } = await supabase
        .from("debts")
        .select("installment_amount, total_amount, paid_amount, total_installments, current_installment, status, due_date, created_at, is_installment")
        .eq("status", "active");

      if (error) {
        console.error("Error fetching debt stats:", error);
        throw error;
      }

      const debts = data || [];
      
      // Calculate monthly payment considering installments
      const totalMonthly = debts.reduce((acc, d) => {
        if (!d.is_installment) {
          // Non-installment debts: show full amount if created before or during target month
          const createdAt = new Date(d.created_at);
          if (createdAt <= targetDate) {
            return acc + Number(d.installment_amount || d.total_amount || 0);
          }
          return acc;
        }
        
        // For installment debts, calculate which installment falls in the target month
        const createdAt = new Date(d.created_at);
        const totalInstallments = d.total_installments || 1;
        const currentInstallment = d.current_installment || 1;
        
        // Calculate months since creation
        const monthsDiff = (targetYear - createdAt.getFullYear()) * 12 + (targetMonth - createdAt.getMonth());
        
        // Check if this month falls within the installment range
        const installmentForMonth = currentInstallment + monthsDiff;
        
        if (monthsDiff >= 0 && installmentForMonth <= totalInstallments) {
          return acc + Number(d.installment_amount || 0);
        }
        
        return acc;
      }, 0);

      const totalOpen = debts.reduce((acc, d) => {
        if (!d.is_installment) {
          // Non-installment debts: show full remaining amount
          return acc + (Number(d.total_amount) - Number(d.paid_amount));
        }
        
        // For installment debts, calculate remaining based on target month
        const createdAt = new Date(d.created_at);
        const totalInstallments = d.total_installments || 1;
        const installmentAmount = Number(d.installment_amount || 0);
        
        // Calculate months since creation
        const monthsDiff = (targetYear - createdAt.getFullYear()) * 12 + (targetMonth - createdAt.getMonth());
        
        // Calculate how many installments have been "paid" up to target month
        const paidInstallments = Math.min(Math.max(monthsDiff + 1, 0), totalInstallments);
        const remainingInstallments = totalInstallments - paidInstallments;
        
        return acc + (remainingInstallments * installmentAmount);
      }, 0);

      return {
        totalMonthly,
        totalOpen,
        activeCount: debts.length,
      };
    },
    enabled: !!user,
  });
};

export const useCreateDebt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (debt: Omit<DebtInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("debts")
        .insert({
          ...debt,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      toast.success("Dívida registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating debt:", error);
      toast.error("Erro ao registrar dívida");
    },
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DebtUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("debts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      queryClient.invalidateQueries({ queryKey: ["debt"] });
      toast.success("Dívida atualizada!");
    },
    onError: (error) => {
      console.error("Error updating debt:", error);
      toast.error("Erro ao atualizar dívida");
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      queryClient.invalidateQueries({ queryKey: ["debt"] });
      toast.success("Dívida removida!");
    },
    onError: (error) => {
      console.error("Error deleting debt:", error);
      toast.error("Erro ao remover dívida");
    },
  });
};

export const useDebtById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["debt", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching debt:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!id,
  });
};
