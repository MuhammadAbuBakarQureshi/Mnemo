import { useState, useEffect } from "react";
import { FileText, Trash2, Download, Loader } from "lucide-react";
import apiFetch from "../../../apifetch";
import { useToast } from "../Toast/Toast";
import "./ProjectFiles.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * ProjectFiles
 *
 * Right-hand panel listing documents uploaded to the active project.
 * Fetches via GET /documents/{project_id} and supports delete-only
 * (no rename) via DELETE /documents/{document_id}.
 *
 * Props:
 * - projectId: currently active project's ID. Panel renders nothing if null.
 * - refreshKey: bump this (e.g. increment a counter) to force a refetch,
 *   such as right after a file finishes uploading elsewhere in the UI.
 */
export default function ProjectFiles({ projectId, refreshKey }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!projectId) {
      setFiles([]);
      return;
    }

    let cancelled = false;

    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(
          `${BASE_URL}/documents/${projectId}`,
          "GET"
        );

        if (!response || !response.ok) {
          if (!cancelled) setFiles([]);
          return;
        }

        const data = await response.json();
        if (!cancelled) setFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch project files:", err);
        if (!cancelled) setFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFiles();

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  const handleDelete = async (documentId) => {
    setDeletingId(documentId);
    const previous = files;
    // Optimistic removal
    setFiles((prev) => prev.filter((f) => (f.id ?? f.document_id) !== documentId));

    try {
      const response = await apiFetch(
        `${BASE_URL}/documents/${documentId}`,
        "DELETE"
      );

      if (!response || !response.ok) {
        throw new Error(`Delete failed (${response?.status})`);
      }

      toast.success("File deleted");
    } catch (err) {
      console.error("Failed to delete file:", err);
      toast.error("Failed to delete file");
      setFiles(previous); // roll back on failure
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (documentId, filename) => {
    setDownloadingId(documentId);
    try {
      const response = await apiFetch(
        `${BASE_URL}/documents/${documentId}/download`,
        "GET"
      );

      if (!response || !response.ok) {
        throw new Error(`Download failed (${response?.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file:", err);
      toast.error("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!projectId) return null;

  return (
    <aside className="project-files-panel">
      <div className="project-files-header">Files</div>

      {loading ? (
        <p className="project-files-empty">Loading...</p>
      ) : files.length === 0 ? (
        <p className="project-files-empty">No files uploaded yet</p>
      ) : (
        <ul className="project-files-list">
          {files.map((file) => {
            const fileId = file.id ?? file.document_id;
            return (
              <li key={fileId} className="project-files-item">
                <FileText size={15} strokeWidth={2} className="project-files-icon" />
                <span className="project-files-name" title={file.filename}>
                  {file.filename}
                </span>
                <button
                  type="button"
                  className="project-files-download-btn"
                  aria-label={`Download ${file.filename}`}
                  onClick={() => handleDownload(fileId, file.filename)}
                  disabled={downloadingId === fileId}
                >
                  {downloadingId === fileId ? (
                    <Loader size={13} className="project-files-delete-spinner" />
                  ) : (
                    <Download size={13} strokeWidth={2} />
                  )}
                </button>
                <button
                  type="button"
                  className="project-files-delete-btn"
                  aria-label={`Delete ${file.filename}`}
                  onClick={() => handleDelete(fileId)}
                  disabled={deletingId === fileId}
                >
                  {deletingId === fileId ? (
                    <Loader size={13} className="project-files-delete-spinner" />
                  ) : (
                    <Trash2 size={13} strokeWidth={2} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
