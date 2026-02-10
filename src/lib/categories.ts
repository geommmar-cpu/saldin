 // Sistema de categorias padronizadas do Saldin
 // Categorias completas com ícones e grupos organizados
 
 import {
   Droplets,
   Zap,
   Wifi,
   Flame,
   Phone,
   Home,
   Car,
   FileText,
   AlertCircle,
   CreditCard,
   Layers,
   Percent,
   Building2,
   Utensils,
   ShoppingCart,
   Bike,
   PartyPopper,
   Heart,
   GraduationCap,
   Shirt,
   Plane,
   Gift,
   Stethoscope,
   Pill,
   Dumbbell,
   Dog,
   Baby,
   Wrench,
   Sparkles,
   MoreHorizontal,
   LucideIcon,
 } from "lucide-react";
 
export interface CategoryConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  group: CategoryGroup;
  color: string; // CSS class
  isCustom?: boolean;
}
 
 export type CategoryGroup = 
   | "contas_fixas"
   | "impostos"
   | "financeiro"
   | "consumo"
   | "moradia"
   | "saude"
   | "transporte"
   | "educacao"
   | "pessoal"
   | "outros";
 
 export const categoryGroups: Record<CategoryGroup, { name: string; icon: LucideIcon }> = {
   contas_fixas: { name: "Contas Fixas", icon: FileText },
   impostos: { name: "Impostos e Taxas", icon: Building2 },
   financeiro: { name: "Financeiro", icon: CreditCard },
   consumo: { name: "Consumo", icon: ShoppingCart },
   moradia: { name: "Moradia", icon: Home },
   saude: { name: "Saúde", icon: Heart },
   transporte: { name: "Transporte", icon: Car },
   educacao: { name: "Educação", icon: GraduationCap },
   pessoal: { name: "Pessoal", icon: Sparkles },
   outros: { name: "Outros", icon: MoreHorizontal },
 };
 
 export const defaultCategories: CategoryConfig[] = [
   // 🧾 Contas Fixas
   { id: "agua", name: "Água", icon: Droplets, group: "contas_fixas", color: "text-blue-500" },
   { id: "luz", name: "Luz", icon: Zap, group: "contas_fixas", color: "text-yellow-500" },
   { id: "internet", name: "Internet", icon: Wifi, group: "contas_fixas", color: "text-indigo-500" },
   { id: "gas", name: "Gás", icon: Flame, group: "contas_fixas", color: "text-orange-500" },
   { id: "telefone", name: "Telefone", icon: Phone, group: "contas_fixas", color: "text-green-500" },
   
   // 🏠 Impostos e Taxas
   { id: "iptu", name: "IPTU", icon: Building2, group: "impostos", color: "text-slate-600" },
   { id: "ipva", name: "IPVA", icon: Car, group: "impostos", color: "text-slate-600" },
   { id: "licenciamento", name: "Licenciamento", icon: FileText, group: "impostos", color: "text-slate-600" },
   { id: "multas", name: "Multas", icon: AlertCircle, group: "impostos", color: "text-red-500" },
   
   // 💳 Financeiro
   { id: "cartao_credito", name: "Cartão de Crédito", icon: CreditCard, group: "financeiro", color: "text-purple-500" },
   { id: "parcelamentos", name: "Parcelamentos", icon: Layers, group: "financeiro", color: "text-purple-400" },
   { id: "juros", name: "Juros", icon: Percent, group: "financeiro", color: "text-red-400" },
   { id: "taxas_bancarias", name: "Taxas Bancárias", icon: Building2, group: "financeiro", color: "text-gray-500" },
   
   // 🍔 Consumo
   { id: "alimentacao", name: "Alimentação", icon: Utensils, group: "consumo", color: "text-orange-400" },
   { id: "mercado", name: "Mercado", icon: ShoppingCart, group: "consumo", color: "text-green-500" },
   { id: "delivery", name: "Delivery", icon: Bike, group: "consumo", color: "text-red-400" },
   { id: "lazer", name: "Lazer", icon: PartyPopper, group: "consumo", color: "text-pink-500" },
   
   // 🏠 Moradia
   { id: "aluguel", name: "Aluguel", icon: Home, group: "moradia", color: "text-teal-500" },
   { id: "condominio", name: "Condomínio", icon: Building2, group: "moradia", color: "text-teal-400" },
   { id: "manutencao", name: "Manutenção", icon: Wrench, group: "moradia", color: "text-gray-500" },
   
   // ❤️ Saúde
   { id: "plano_saude", name: "Plano de Saúde", icon: Stethoscope, group: "saude", color: "text-red-400" },
   { id: "medicamentos", name: "Medicamentos", icon: Pill, group: "saude", color: "text-green-400" },
   { id: "academia", name: "Academia", icon: Dumbbell, group: "saude", color: "text-blue-400" },
   
   // 🚗 Transporte
   { id: "combustivel", name: "Combustível", icon: Flame, group: "transporte", color: "text-amber-500" },
   { id: "transporte_publico", name: "Transporte Público", icon: Car, group: "transporte", color: "text-blue-500" },
   { id: "estacionamento", name: "Estacionamento", icon: Car, group: "transporte", color: "text-gray-500" },
   { id: "uber_99", name: "Uber/99", icon: Car, group: "transporte", color: "text-black" },
   
   // 📚 Educação
   { id: "escola", name: "Escola", icon: GraduationCap, group: "educacao", color: "text-blue-600" },
   { id: "cursos", name: "Cursos", icon: GraduationCap, group: "educacao", color: "text-indigo-500" },
   
   // 👤 Pessoal
   { id: "roupas", name: "Roupas", icon: Shirt, group: "pessoal", color: "text-pink-400" },
   { id: "viagem", name: "Viagem", icon: Plane, group: "pessoal", color: "text-sky-500" },
   { id: "presentes", name: "Presentes", icon: Gift, group: "pessoal", color: "text-rose-400" },
   { id: "pet", name: "Pet", icon: Dog, group: "pessoal", color: "text-amber-600" },
   { id: "filhos", name: "Filhos", icon: Baby, group: "pessoal", color: "text-pink-300" },
   { id: "beleza", name: "Beleza", icon: Sparkles, group: "pessoal", color: "text-fuchsia-400" },
   
   // 📦 Outros
   { id: "outros", name: "Outros", icon: MoreHorizontal, group: "outros", color: "text-muted-foreground" },
 ];
 
 // Helper para buscar categoria por ID
 export const getCategoryById = (id: string): CategoryConfig | undefined => {
   return defaultCategories.find(c => c.id === id);
 };
 
 // Helper para buscar categorias por grupo
 export const getCategoriesByGroup = (group: CategoryGroup): CategoryConfig[] => {
   return defaultCategories.filter(c => c.group === group);
 };
 
 // Helper para obter ícone de categoria
 export const getCategoryIcon = (categoryId: string): LucideIcon => {
   const category = getCategoryById(categoryId);
   return category?.icon || MoreHorizontal;
 };
 
 // Helper para obter cor de categoria
 export const getCategoryColor = (categoryId: string): string => {
   const category = getCategoryById(categoryId);
   return category?.color || "text-muted-foreground";
 };
 
 // Agrupar categorias para exibição
 export const getGroupedCategories = (): Record<CategoryGroup, CategoryConfig[]> => {
   const grouped: Record<CategoryGroup, CategoryConfig[]> = {
     contas_fixas: [],
     impostos: [],
     financeiro: [],
     consumo: [],
     moradia: [],
     saude: [],
     transporte: [],
     educacao: [],
     pessoal: [],
     outros: [],
   };
   
   defaultCategories.forEach(category => {
     grouped[category.group].push(category);
   });
   
   return grouped;
 };