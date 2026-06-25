"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
// Define the interface to type the live incoming data from your Header component
interface UserSession {
  name: string;
  initials: string;
  role: string;
}

interface UserMenuProps {
  user: UserSession;
  onLogout: () => void;
}

export default function UserMenu({
  user,
  onLogout,
}: UserMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown cleanly if a user clicks outside the menu boundaries
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={styles.container} ref={menuRef}>
      {/* User Info Trigger Button utilizing real values from your database */}
      <button onClick={() => setIsOpen(!isOpen)} style={styles.triggerButton}>
        <div style={styles.avatar}>{user.initials}</div>
        <div style={styles.textContainer}>
          <span style={styles.username}>{user.name}</span>
          <span style={styles.userRole}>{user.role}</span>
        </div>
        <span style={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div style={styles.dropdown}>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Profile Settings
          </Link>
          
          <hr style={styles.divider} />
          {/* Triggers the header's synchronized localStorage purge cycle */}
          <button
            style={{ ...styles.menuItem, ...styles.signOut }}
            onClick={() => {
              setIsOpen(false);
              onLogout(); // This runs handleLogout from Header, clearing storage and executing window.location.href = '/login'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  triggerButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fcfaf2",
    border: "1px solid #eadecc",
    borderRadius: "12px",
    padding: "6px 14px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#d8f3f5",
    color: "#006677",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.85rem",
  },
  textContainer: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  username: {
    color: "#0e1e38",
    fontWeight: 600,
    fontSize: "0.9rem",
    lineHeight: "1.2",
  },
  userRole: {
    color: "#6b7280",
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  arrow: {
    fontSize: "0.65rem",
    color: "#556677",
    marginLeft: "4px",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "54px",
    backgroundColor: "#ffffff",
    border: "1px solid #ebdcc5",
    borderRadius: "16px",
    width: "220px",
    boxShadow: "0 8px 24px rgba(140, 120, 100, 0.15)",
    zIndex: 1001,
    padding: "6px 0",
    overflow: "hidden",
  },
  menuItem: {
    width: "100%",
    textAlign: "left",
    background: "none",
    border: "none",
    padding: "12px 18px",
    fontSize: "0.85rem",
    color: "#2d3748",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  divider: {
    border: "none",
    borderBottom: "1px solid #edf2f7",
    margin: "4px 0",
  },
  signOut: {
    color: "#e53e3e",
    fontWeight: 600,
  },
};
