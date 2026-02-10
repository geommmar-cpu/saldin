import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Home, 
  BarChart3, 
  Wallet,
  Sun,
  Moon,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const StyleGuide = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [isHighContrast, setIsHighContrast] = useState(document.documentElement.classList.contains("high-contrast"));

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const toggleHighContrast = () => {
    document.documentElement.classList.toggle("high-contrast");
    setIsHighContrast(!isHighContrast);
  };

  const colors = [
    { name: "Background", class: "bg-background", textClass: "text-foreground" },
    { name: "Foreground", class: "bg-foreground", textClass: "text-background" },
    { name: "Primary", class: "bg-primary", textClass: "text-primary-foreground" },
    { name: "Secondary", class: "bg-secondary", textClass: "text-secondary-foreground" },
    { name: "Accent", class: "bg-accent", textClass: "text-accent-foreground" },
    { name: "Muted", class: "bg-muted", textClass: "text-muted-foreground" },
    { name: "Card", class: "bg-card", textClass: "text-card-foreground" },
    { name: "Destructive", class: "bg-destructive", textClass: "text-destructive-foreground" },
  ];

  const emotionColors = [
    { name: "Essential", class: "bg-essential", textClass: "text-essential-foreground", desc: "Gastos essenciais" },
    { name: "Obligation", class: "bg-obligation", textClass: "text-obligation-foreground", desc: "Obrigações fixas" },
    { name: "Pleasure", class: "bg-pleasure", textClass: "text-pleasure-foreground", desc: "Prazer consciente" },
    { name: "Impulse", class: "bg-impulse", textClass: "text-impulse-foreground", desc: "Alerta/Impulso" },
  ];

  const gradients = [
    { name: "Warm", class: "gradient-warm", desc: "Botões principais, FAB" },
    { name: "Calm", class: "gradient-calm", desc: "Indicadores positivos" },
    { name: "Alert", class: "gradient-alert", desc: "Alertas, impulsos" },
    { name: "Soft", class: "gradient-soft", desc: "Fundos suaves" },
  ];

  const shadows = [
    { name: "Soft", class: "shadow-soft", desc: "Cards, inputs" },
    { name: "Medium", class: "shadow-medium", desc: "Botões hover, modais" },
    { name: "Large", class: "shadow-large", desc: "FAB, elementos elevados" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">Style Guide</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Switch checked={isHighContrast} onCheckedChange={toggleHighContrast} />
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 space-y-12">
        {/* Filosofia */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Filosofia</h2>
          <Card className="glass">
            <CardContent className="pt-6">
              <p className="interpretive-text text-lg">
                Visual <strong>acolhedor e humano</strong>, não corporativo/bancário. 
                Foco em <strong>mudança de comportamento</strong>, não números.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Tipografia */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Tipografia</h2>
          <Card className="glass">
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2">Títulos — Playfair Display</Label>
                <h1 className="text-4xl font-semibold">Consciência Financeira</h1>
                <h2 className="text-3xl font-semibold">Subtítulo Elegante</h2>
                <h3 className="text-2xl font-medium">Seção Importante</h3>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2">Corpo — DM Sans</Label>
                <p className="text-lg">Texto grande para destaques e introduções.</p>
                <p className="text-base">Texto padrão para parágrafos e conteúdo geral.</p>
                <p className="text-sm text-muted-foreground">Texto pequeno para legendas e metadados.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cores Base */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Paleta de Cores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div 
                key={color.name}
                className={`${color.class} ${color.textClass} p-6 rounded-xl shadow-soft`}
              >
                <span className="font-medium">{color.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cores Emocionais */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Categorias Emocionais</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emotionColors.map((color) => (
              <div 
                key={color.name}
                className={`${color.class} ${color.textClass} p-6 rounded-xl shadow-soft`}
              >
                <span className="font-semibold block">{color.name}</span>
                <span className="text-sm opacity-90">{color.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Gradientes */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Gradientes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gradients.map((grad) => (
              <div 
                key={grad.name}
                className={`${grad.class} p-6 rounded-xl shadow-medium text-white`}
              >
                <span className="font-semibold block">{grad.name}</span>
                <span className="text-sm opacity-90">{grad.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sombras */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Sombras</h2>
          <div className="grid grid-cols-3 gap-6">
            {shadows.map((shadow) => (
              <div 
                key={shadow.name}
                className={`bg-card p-6 rounded-xl ${shadow.class}`}
              >
                <span className="font-semibold block">{shadow.name}</span>
                <span className="text-sm text-muted-foreground">{shadow.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Botões */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Botões</h2>
          <Card className="glass">
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">Variantes Principais</Label>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="warm">Warm</Button>
                  <Button variant="calm">Calm</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="soft">Soft</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">Categorias Emocionais</Label>
                <div className="flex flex-wrap gap-3">
                  <Button variant="essential">Essential</Button>
                  <Button variant="obligation">Obligation</Button>
                  <Button variant="pleasure">Pleasure</Button>
                  <Button variant="impulse">Impulse</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">Tamanhos</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                  <Button size="icon"><Plus /></Button>
                  <Button size="icon-lg" variant="warm"><Plus /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="badge-essential">Essential</Badge>
            <Badge className="badge-obligation">Obligation</Badge>
            <Badge className="badge-pleasure">Pleasure</Badge>
            <Badge className="badge-impulse">Impulse</Badge>
          </div>
        </section>

        {/* Ícones */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Ícones — Lucide React</h2>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-essential/10 rounded-xl text-essential">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">TrendingUp</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-impulse/10 rounded-xl text-impulse">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">TrendingDown</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                    <Minus className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">Minus</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 gradient-warm rounded-xl text-white">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">Plus</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-secondary rounded-xl text-secondary-foreground">
                    <Home className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">Home</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-secondary rounded-xl text-secondary-foreground">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">BarChart3</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-secondary rounded-xl text-secondary-foreground">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">Wallet</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Padrão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Card com sombra suave e bordas arredondadas.</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Card Glass</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Efeito de vidro fosco com blur de fundo.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Formulários</h2>
          <Card className="glass">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="example">Label do Campo</Label>
                <Input id="example" placeholder="Digite algo..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled">Campo Desabilitado</Label>
                <Input id="disabled" placeholder="Não editável" disabled />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Animações */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">Animações</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-6 rounded-xl shadow-soft animate-fade-in">
              <span className="font-medium">fade-in</span>
              <span className="block text-sm text-muted-foreground">0.4s</span>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft animate-scale-in">
              <span className="font-medium">scale-in</span>
              <span className="block text-sm text-muted-foreground">0.3s</span>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft animate-bounce-gentle">
              <span className="font-medium">bounce-gentle</span>
              <span className="block text-sm text-muted-foreground">2s infinite</span>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft animate-pulse">
              <span className="font-medium">pulse</span>
              <span className="block text-sm text-muted-foreground">2s infinite</span>
            </div>
          </div>
        </section>

        {/* FAB Demo */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">FAB — Floating Action Button</h2>
          <div className="flex items-center gap-4">
            <button className="w-16 h-16 rounded-full shadow-large flex items-center justify-center gradient-warm text-white">
              <Plus className="h-6 w-6" />
            </button>
            <span className="text-muted-foreground">Botão flutuante para ações principais</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StyleGuide;
