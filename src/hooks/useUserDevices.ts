
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";

export interface UserDevice {
  id: string;
  user_id: string;
  device_token: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export const useUserDevices = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["user-devices", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await (supabase.from("user_devices" as any) as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any) as UserDevice[];
    },
    enabled: !!userId,
  });

  const createDevice = useMutation({
    mutationFn: async (deviceName: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const deviceToken = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID().replace(/-/g, "") 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const { data, error } = await (supabase.from("user_devices" as any) as any)
        .insert({
          user_id: userId,
          device_token: deviceToken,
          device_name: deviceName,
        })
        .select()
        .single();

      if (error) throw error;
      return (data as any) as UserDevice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices", userId] });
      toast({ title: "Dispositivo registrado!", description: "Agora você pode configurar a captura automática." });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Erro desconhecido no servidor";
      toast({ 
        title: "Erro ao registrar dispositivo", 
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), 
        variant: "destructive" 
      });
    }
  });

  const deleteDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await (supabase.from("user_devices" as any) as any)
        .delete()
        .eq("id", deviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices", userId] });
      toast({ title: "Dispositivo removido" });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Erro desconhecido ao remover";
      toast({ 
        title: "Erro ao remover dispositivo", 
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), 
        variant: "destructive" 
      });
    }
  });

  return {
    ...query,
    createDevice,
    deleteDevice
  };
};
