 // Tela de categorias padronizadas
 
 import { useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { BottomNav } from "@/components/BottomNav";
 import { FadeIn } from "@/components/ui/motion";
 import { ArrowLeft, Plus, Clock } from "lucide-react";
 import { motion } from "framer-motion";
 import { 
   defaultCategories, 
   categoryGroups, 
   getGroupedCategories,
   type CategoryGroup 
 } from "@/lib/categories";
 
 export default function Categories() {
   const navigate = useNavigate();
   const groupedCategories = getGroupedCategories();
   
   const groupOrder: CategoryGroup[] = [
     "contas_fixas",
     "impostos",
     "financeiro",
     "consumo",
     "moradia",
     "saude",
     "transporte",
     "educacao",
     "pessoal",
     "outros",
   ];
 
   return (
     <div className="min-h-screen bg-background pb-24">
       {/* Header */}
       <header className="px-5 pt-safe-top">
         <div className="pt-4 pb-4">
           <FadeIn>
             <div className="flex items-center gap-3 mb-2">
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-9 w-9"
                 onClick={() => navigate("/")}
               >
                 <ArrowLeft className="h-5 w-5" />
               </Button>
               <div>
                 <h1 className="font-serif text-2xl font-semibold">Categorias</h1>
                 <p className="text-sm text-muted-foreground">
                   Organize seus gastos por categoria
                 </p>
               </div>
             </div>
           </FadeIn>
         </div>
       </header>
 
       <main className="px-5 space-y-6">
         {/* Info Card */}
         <FadeIn delay={0.05}>
           <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
             <div className="flex items-center gap-2 mb-2">
               <Clock className="w-4 h-4 text-accent" />
               <span className="text-sm font-medium">Categorias personalizadas em breve</span>
             </div>
             <p className="text-sm text-muted-foreground">
               Por enquanto, use as categorias padrão abaixo. Em breve você poderá criar suas próprias.
             </p>
           </div>
         </FadeIn>
 
         {/* Category Groups */}
         {groupOrder.map((groupKey, groupIndex) => {
           const group = categoryGroups[groupKey];
           const categories = groupedCategories[groupKey];
           
           if (categories.length === 0) return null;
           
           const GroupIcon = group.icon;
 
           return (
             <FadeIn key={groupKey} delay={0.05 * (groupIndex + 1)}>
               <div>
                 <div className="flex items-center gap-2 mb-3">
                   <GroupIcon className="w-4 h-4 text-muted-foreground" />
                   <h2 className="font-serif text-lg font-semibold">{group.name}</h2>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                   {categories.map((category, index) => {
                     const Icon = category.icon;
                     
                     return (
                       <motion.div
                         key={category.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.02 * index }}
                         className="p-3 rounded-xl bg-card border border-border flex items-center gap-3"
                       >
                         <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center ${category.color}`}>
                           <Icon className="w-4 h-4" />
                         </div>
                         <span className="text-sm font-medium truncate">{category.name}</span>
                       </motion.div>
                     );
                   })}
                 </div>
               </div>
             </FadeIn>
           );
         })}
 
         {/* Add Custom Category (Coming Soon) */}
         <FadeIn delay={0.5}>
           <Button
             variant="outline"
             className="w-full opacity-60"
             disabled
           >
             <Plus className="w-4 h-4 mr-2" />
             Criar categoria personalizada
             <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
               Em breve
             </span>
           </Button>
         </FadeIn>
       </main>
 
       <BottomNav />
     </div>
   );
 }