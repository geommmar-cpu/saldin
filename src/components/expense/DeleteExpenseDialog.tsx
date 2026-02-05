import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteType: "current" | "future" | "all") => void;
  isRecurring?: boolean;
  isFromIntegration?: boolean;
  isLoading?: boolean;
}

export const DeleteExpenseDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isRecurring = false,
  isFromIntegration = false,
  isLoading = false,
}: DeleteExpenseDialogProps) => {
  const [deleteType, setDeleteType] = useState<"current" | "future" | "all">("current");

  const handleConfirm = () => {
    onConfirm(deleteType);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">
            Excluir gasto?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isFromIntegration ? (
              <span className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                Este gasto veio de uma integração e será marcado como ignorado.
              </span>
            ) : (
              "Esta ação não pode ser desfeita."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRecurring && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              O que você deseja excluir?
            </p>
            <RadioGroup
              value={deleteType}
              onValueChange={(value) => setDeleteType(value as "current" | "future" | "all")}
              className="space-y-2"
            >
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteType === "current"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteType("current")}
              >
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="flex-1 cursor-pointer">
                  <p className="font-medium">Apenas esta parcela</p>
                  <p className="text-xs text-muted-foreground">
                    Mantém as outras parcelas intactas
                  </p>
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteType === "future"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteType("future")}
              >
                <RadioGroupItem value="future" id="future" />
                <Label htmlFor="future" className="flex-1 cursor-pointer">
                  <p className="font-medium">Esta e as próximas</p>
                  <p className="text-xs text-muted-foreground">
                    Parcelas anteriores são mantidas
                  </p>
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteType === "all"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteType("all")}
              >
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex-1 cursor-pointer">
                  <p className="font-medium">Todas as parcelas</p>
                  <p className="text-xs text-muted-foreground">
                    Remove o gasto completamente
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
