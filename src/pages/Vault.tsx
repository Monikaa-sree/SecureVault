import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadFile, downloadFile, deleteFile } from "@/lib/supabase-helpers";
import UploadZone from "@/components/UploadZone";
import FileCard from "@/components/FileCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, Shield, LogOut, HardDrive, FileCheck, KeyRound, Lock,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  is_encrypted: boolean;
  created_at: string;
}

const Vault = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Secret key state
  const [secretKey, setSecretKey] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Download dialog state
  const [downloadDialog, setDownloadDialog] = useState<{
    open: boolean;
    storagePath: string;
    fileName: string;
    mimeType: string | null;
  }>({ open: false, storagePath: "", fileName: "", mimeType: null });
  const [downloadKeyInput, setDownloadKeyInput] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isUnlocked) fetchFiles();
  }, [user, isUnlocked]);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load files");
    } else {
      setFiles(data || []);
    }
    setLoadingFiles(false);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKeyInput.length < 4) {
      toast.error("Secret key must be at least 4 characters");
      return;
    }
    setSecretKey(secretKeyInput);
    setIsUnlocked(true);
    toast.success("Vault unlocked!");
  };

  const handleUpload = async (selectedFiles: File[]) => {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        await uploadFile(file, user.id, secretKey);
      }
      toast.success(`${selectedFiles.length} file(s) encrypted & uploaded`);
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openDownloadDialog = (storagePath: string, fileName: string, mimeType: string | null) => {
    setDownloadKeyInput("");
    setDownloadDialog({ open: true, storagePath, fileName, mimeType });
  };

  const handleDownloadConfirm = async () => {
    if (!downloadKeyInput) {
      toast.error("Please enter your secret key");
      return;
    }
    setDownloading(true);
    try {
      await downloadFile(
        downloadDialog.storagePath,
        downloadDialog.fileName,
        downloadDialog.mimeType,
        downloadKeyInput
      );
      setDownloadDialog({ open: false, storagePath: "", fileName: "", mimeType: null });
      toast.success("File decrypted & downloaded");
    } catch {
      toast.error("Decryption failed — wrong secret key?");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (fileId: string, storagePath: string) => {
    try {
      await deleteFile(fileId, storagePath);
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <Shield className="w-8 h-8 text-primary animate-glow-pulse" />
      </div>
    );
  }

  // Secret key gate screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">Enter Secret Key</h1>
            <p className="text-muted-foreground text-center mb-8 text-sm">
              Your secret key is used to encrypt & decrypt all files. Keep it safe — it is never stored on our servers.
            </p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder="Enter your secret key..."
                  required
                  minLength={4}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full glow-primary">
                <Lock className="w-4 h-4 mr-2" />
                Unlock Vault
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => { signOut(); navigate("/"); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Sign out instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg">SecureVault</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileCheck className="w-4 h-4" />
              <span className="text-xs">Total Files</span>
            </div>
            <p className="text-2xl font-bold">{files.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs">Storage Used</span>
            </div>
            <p className="text-2xl font-bold">
              {totalSize > 0 ? (totalSize / (1024 * 1024)).toFixed(1) + " MB" : "0 B"}
            </p>
          </div>
          <div className="glass rounded-xl p-4 hidden sm:block">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs">Encrypted</span>
            </div>
            <p className="text-2xl font-bold text-accent">100%</p>
          </div>
        </div>

        {/* Upload */}
        <UploadZone onFilesSelected={handleUpload} uploading={uploading} />

        {/* Search */}
        <div className="relative mt-8 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Files */}
        {loadingFiles ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading your vault...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "No files match your search" : "Your vault is empty. Upload your first file!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                id={file.id}
                name={file.name}
                size={file.size}
                mimeType={file.mime_type}
                createdAt={file.created_at}
                isEncrypted={file.is_encrypted}
                onDownload={() => openDownloadDialog(file.storage_path, file.original_name, file.mime_type)}
                onDelete={() => handleDelete(file.id, file.storage_path)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Download secret key dialog */}
      <Dialog open={downloadDialog.open} onOpenChange={(open) => {
        if (!open) setDownloadDialog({ open: false, storagePath: "", fileName: "", mimeType: null });
      }}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Enter Secret Key to Decrypt
            </DialogTitle>
            <DialogDescription>
              Enter the secret key you used when uploading to decrypt "{downloadDialog.fileName}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="downloadKey">Secret Key</Label>
            <Input
              id="downloadKey"
              type="password"
              value={downloadKeyInput}
              onChange={(e) => setDownloadKeyInput(e.target.value)}
              placeholder="Enter your secret key..."
              onKeyDown={(e) => e.key === "Enter" && handleDownloadConfirm()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleDownloadConfirm}
              disabled={downloading || !downloadKeyInput}
              className="glow-primary"
            >
              <Lock className="w-4 h-4 mr-2" />
              {downloading ? "Decrypting..." : "Decrypt & Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vault;
