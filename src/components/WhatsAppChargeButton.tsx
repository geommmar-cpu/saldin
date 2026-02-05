 // Botão para cobrar via WhatsApp
 
 import { MessageCircle, Clock } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { toast } from "@/hooks/use-toast";
 
 interface WhatsAppChargeButtonProps {
   debtorName: string;
   amount: number;
   description?: string;
   className?: string;
   variant?: "default" | "outline" | "ghost";
   size?: "default" | "sm" | "lg" | "icon";
   showComingSoon?: boolean;
 }
 
 export const WhatsAppChargeButton = ({
   debtorName,
   amount,
   description,
   className,
   variant = "outline",
   size = "default",
   showComingSoon = true,
 }: WhatsAppChargeButtonProps) => {
   const formatCurrency = (value: number) =>
     new Intl.NumberFormat("pt-BR", {
       style: "currency",
       currency: "BRL",
     }).format(value);
 
   const handleClick = () => {
     if (showComingSoon) {
       toast({
         title: "Em breve!",
         description: "A integração com WhatsApp estará disponível em breve.",
       });
       return;
     }
 
     // Gerar mensagem de cobrança
     const message = encodeURIComponent(
       `Olá ${debtorName}! 👋\n\n` +
       `Passando para lembrar sobre o valor de ${formatCurrency(amount)}` +
       (description ? ` referente a: ${description}` : "") +
       `.\n\nQuando você consegue me pagar? 😊`
     );
 
     // Abrir WhatsApp (sem número específico por enquanto)
     window.open(`https://wa.me/?text=${message}`, "_blank");
   };
 
   return (
     <Button
       variant={variant}
       size={size}
       onClick={handleClick}
       className={cn(
         "gap-2",
         showComingSoon && "opacity-80",
         className
       )}
     >
       <MessageCircle className="w-4 h-4 text-[#25D366]" />
       <span>Cobrar</span>
       {showComingSoon && (
         <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground flex items-center gap-0.5">
           <Clock className="w-2.5 h-2.5" />
           Em breve
         </span>
       )}
     </Button>
   );
 };