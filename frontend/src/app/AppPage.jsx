import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, User, Folder } from "lucide-react";
import Sidebar from "../Components/SideBar/Sidebar";
import ChatWindow from "../Components/Chat/ChatWindow";
import ProjectFiles from "../Components/Files/ProjectFiles";
import { useToast } from "../Components/Toast/Toast";
import apiFetch from "../../apifetch";
import "./AppPage.css";

const BASE_URL = import.meta.env.VITE_BASE_URL

export default function AppPage() {
  // Route params are the source of truth for which project/chat is open.
  // /new                                  -> no project, no chat
  // /projects/:projectId                  -> project open, no chat selected
  // /projects/:projectId/chat/:chatId     -> project + specific chat open
  const { projectId: projectIdParam, chatId: chatIdParam } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSession, setChatSession] = useState(null);
  const [chatTitle, setChatTitle] = useState(null);
  const [projectChats, setProjectChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  // Bumped whenever ChatInput finishes uploading a file, so ProjectFiles
  // knows to refetch instead of only fetching once on project mount.
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  // On mobile, the files panel is a drawer instead of a permanent column
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(false);
  const toast = useToast();

  // ── :projectId + projects list -> activeProject ──────────────────────────
  // Sidebar fetches the project list itself and reports it up via
  // onProjectsChange (below). Once we have it, resolve the URL's projectId
  // into the full project object (needed for activeProject.name etc.).
  useEffect(() => {
    if (!projectIdParam) {
      setActiveProject(null);
      return;
    }

    const match = projects.find(
      (p) => String(p.project_id) === String(projectIdParam)
    );

    if (match) {
      setActiveProject((prev) =>
        prev?.project_id === match.project_id ? prev : match
      );
    } else if (projects.length > 0) {
      // Projects have loaded and none match this id -> stale/bad URL
      toast.error("Project not found");
      navigate("/new", { replace: true });
    }
    // if projects.length === 0 they just haven't loaded yet — wait for the
    // next run of this effect once Sidebar reports them.
  }, [projectIdParam, projects]);

  // ── activeProject -> fetch that project's chats ──────────────────────────
  useEffect(() => {
    if (!activeProject) {
      setProjectChats([]);
      return;
    }

    const fetchChats = async () => {
      setLoadingChats(true);
      try {
        const response = await apiFetch(
          `${BASE_URL}/chat/${activeProject.project_id}`,
          "GET"
        );

        if (response.ok) {
          const data = await response.json();

          // Backend returns Projects array with chats relationship
          // Extract chats from the first project
          const chats = Array.isArray(data) && data.length > 0 && data[0].chats
            ? data[0].chats
            : [];

          setProjectChats(chats);
        } else {
          setProjectChats([]);
        }
      } catch (err) {
        console.log("Failed to fetch chats:", err);
        setProjectChats([]);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChats();
  }, [activeProject]);

  // ── :chatId + projectChats -> chatSession ─────────────────────────────────
  useEffect(() => {
    if (!activeProject) {
      setChatSession(null);
      setChatTitle(null);
      return;
    }

    if (!chatIdParam) {
      // /projects/:projectId with no chat yet — fresh compose state.
      // Chat will be created after the first message via /chat/init.
      setChatSession({
        chat_id: null,
        project_id: activeProject.project_id,
        isFirstMessage: true,
      });
      setChatTitle(null);
      return;
    }

    const match = projectChats.find(
      (c) => String(c.chat_id) === String(chatIdParam)
    );

    if (match) {
      setChatSession({
        chat_id: match.chat_id,
        project_id: activeProject.project_id,
        isFirstMessage: false,
      });
      setChatTitle(match.title);
    }
    // If projectChats hasn't loaded this chat yet, wait — this effect
    // re-runs once fetchChats resolves.
  }, [activeProject, chatIdParam, projectChats]);

  // Sidebar reports its live project list here so the :projectId route can
  // be resolved into a full project object.
  const handleProjectsChange = (list) => {
    setProjects(list);
  };

  // Project selected, created, or deleted (deleted -> null). Just navigate —
  // the effects above derive all other state from the resulting URL.
  const handleSelectProject = (project) => {
    if (!project) {
      navigate("/new");
      return;
    }
    navigate(`/projects/${project.project_id}`);
  };

  // Chat clicked in sidebar
  const handleChatSelect = (chat) => {
    if (!activeProject) return;
    navigate(`/projects/${activeProject.project_id}/chat/${chat.chat_id}`);
  };

  // ChatInput uploads files itself as soon as they're selected (see
  // ChatInput.jsx's uploadFile, POST /chat/upload?project_id=...) — this is
  // just a signal so the ProjectFiles panel knows to refetch.
  const handleFileUploaded = () => {
    setFilesRefreshKey((k) => k + 1);
  };

  // Handle sending a message
  const handleSendMessage = async (text, attachments, priorMessages = []) => {
    if (!chatSession) return null;

    try {
      // If this is the first message, call /chat/init which handles:
      // 1. Generating the title
      // 2. Creating the chat in the database
      // 3. Returning the Chat object with chat_id
      //
      // Note: attachments are already fully uploaded by this point — ChatInput
      // uploads each file immediately on selection (POST /chat/upload), well
      // before send is ever clicked — so there's nothing left to upload here.
      if (chatSession.isFirstMessage) {
        try {
          const initResponse = await apiFetch(
            `${BASE_URL}/chat/init`,
            "POST",
            {},
            JSON.stringify({
              project_id: chatSession.project_id,
              message: text,
            })
          );

          if (!initResponse.ok) {
            throw new Error(`Init API error: ${initResponse.status}`);
          }

          const chatData = await initResponse.json();
          const newChatId = chatData.chat_id;
          const newChatTitle = chatData.title;

          // Update state with the created chat
          setChatTitle(newChatTitle);
          setChatSession((prev) => ({
            ...prev,
            chat_id: newChatId,
            isFirstMessage: false,
          }));

          // Add the new chat to the list
          setProjectChats((prev) => [
            ...prev,
            {
              chat_id: newChatId,
              title: newChatTitle,
              project_id: chatSession.project_id,
            },
          ]);

          // Reflect the new chat in the URL. `replace: true` so the brief
          // pre-chat "/projects/:id" moment isn't kept as its own history
          // entry (back button shouldn't land you back on an empty compose).
          navigate(
            `/projects/${chatSession.project_id}/chat/${newChatId}`,
            { replace: true }
          );

          // Continue to send message with the new chat_id
          chatSession.chat_id = newChatId;
        } catch (err) {
          console.error("Chat init error:", err);
          toast.error("Failed to create chat");
          return null;
        }
      }

      // Now send the message to the /chat endpoint. `messages` carries the
      // FULL conversation — prior history plus this current turn appended
      // as the last entry — so the backend can use it directly without
      // re-querying the DB. `attachments` carries just the filenames of any
      // files uploaded for THIS message, for the backend to store into the
      // human message's `context` column (same column/shape AI responses
      // use for their retrieval sources).
      try {
        const conversationPayload = {
          chat_id: chatSession.chat_id,
          project_id: chatSession.project_id,
          message: text,
          messages: [
            ...priorMessages.map((m) => ({
              role: m.role === "user" ? "human" : "ai",
              content: m.content,
            })),
            { role: "human", content: text },
          ],
          attachments: attachments.map((a) => ({ filename: a.filename })),
        };

        const response = await apiFetch(
          `${BASE_URL}/chat/`,
          "POST",
          {},
          JSON.stringify(conversationPayload)
        );

        if (!response.ok) {
          throw new Error(`Message API error: ${response.status}`);
        }

        const data = await response.json();
        // Backend returns the ai_message row: { role: "ai", content, context, ... }
        return {
          role: "assistant",
          content: data.content,
          context: data.context,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      } catch (apiErr) {
        console.error("Chat message API error:", apiErr);
        toast.error("Failed to get a response");
        return null;
      }
    } catch (err) {
      console.error("Error in handleSendMessage:", err);
      return null;
    }
  };

  // Display title: use generated chat title if available, else project name, else default
  const displayTitle = chatTitle || activeProject?.name || "Mnemo";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeProjectId={activeProject?.project_id ?? null}
        onProjectsChange={handleProjectsChange}
        onCreateProject={handleSelectProject}
        onSelectProject={handleSelectProject}
        projectChats={projectChats}
        onChatSelect={handleChatSelect}
        loadingChats={loadingChats}
      />

      {/* Chat area */}
      <main className="app-main">
        <div className="app-main-header">
          <button
            type="button"
            aria-label="Open project menu"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} strokeWidth={2} />
          </button>
          <span className="app-main-title">
            {displayTitle}
          </span>

          {activeProject && (
            <button
              type="button"
              aria-label="Open files"
              className="mobile-files-button"
              onClick={() => setFilesDrawerOpen(true)}
            >
              <Folder size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <ChatWindow
          project={activeProject}
          chatSession={chatSession}
          onSendMessage={handleSendMessage}
          onFileUploaded={handleFileUploaded}
        />
      </main>

      {activeProject && (
        <ProjectFiles
          projectId={activeProject.project_id}
          refreshKey={filesRefreshKey}
          mobileOpen={filesDrawerOpen}
          onClose={() => setFilesDrawerOpen(false)}
        />
      )}
    </div>
  );
}
