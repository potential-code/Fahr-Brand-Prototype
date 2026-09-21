import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Document upload for the twin's "learn from your own work" step.
 *
 * Nothing is uploaded anywhere and no file is parsed — the browser reads only
 * the name, size and type, which is all that is ever shown. The file does not
 * leave the machine. That is worth being straight about in a demo: if a client
 * asks whether it really read their document, the answer is that it read the
 * file, not its contents.
 */

const PARSE_MS = 1100;

type Staged = { id: string; name: string; size: number };

/** Bytes as a human file size, the way a file manager would show it. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TwinDocumentUpload({ onLearned }: { onLearned: (name: string) => void }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState<Staged[]>([]);

  const ingest = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const staged: Staged = {
        id: `${file.name}-${file.size}-${index}`,
        name: file.name,
        size: file.size,
      };
      setParsing((current) => [...current, staged]);

      // A beat of "reading" before the document joins the twin, so the step
      // reads as ingestion rather than a list append.
      window.setTimeout(() => {
        setParsing((current) => current.filter((entry) => entry.id !== staged.id));
        onLearned(file.name);
      }, PARSE_MS);
    });
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          ingest(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5"
        }`}
        data-testid="twin-document-dropzone"
      >
        <UploadCloud className={`h-5 w-5 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium">
          {isAr ? "أفلِت مستنداتك هنا" : "Drop your documents here"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAr ? "أو اضغط للاختيار — تبقى الملفات على جهازك" : "or click to choose — files stay on your device"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.md"
        className="hidden"
        onChange={(event) => {
          ingest(event.target.files);
          // Reset so the same file can be picked again in a repeated demo.
          event.target.value = "";
        }}
        data-testid="twin-document-input"
      />

      {parsing.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2"
          data-testid="twin-document-parsing"
        >
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatSize(file.size)} · {isAr ? "جارٍ تعلّم التنسيق…" : "learning the format…"}
            </p>
          </div>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
        </div>
      ))}
    </div>
  );
}
