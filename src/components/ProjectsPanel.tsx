import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FolderOpen, X, Trash2, Loader2, Globe, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ClientInfo, StepResult } from "@/lib/strategy-steps";

export interface Project {
  id: string;
  client_name: string;
  client_sector: string;
  client_location: string | null;
  client_description: string | null;
  client_website: string | null;
  client_social_links: string | null;
  client_facebook: string | null;
  client_instagram: string | null;
  client_linkedin: string | null;
  client_youtube: string | null;
  client_tiktok: string | null;
  strategy_type: string;
  category: string;
  logo_url: string | null;
  results: Record<number, StepResult>;
  created_at: string;
  updated_at: string;
}

interface ProjectsPanelProps {
  open: boolean;
  onClose: () => void;
  onLoadProject: (clientInfo: ClientInfo, results: Record<number, StepResult>, logoUrl: string | null, projectId: string) => void;
}

export const ProjectsPanel = ({ open, onClose, onLoadProject }: ProjectsPanelProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "social" | "sito">("all");

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Errore nel caricamento progetti");
    } else {
      setProjects((data || []) as unknown as Project[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchProjects();
  }, [open]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare il progetto "${name}"?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Errore nell'eliminazione");
    } else {
      toast.success("Progetto eliminato");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleLoad = (project: Project) => {
    const clientInfo: ClientInfo = {
      name: project.client_name,
      sector: project.client_sector,
      location: project.client_location || "",
      description: project.client_description || "",
      strategyType: project.strategy_type as ClientInfo["strategyType"],
      website: project.client_website || "",
      socialLinks: project.client_social_links || "",
      facebook: project.client_facebook || "",
      instagram: project.client_instagram || "",
      linkedin: project.client_linkedin || "",
      youtube: project.client_youtube || "",
      tiktok: project.client_tiktok || "",
    };
    onLoadProject(clientInfo, project.results || {}, project.logo_url, project.id);
    onClose();
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-card border-l border-border shadow-elevated h-full overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-lg text-foreground">Progetti</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-border flex gap-2">
          {(["all", "social", "sito"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Tutti" : f === "social" ? "🎯 Social" : "🌐 Sito"}
            </button>
          ))}
        </div>

        {/* Projects list */}
        <div className="p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nessun progetto salvato</p>
            </div>
          ) : (
            filtered.map((project) => {
              const stepsCount = Object.keys(project.results || {}).length;
              return (
                <div
                  key={project.id}
                  className="p-4 rounded-xl border border-border bg-background hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => handleLoad(project)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {project.category === "social" ? (
                          <Share2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-sm text-foreground truncate">{project.client_name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.client_sector} · {project.client_location || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          project.category === "social" 
                            ? "bg-accent/10 text-accent" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {project.category === "social" ? "Social" : "Sito"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {stepsCount} step · {new Date(project.updated_at).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id, project.client_name);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to check for duplicate projects
export const checkDuplicateProject = async (clientName: string, category: string): Promise<Project | null> => {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("client_name", clientName)
    .eq("category", category)
    .limit(1);
  if (data && data.length > 0) return data[0] as unknown as Project;
  return null;
};

// Save or update project
export const saveProject = async (
  clientInfo: ClientInfo,
  results: Record<number, StepResult>,
  logoUrl: string | null,
  existingId?: string
): Promise<string | null> => {
  const category = clientInfo.strategyType === "seo" ? "sito" : "social";
  const payload = {
    client_name: clientInfo.name,
    client_sector: clientInfo.sector,
    client_location: clientInfo.location || null,
    client_description: clientInfo.description || null,
    client_website: clientInfo.website || null,
    client_social_links: clientInfo.socialLinks || null,
    client_facebook: clientInfo.facebook || null,
    client_instagram: clientInfo.instagram || null,
    client_linkedin: clientInfo.linkedin || null,
    client_youtube: clientInfo.youtube || null,
    client_tiktok: clientInfo.tiktok || null,
    strategy_type: clientInfo.strategyType,
    category,
    logo_url: logoUrl,
    results: results as any,
  };

  if (existingId) {
    const { error } = await supabase.from("projects").update(payload).eq("id", existingId);
    if (error) { toast.error("Errore nel salvataggio"); return null; }
    toast.success("Progetto aggiornato!");
    return existingId;
  }

  const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
  if (error) { toast.error("Errore nel salvataggio"); return null; }
  toast.success("Progetto salvato!");
  return data.id;
};
