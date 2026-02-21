import { Download, Trash2, Shield, Image, FileText, Music, Video, File, Archive, Table } from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";

interface FileCardProps {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  createdAt: string;
  isEncrypted: boolean;
  onDownload: () => void;
  onDelete: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  image: <Image className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  "file-text": <FileText className="w-5 h-5" />,
  archive: <Archive className="w-5 h-5" />,
  table: <Table className="w-5 h-5" />,
  file: <File className="w-5 h-5" />,
};

const FileCard = ({ name, size, mimeType, createdAt, isEncrypted, onDownload, onDelete }: FileCardProps) => {
  const iconType = getFileIcon(mimeType);

  return (
    <div className="glass-hover rounded-xl p-4 group animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            {iconMap[iconType]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate text-sm">{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{formatFileSize(size)}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {new Date(createdAt).toLocaleDateString()}
              </span>
              {isEncrypted && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Shield className="w-3 h-3 text-accent" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
