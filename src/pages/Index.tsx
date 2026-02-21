import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Cloud, Search, ArrowRight, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-vault.jpg";

const features = [
  { icon: Lock, title: "End-to-End Encryption", desc: "Every file is encrypted before it leaves your device" },
  { icon: Cloud, title: "Cloud Storage", desc: "Access your files securely from anywhere, anytime" },
  { icon: Search, title: "Instant Search", desc: "Find any file in seconds with keyword search" },
  { icon: Shield, title: "Access Control", desc: "You control who can view and download your files" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl">SecureVault</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/auth")}>
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-accent" />
              Enterprise-grade security
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Your files,{" "}
              <span className="text-gradient">encrypted</span>
              {" "}& secure
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">
              Store, manage, and access your files with military-grade encryption.
              Your privacy is our priority.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="glow-primary" onClick={() => navigate("/auth")}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden border border-border/50 glow-primary">
              <img src={heroImage} alt="Secure digital vault" className="w-full" />
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-xl px-4 py-3 flex items-center gap-3 animate-float">
              <Shield className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs font-semibold">256-bit AES</p>
                <p className="text-xs text-muted-foreground">Encryption active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-hover rounded-xl p-6 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SecureVault. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
