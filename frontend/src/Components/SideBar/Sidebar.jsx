import { useState, useEffect } from "react";
import { Plus, Search, PanelLeftClose, PanelLeftOpen, MessageCircle, X } from "lucide-react";
import { useToast } from "../../components/Toast/Toast";
import ProjectList from "./ProjectList";
import NewProjectModal from "./NewProjectModal";
import apiFetch from "../../../apifetch";
import "./Sidebar.css";

const BASE_URL = import.meta.env.VITE_BASE_URL

export default function Sidebar({ 
  open = true, 
  setOpen, 
  activeProjectId = null,
  onProjectsChange,
  onCreateProject, 
  onSelectProject,
  projectChats = [],
  onChatSelect,
  loadingChats = false
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 980);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  // Track viewport changes to know if we should auto-close on selection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 980);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiFetch(`${BASE_URL}/project/`, "GET");
        const data = await response.json();

        if (response.ok){

          setProjects(data);
        }
        else{
          
          toast.error("Error while fetching projects")
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, []);

  // Report the live project list up to the parent so it can resolve the
  // :projectId route param into a full project object.
  useEffect(() => {
    onProjectsChange?.(projects);
  }, [projects]);

  const handleCreate = async ({ name, description }) => {
    try {
      const body = JSON.stringify({ name, description });
      const response = await apiFetch(`${BASE_URL}/project/`, "POST", {}, body);
      const created = await response.json();
      setProjects((prev) => [...prev, created]);
      onCreateProject?.(created);
      setModalOpen(false);
      toast.success("Project created");
    } catch (err) {
      const msg = err?.description || err?.message || err || "Something went wrong. Please try again.";
      toast.error(msg);
      console.error("Failed to create project:", err);
    }
  };

  const handleRename = async (projectId, newName) => {
    const previous = projects;
    setProjects((prev) =>
      prev.map((p) => (p.project_id === projectId ? { ...p, name: newName } : p))
    );
    try {
      const body = JSON.stringify({ name: newName });
      await apiFetch(`${BASE_URL}/project/${projectId}`, "PATCH", {}, body);
      toast.success("Project renamed");
    } catch (err) {
      const msg = err?.description || err?.message || err || "Failed to rename project";
      toast.error(msg);
      console.error("Failed to rename project:", err);
      setProjects(previous);
    }
  };

  const handleDelete = async (projectId) => {
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
    if (activeProjectId === projectId) {
      onSelectProject?.(null);
    }
    try {
      await apiFetch(`${BASE_URL}/project/${projectId}`, "DELETE", {});
      toast.success("Project deleted");
    } catch (err) {
      const msg = err?.description || err?.message || err || "Failed to delete project";
      toast.error(msg);
      console.error("Failed to delete project:", err);
      setProjects(previous);
    }
  };

  const handleSelect = (project) => {
    onSelectProject?.(project);
    // On mobile, auto-close sidebar when a project is selected
    if (isMobile) {
      setOpen?.(false);
    }
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      const next = !open;
      if (!next) setSearchQuery("");
      return next;
    });
  };

  // Client-side filter — no request needed, projects are already in state
  const filteredProjects = searchQuery.trim()
    ? projects.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : projects;

  const handleChatClick = (chat) => {
    onChatSelect?.(chat);
    // On mobile, auto-close sidebar when a chat is selected
    if (isMobile) {
      setOpen?.(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${open ? "active" : ""}`}
        onClick={() => setOpen?.(false)}
      />

      {/* Full sidebar */}
      <aside
        className={`sidebar-root overflow-hidden bg-panel ${open ? "sidebar-open" : "sidebar-collapsed"}`}
      >
        <div className="sidebar-inner flex flex-col">
          {/* Topbar */}
          <div className="sidebar-topbar">
            <span className="sidebar-title">Mnemo</span>
            <div className="sidebar-actions">
              <button
                aria-label={searchOpen ? "Close search" : "Search projects"}
                className={`sidebar-action-btn ${searchOpen ? "open" : ""}`}
                onClick={toggleSearch}
              >
                <Search size={17} strokeWidth={2} />
              </button>
              <button
                onClick={() => setOpen?.(false)}
                aria-label="Close sidebar"
                className="sidebar-action-btn"
              >
                <PanelLeftClose size={17} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Search input — filters projects locally as you type, no request */}
          {searchOpen && (
            <div className="sidebar-search-wrapper">
              <Search size={15} strokeWidth={2} className="sidebar-search-icon" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSearchQuery("");
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search projects..."
                className="sidebar-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="sidebar-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {/* New project button */}
          <div className="sidebar-new-project">
            <button
              onClick={() => setModalOpen(true)}
              className="flex w-full items-center justify-center gap-2"
            >
              <Plus size={17} strokeWidth={2.5} />
              New project
            </button>
          </div>

          {/* Project list and chats */}
          <div className="sidebar-list-wrapper">
            {/* Projects */}
            <ProjectList
              projects={filteredProjects}
              activeProjectId={activeProjectId}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />

            {searchQuery.trim() && filteredProjects.length === 0 && (
              <p className="sidebar-search-empty">No projects match &ldquo;{searchQuery}&rdquo;</p>
            )}

            {/* Chats for selected project */}
            {activeProjectId && projectChats.length > 0 && (
              <div className="sidebar-chats-section">
                <div className="sidebar-chats-header">
                  <MessageCircle size={14} strokeWidth={2} />
                  <span>Recent Chats</span>
                </div>
                <ul className="sidebar-chats-list">
                  {projectChats.map((chat) => (
                    <li key={chat.chat_id}>
                      <button
                        onClick={() => handleChatClick(chat)}
                        className="sidebar-chat-item"
                        title={chat.title}
                      >
                        <span className="sidebar-chat-title">{chat.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Loading indicator */}
            {activeProjectId && loadingChats && (
              <div className="sidebar-loading">
                <div className="sidebar-spinner"></div>
                <span>Loading chats...</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Collapsed rail (desktop only) — a narrow panel in the layout flow,
          visually separated from the main content card. Hidden on mobile
          since AppPage's header button handles that case. */}
      {!open && (
        <div className="sidebar-rail">
          <button
            onClick={() => setOpen?.(true)}
            aria-label="Open sidebar"
            className="sidebar-action-btn"
          >
            <PanelLeftOpen size={18} strokeWidth={2} />
          </button>
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
