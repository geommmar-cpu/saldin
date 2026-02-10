import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ExpenseRow = Tables<"expenses">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type ExpenseUpdate = TablesUpdate<"expenses">;

export const useExpenses = (status?: "pending" | "confirmed" | "all") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expenses", user?.id, status],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      } else if (status === "all") {
        query = query.neq("status", "deleted");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useExpenseStats = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["expense-stats", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("expenses")
        .select("amount, emotion, date")
        .neq("status", "deleted")
        .gte("date", `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`)
        .lt("date", `${targetMonth === 11 ? targetYear + 1 : targetYear}-${String(targetMonth === 11 ? 1 : targetMonth + 2).padStart(2, '0')}-01`);

      if (error) {
        console.error("Error fetching expense stats:", error);
        throw error;
      }

      const expenses = data || [];
      const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
      const impulseExpenses = expenses.filter((e) => e.emotion === "impulso");
      const impulseTotal = impulseExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
      const confirmedCount = expenses.filter((e) => e.emotion !== null).length;
      const impulsePercentage = confirmedCount > 0 
        ? Math.round((impulseExpenses.length / confirmedCount) * 100) 
        : 0;

      return {
        total,
        impulseTotal,
        impulsePercentage,
        count: expenses.length,
      };
    },
    enabled: !!user,
  });
};

export const useExpensesByCategory = (month?: number, year?: number) => {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ["expenses-by-category", user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user) return [];

      const monthStartStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
      const nextMonth = targetMonth === 11 ? 1 : targetMonth + 2;
      const monthEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      // Fetch expenses with category join
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          amount, 
          emotion,
          category_id,
          categories (
            name
          )
        `)
        .neq("status", "deleted")
        .gte("date", monthStartStr)
        .lt("date", monthEndStr);

      if (error) {
        console.error("Error fetching expenses by category:", error);
        throw error;
      }

      // Group by category
      const categoryMap: Record<string, { total: number; count: number; emotion: string | null }> = {};
      
      (data || []).forEach((expense) => {
        // Get category name from the join or use default
        const categoryData = expense.categories as { name: string } | null;
        const cat = categoryData?.name || "Outros";
        if (!categoryMap[cat]) {
          categoryMap[cat] = { total: 0, count: 0, emotion: null };
        }
        categoryMap[cat].total += Number(expense.amount);
        categoryMap[cat].count += 1;
        // Use most common emotion for the category
        if (expense.emotion) {
          categoryMap[cat].emotion = expense.emotion;
        }
      });

      // Convert to array and sort by total
      const categories = Object.entries(categoryMap)
        .map(([name, data]) => ({
          name,
          total: data.total,
          count: data.count,
          emotion: data.emotion,
        }))
        .sort((a, b) => b.total - a.total);

      return categories;
    },
    enabled: !!user,
  });
};

export const usePendingExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-expenses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending expenses:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      toast.success("Gasto registrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating expense:", error);
      toast.error("Erro ao registrar gasto");
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success("Gasto atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating expense:", error);
      toast.error("Erro ao atualizar gasto");
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const db = supabase as any;

  return useMutation({
    mutationFn: async ({ id, softDelete = false }: { id: string; softDelete?: boolean }) => {
      // Fetch expense to check for bank_account_id (to reverse balance)
      const { data: expense } = await db
        .from("expenses")
        .select("amount, bank_account_id")
        .eq("id", id)
        .maybeSingle();

      if (softDelete) {
        const { data, error } = await supabase
          .from("expenses")
          .update({ status: "deleted" })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        // Reverse bank balance
        if (expense?.bank_account_id) {
          const { data: account } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", expense.bank_account_id)
            .single();
          if (account) {
            await db
              .from("bank_accounts")
              .update({ current_balance: Number(account.current_balance) + Number(expense.amount), updated_at: new Date().toISOString() })
              .eq("id", expense.bank_account_id);
          }
        }
        return data;
      } else {
        // Reverse bank balance before deleting
        if (expense?.bank_account_id) {
          const { data: account } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", expense.bank_account_id)
            .single();
          if (account) {
            await db
              .from("bank_accounts")
              .update({ current_balance: Number(account.current_balance) + Number(expense.amount), updated_at: new Date().toISOString() })
              .eq("id", expense.bank_account_id);
          }
        }

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return { id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      toast.success("Gasto excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao excluir gasto");
    },
  });
};

export const useExpenseById = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching expense:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!id,
  });
};
