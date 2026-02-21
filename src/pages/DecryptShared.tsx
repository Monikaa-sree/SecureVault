import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decryptFile } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, KeyRound, Lock, FileText, Download, ArrowLeft, AlertTriangle } from "lucide-react";

const DecryptShared = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [error, setError] = useState("");
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (shareToken) fetchEncryptedFile();
  }, [shareToken]);

  const fetchEncryptedFile = async () => {
    setFetching(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/get-shared-file?token=${shareToken}`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch file");
      }

      const blob = await res.blob();
      setEncryptedBlob(blob);
      setFileName(res.headers.get("X-File-Name") || "file");
      setMimeType(res.headers.get("X-Mime-Type") || "application/octet-stream");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptedBlob || !secretKey) return;
    setLoading(true);
    try {
      const decrypted = await decryptFile(encryptedBlob, secretKey, mimeType);
      setDecryptedBlob(decrypted);
      const url = URL.createObjectURL(decrypted);
      setDecryptedUrl(url);
      toast.success("File decrypted successfully!");
    } catch {
      toast.error("Decryption failed — wrong secret key?");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedUrl) return;
    const a = document.createElement("a");
    a.href = decryptedUrl;
    a.download = fileName;
    a.click();
  };

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const isText = mimeType.startsWith("text/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-lg">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
              <Shield className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Decrypt Shared File</h1>

          {fetching && (
            <p className="text-muted-foreground text-center mt-4 text-sm animate-pulse">
              Loading encrypted file...
            </p>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive text-sm">Unable to load file</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}

          {encryptedBlob && !decryptedUrl && (
            <>
              <div className="mt-4 p-4 rounded-xl bg-secondary/50 flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Encrypted • Enter secret key to view</p>
                </div>
              </div>

              <form onSubmit={handleDecrypt} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sharedKey">Secret Key</Label>
                  <Input
                    id="sharedKey"
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter the secret key..."
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full glow-primary" disabled={loading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? "Decrypting..." : "Decrypt File"}
                </Button>
              </form>
            </>
          )}

          {decryptedUrl && (
            <div className="mt-6 space-y-4">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-center">
                <p className="text-accent font-medium text-sm">✓ File decrypted successfully</p>
              </div>

              {/* Preview area */}
              {isPdf && (
                <iframe
                  src={decryptedUrl}
                  className="w-full h-[500px] rounded-xl border border-border"
                  title="Decrypted PDF"
                />
              )}
              {isImage && (
                <img
                  src={decryptedUrl}
                  alt={fileName}
                  className="w-full rounded-xl border border-border"
                />
              )}
              {isText && (
                <TextPreview blob={decryptedBlob!} />
              )}

              <Button onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download {fileName}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Simple text file preview */
const TextPreview = ({ blob }: { blob: Blob }) => {
  const [text, setText] = useState("Loading...");
  useEffect(() => {
    blob.text().then(setText);
  }, [blob]);
  return (
    <pre className="w-full max-h-[400px] overflow-auto rounded-xl border border-border bg-secondary/50 p-4 text-xs whitespace-pre-wrap">
      {text}
    </pre>
  );
};

export default DecryptShared;
