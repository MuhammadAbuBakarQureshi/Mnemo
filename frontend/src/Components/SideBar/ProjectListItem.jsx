import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function ProjectListItem({ project, isActive, onSelect, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const menuRef = useRef(null);
  const itemRef = useRef(null);

  useEffect(() => {
    if (!menuOpen && !isRenaming) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && itemRef.current && !itemRef.current.contains(e.target)) {
        setMenuOpen(false);
        if (isRenaming) cancelRename();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, isRenaming]);

  const startRename = () => {
    setDraftName(project.name);
    setIsRenaming(true);
    setMenuOpen(false);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setDraftName(project.name);
  };

  return (
    <li 
      ref={itemRef}
      className={`project-item ${isActive ? "project-item-active" : ""}`}
    >
      {isRenaming ? (
        <input
          autoFocus
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const trimmed = draftName.trim();
              setIsRenaming(false);
              if (trimmed.length > 0 && trimmed !== project.name) {
                onRename(project.project_id, trimmed);
              }
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelRename();
            }
          }}
          className="w-full rounded-md border border-border bg-white px-2 py-1 text-[14px] font-semibold text-ink outline-none"
        />
      ) : (
        <div className="project-meta">
          {/* Clicking the name/description area selects the project */}
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => onSelect?.(project)}
          >
            <div className="project-name">{project.name}</div>
            {project.description && (
              <div className="project-description">
                {project.description}
              </div>
            )}
          </div>

          <div className="project-menu-wrapper">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              aria-label="Project options"
              className={`project-menu-btn ${menuOpen ? "open" : ""}`}
            >
              <MoreVertical size={16} strokeWidth={2} />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="project-menu-dropdown"
              >
                <button
                  onClick={startRename}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-black/5"
                >
                  <Pencil size={14} strokeWidth={2} />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project.project_id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-asterisk transition-colors hover:bg-black/5"
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
