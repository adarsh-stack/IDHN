"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import NotificationBell from "./Notify";
import UserMenu from "./UserMenu";
import { useRef } from "react"; // Ensure useRef is added
import DoctorsPopup from "./DoctorsPopUp";
import { fetchDoctorsGroupedByExpertise, GroupedDoctors } from "@/app/actions";

interface UserSession {
  name: string;
  initials: string;
  role: string;
}

const Header = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDocOpen, setIsDocOpen] = useState<boolean>(false);
  const [groupedDocs, setGroupedDocs] = useState<GroupedDoctors[]>([]);
  const docDropdownRef = useRef<HTMLDivElement>(null);

  // Trigger fetch sequence when dropdown opens
  useEffect(() => {
    if (isDocOpen) {
      fetchDoctorsGroupedByExpertise().then((res) => {
        if (res.success) setGroupedDocs(res.data);
      });
    }
  }, [isDocOpen]);

  // Close panel automatically if clicking anywhere outside the item
  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (
        docDropdownRef.current &&
        !docDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDocOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);
  useEffect(() => {
    // Read the session details written by your handleLogin Server Action
    const storedSession = localStorage.getItem("idhn_session");
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    }
    setMounted(true);
  }, []);

  // Handle system logout and purge session state
  const handleLogout = () => {
    localStorage.removeItem("idhn_session");
    setSession(null);
    window.location.href = "/";
  };

  // Prevent UI layout flickering during server-side hydration
  if (!mounted) {
    return (
      <div className="flex justify-between items-center px-8 py-3 bg-[#1a1a1a] border-b border-[#333] text-white min-h-[70px]">
        <div className="flex items-center gap-3">
          <h1 className="p-2 bg-teal-600 text-white font-extrabold rounded-md tracking-wider">
            IDHN
          </h1>
          <div>
            <h1 className="font-bold text-sm leading-tight">HealthCare OS</h1>
            <p className="text-[10px] text-gray-400">v0.1</p>
          </div>
        </div>
      </div>
    );
  }

  // Inside components/Header.tsx

  return (
    <div className="flex justify-between items-center px-8 py-3 bg-[#1a1a1a] border-b border-[#333] text-white min-h-[70px]">
      {/* Left Branding Group */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-500 text-white font-extrabold rounded-md tracking-wider">
          {/* PATCH: Always route logo clicks back to root '/' */}
          <Link href="/">IDHN</Link>
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">HealthCare OS</h1>
          <p className="text-[10px] text-teal-400 font-mono">v0.1</p>
        </div>
      </div>

      {/* Mid Part */}
      <div>
        <h1 className="text-gray-200 font-semibold tracking-wide hidden md:block">
          Clinical Management OS
        </h1>
      </div>

      {/* Right Action Utilities */}
      <div>
        {session ? (
          <div className="flex items-center gap-6">
            {/* PATCH: Clean up navigation list to keep users on root or module levels */}
            <nav className="hidden lg:block">
              <ul className="flex gap-4 text-xs font-medium text-gray-400">
                {/* <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li> */}

                {/* PATCH: Absolute container housing the dropdown state action */}
                <li ref={docDropdownRef} className="relative">
                  <button
                    onClick={() => setIsDocOpen(!isDocOpen)}
                    className={`hover:text-white transition-colors font-medium cursor-pointer focus:outline-none ${
                      isDocOpen ? "text-teal-400" : ""
                    }`}
                  >
                    Doctors {isDocOpen ? "▲" : "▼"}
                  </button>

                  {/* Renders the aggregated overlay panel */}
                  {isDocOpen && (
                    <DoctorsPopup
                      data={groupedDocs}
                      onClose={() => setIsDocOpen(false)}
                    />
                  )}
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="font-medium">ABDM Compliant 🗸</h1>
            </div>

            <div style={styles.actions}>
              <NotificationBell />
              <UserMenu user={session} onLogout={handleLogout} />
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <Link
              href="/login"
              className="text-xs font-bold text-teal-400 border border-teal-500/40 px-3 py-1.5 rounded-lg hover:bg-teal-500/10 transition-colors"
            >
              System Portal Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

const styles: { [key: string]: React.CSSProperties } = {
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
};
