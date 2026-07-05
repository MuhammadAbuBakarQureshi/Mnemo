import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../../apifetch";
import { useToast } from "../Toast/Toast";
import "./UserMenu.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

/**
 * UserMenu
 *
 * Bottom-of-sidebar user card: avatar, name, and a chevron that opens a
 * small popover with a Log out action. Renders a collapsed avatar-only
 * version when `collapsed` is true (used in the collapsed sidebar rail).
 */
export default function UserMenu({ collapsed = false }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch(`${BASE_URL}/user/me`, "GET");
        if (response && response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Close the popover on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await apiFetch(`${BASE_URL}/user/logout`, "POST");
      if (!response || !response.ok) {
        throw new Error(`Logout failed (${response?.status})`);
      }
      toast.success("Logged out successfully")
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
      toast.error("Failed to log out");
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const name = user?.name || user?.email || "Account";
  const initials = getInitials(user?.name);

  if (collapsed) {
    return (
      <div className="user-menu-collapsed-wrapper" ref={wrapperRef}>
        <button
          type="button"
          className="user-menu-avatar user-menu-avatar-collapsed"
          aria-label="Account menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="user-menu-popover user-menu-popover-collapsed">
            <div className="user-menu-popover-header">
              <span className="user-menu-popover-name">{name}</span>
            </div>
            <button
              type="button"
              className="user-menu-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={15} strokeWidth={2} />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="user-menu-wrapper" ref={wrapperRef}>
      <div className="user-menu-card">
        <div className="user-menu-avatar">{initials}</div>

        <div className="user-menu-info">
          <span className="user-menu-name" title={name}>{name}</span>
        </div>

        <button
          type="button"
          className="user-menu-icon-btn"
          aria-label={menuOpen ? "Close account menu" : "Open account menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <ChevronsUpDown size={15} strokeWidth={2} />
        </button>
      </div>

      {menuOpen && (
        <div className="user-menu-popover">
          <button
            type="button"
            className="user-menu-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={15} strokeWidth={2} />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
