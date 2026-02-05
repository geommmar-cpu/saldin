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
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeleteScope = "current" | "future" | "all";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: DeleteScope) => void;
  title?: string;
  description?: string;
  isInstallment?: boolean;
  isLoading?: boolean;
  entityName?: string;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Excluir registro?",
  description = "Esta ação não pode ser desfeita.",
  isInstallment = false,
  isLoading = false,
  entityName = "registro",
}: DeleteConfirmDialogProps) => {
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("all");

  const handleConfirm = () => {
    onConfirm(deleteScope);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isInstallment && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              O que você deseja excluir?
            </p>
            <RadioGroup
              value={deleteScope}
              onValueChange={(value) => setDeleteScope(value as DeleteScope)}
              className="space-y-2"
            >
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteScope === "current"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteScope("current")}
              >
                <RadioGroupItem value="current" id="del-current" />
                <Label htmlFor="del-current" className="flex-1 cursor-pointer">
                  <p className="font-medium">Apenas esta parcela</p>
                  <p className="text-xs text-muted-foreground">
                    Mantém as outras parcelas intactas
                  </p>
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteScope === "future"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteScope("future")}
              >
                <RadioGroupItem value="future" id="del-future" />
                <Label htmlFor="del-future" className="flex-1 cursor-pointer">
                  <p className="font-medium">Esta e as próximas</p>
                  <p className="text-xs text-muted-foreground">
                    Parcelas anteriores são mantidas
                  </p>
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  deleteScope === "all"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteScope("all")}
              >
                <RadioGroupItem value="all" id="del-all" />
                <Label htmlFor="del-all" className="flex-1 cursor-pointer">
                  <p className="font-medium">Excluir {entityName} completo</p>
                  <p className="text-xs text-muted-foreground">
                    Remove todas as parcelas
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
