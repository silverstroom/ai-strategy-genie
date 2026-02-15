import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      toast.error("Credenziali non valide");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-elevated border-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full gradient-navy flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-serif text-2xl">Accesso</CardTitle>
          <p className="text-sm text-muted-foreground">Inserisci le credenziali per accedere</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome utente</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome utente"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full gap-2 gradient-gold text-accent-foreground">
              <LogIn className="h-4 w-4" />
              Accedi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
