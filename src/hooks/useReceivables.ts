import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ReceivableRow = Tables<"receivables">;
export type ReceivableInsert = TablesInsert<"receivables">;
export type ReceivableUpdate = TablesUpdate<"receivables">;

export const useReceivables = (status?: "pending" | "received" | "cancelled" | "all") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["receivables", user?.id, status],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("receivables")
        .select("*")
        .order("due_date", { ascending: true });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching receivables:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useReceivableStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["receivable-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 1);
      endOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("receivables")
        .select("amount, status, due_date")
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching receivable stats:", error);
        throw error;
      }

      const receivables = data || [];

      // Filter receivables for the selected month (by due_date)
      const receivablesInMonth = receivables.filter((r) => {
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        return dueDate >= startOfMonth && dueDate < endOfMonth;
      });

      const thisMonthAmount = receivablesInMonth.reduce((acc, r) => acc + Number(r.amount), 0);
      const pendingCount = receivablesInMonth.length;

      // Total pending (all pending receivables)
      const totalPending = receivables.reduce((acc, r) => acc + Number(r.amount), 0);

      // Check for overdue items (due before the target month's start)
      const overdueItems = receivables.filter((r) => {
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        return dueDate < startOfMonth;
      });
      
      const overdueCount = overdueItems.length;
      const overdueAmount = overdueItems.reduce((acc, r) => acc + Number(r.amount), 0);

      return {
        totalPending,
        thisMonthAmount,
        pendingCount,
        overdueCount,
        overdueAmount,
      };
    },
    enabled: !!user,
  });
};

export const useCreateReceivable = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (receivable: Omit<ReceivableInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("receivables")
        .insert({
          ...receivable,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      toast.success("Valor a receber registrado!");
    },
    onError: (error) => {
      console.error("Error creating receivable:", error);
      toast.error("Erro ao registrar valor a receber");
    },
  });
};

export const useUpdateReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ReceivableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("receivables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      queryClient.invalidateQueries({ queryKey: ["receivable"] });
      toast.success("Valor atualizado!");
    },
    onError: (error) => {
      console.error("Error updating receivable:", error);
      toast.error("Erro ao atualizar valor");
    },
  });
};

export const useDeleteReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receivables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivable-stats"] });
      queryClient.invalidateQueries({ queryKey: ["receivable"] });
      toast.success("Valor a receber removido!");
    },
    onError: (error) => {
      console.error("Error deleting receivable:", error);
      toast.error("Erro ao remover valor a receber");
    },
  });
};

export const useReceivableById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["receivable", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("receivables")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching receivable:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!id,
  });
};
