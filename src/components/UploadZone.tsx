import { useState, useCallback } from "react";
import { Upload, CloudUpload } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploading: boolean;
}

const UploadZone = ({ onFilesSelected, uploading }: UploadZoneProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  };

  return (
    <label
      className={`block cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-8 text-center ${
        dragOver
          ? "border-primary bg-primary/5 glow-primary"
          : "border-border hover:border-primary/50 hover:bg-card/40"
      } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input type="file" multiple className="hidden" onChange={handleFileInput} disabled={uploading} />
      <div className="flex flex-col items-center gap-3">
        {uploading ? (
          <CloudUpload className="w-10 h-10 text-primary animate-pulse" />
        ) : (
          <Upload className="w-10 h-10 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-sm">
            {uploading ? "Encrypting & uploading..." : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All files are encrypted before storage
          </p>
        </div>
      </div>
    </label>
  );
};

export default UploadZone;
