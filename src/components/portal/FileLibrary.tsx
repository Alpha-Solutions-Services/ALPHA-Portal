"use client";

import { Download, FileText, Upload } from "lucide-react";
import type { PortalFile } from "@/lib/sanity/portal-data";

export function FileLibrary({
  files,
  onUploadClick,
}: {
  files: PortalFile[];
  onUploadClick?: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/30">
      <div className="border-b border-[var(--color-border)] p-6">
        <h2
          className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          <FileText className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
          Project files
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Documents and assets shared for your programs.
        </p>
      </div>
      <div className="p-6">
        {files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((f) => {
              const href = f.downloadUrl || f.fileAssetUrl || "#";
              return (
                <li
                  key={f._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      className="h-5 w-5 shrink-0 text-[var(--color-muted)]"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {f.fileName}
                      </p>
                      {f.projectTitle ? (
                        <span className="mt-1 inline-block rounded border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
                          {f.projectTitle}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg p-2 text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
                    aria-label={`Download ${f.fileName}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <FileText
              className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted)]"
              aria-hidden
            />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              No files yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
              Project files appear here when your team publishes them in the
              portal CMS.
            </p>
            {onUploadClick ? (
              <button
                type="button"
                onClick={onUploadClick}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Upload files
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
