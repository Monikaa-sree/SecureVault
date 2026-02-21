import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadFile, downloadFile, deleteFile } from "@/lib/supabase-helpers";
import { decryptFile } from "@/lib/crypto";
import UploadZone from "@/components/UploadZone";
import FileCard from "@/components/FileCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, Shield, LogOut, HardDrive, FileCheck, KeyRound, Lock, Mail, Send, Download, Eye,
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

  // File preview dialog
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewKeyInput, setPreviewKeyInput] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  // Share via email dialog
  const [shareFile, setShareFile] = useState<FileRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

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

  // --- File Preview ---
  const openPreview = (file: FileRecord) => {
    setPreviewFile(file);
    setPreviewKeyInput("");
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const handlePreviewDecrypt = async () => {
    if (!previewFile || !previewKeyInput) return;
    setPreviewing(true);
    try {
      const { data, error } = await supabase.storage
        .from("vault-files")
        .download(previewFile.storage_path);
      if (error) throw error;

      const decrypted = await decryptFile(data, previewKeyInput, previewFile.mime_type || "application/octet-stream");
      setPreviewBlob(decrypted);
      const url = URL.createObjectURL(decrypted);
      setPreviewUrl(url);
      toast.success("Decrypted!");
    } catch {
      toast.error("Decryption failed — wrong secret key?");
    } finally {
      setPreviewing(false);
    }
  };

  const handlePreviewDownload = () => {
    if (!previewUrl || !previewFile) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = previewFile.original_name;
    a.click();
  };

  // --- Share via Email ---
  const openShare = (file: FileRecord) => {
    setShareFile(file);
    setRecipientEmail("");
  };

  const handleSendEmail = async () => {
    if (!shareFile || !recipientEmail) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-encrypted-email", {
        body: {
          recipientEmail,
          fileId: shareFile.id,
          fileName: shareFile.name,
          mimeType: shareFile.mime_type,
          storagePath: shareFile.storage_path,
          appUrl: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Encrypted file link sent to ${recipientEmail}`);
      setShareFile(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setSending(false);
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

  const isPdf = (mime: string | null) => mime === "application/pdf";
  const isImage = (mime: string | null) => !!mime?.startsWith("image/");
  const isText = (mime: string | null) => !!mime?.startsWith("text/");

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
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
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
                onDownload={() => openPreview(file)}
                onDelete={() => handleDelete(file.id, file.storage_path)}
                onShare={() => openShare(file)}
              />
            ))}
          </div>
        )}
      </main>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="glass border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              {previewUrl ? "Decrypted file preview" : "This file is encrypted. Enter your secret key to view it."}
            </DialogDescription>
          </DialogHeader>

          {!previewUrl ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">File is encrypted</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {previewFile?.mime_type || "Unknown type"} • {previewFile ? formatSize(previewFile.size) : ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="previewKey">Secret Key</Label>
                <Input
                  id="previewKey"
                  type="password"
                  value={previewKeyInput}
                  onChange={(e) => setPreviewKeyInput(e.target.value)}
                  placeholder="Enter your secret key..."
                  onKeyDown={(e) => e.key === "Enter" && handlePreviewDecrypt()}
                  autoFocus
                />
              </div>
              <Button
                onClick={handlePreviewDecrypt}
                disabled={previewing || !previewKeyInput}
                className="w-full glow-primary"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewing ? "Decrypting..." : "Decrypt & Preview"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/30 text-center">
                <p className="text-accent font-medium text-sm">✓ Decrypted</p>
              </div>

              {isPdf(previewFile?.mime_type ?? null) && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[400px] rounded-xl border border-border"
                  title="Decrypted PDF"
                />
              )}
              {isImage(previewFile?.mime_type ?? null) && (
                <img src={previewUrl} alt={previewFile?.name} className="w-full rounded-xl border border-border" />
              )}
              {isText(previewFile?.mime_type ?? null) && previewBlob && (
                <TextPreview blob={previewBlob} />
              )}
              {!isPdf(previewFile?.mime_type ?? null) && !isImage(previewFile?.mime_type ?? null) && !isText(previewFile?.mime_type ?? null) && (
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-sm text-muted-foreground">Preview not available for this file type. Download to view.</p>
                </div>
              )}

              <Button onClick={handlePreviewDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Decrypted File
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share via Email Dialog */}
      <Dialog open={!!shareFile} onOpenChange={(open) => { if (!open) setShareFile(null); }}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Share Encrypted File
            </DialogTitle>
            <DialogDescription>
              Send "{shareFile?.name}" via email. The recipient will need your secret key to decrypt it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSendEmail}
              disabled={sending || !recipientEmail}
              className="glow-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Encrypted File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const TextPreview = ({ blob }: { blob: Blob }) => {
  const [text, setText] = useState("Loading...");
  useEffect(() => { blob.text().then(setText); }, [blob]);
  return (
    <pre className="w-full max-h-[300px] overflow-auto rounded-xl border border-border bg-secondary/50 p-4 text-xs whitespace-pre-wrap">
      {text}
    </pre>
  );
};

export default Vault;
