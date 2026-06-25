"use client";

import React, { useEffect, useState } from "react";
import { AppRole } from "../lib/rbac"; // Ensure this matches your RBAC types

// Explicit type for navigation items
interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

// 1. Direct Mapping: Tab ID -> Allowed Roles
const TAB_PERMISSIONS: Record<string, AppRole[]> = {
  dashboard: ["Doctor"],
  patients: ["Doctor", "Receptionist"],
  pharmacy: ["Pharmacy"],
  billing: ["Doctor", "Pharmacy", "Receptionist"],
};

export default function Sidebar({
  activeTab,
  setActiveTab,
}: SidebarProps): React.JSX.Element | null {
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  // Fetch the user's role on component mount
  useEffect(() => {
    const sessionStr = localStorage.getItem("idhn_session");
    if (sessionStr) {
      try {
        setUserRole(JSON.parse(sessionStr).role as AppRole);
      } catch (e) {}
    }
  }, []);

  // Prevent layout shift/jumping while the role is loading
  if (!userRole) {
    return (
      <aside className="w-55 bg-[#EDE8D0] min-h-[calc(100vh-140px)] border-r border-[#eadecc] shrink-0" />
    );
  }

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    // { id: "opd", label: "OPD / Doctors", icon: "🩺" },
    // { id: "ipd", label: "IPD / Wards", icon: "🛏️" },
    // { id: "laboratory", label: "Laboratory", icon: "🔬" },
    { id: "pharmacy", label: "Pharmacy", icon: "💊" },
    { id: "billing", label: "Billing", icon: "🧾" },
    { id: "patients", label: "Patients", icon: "👥" },
  ];

  // 2. Filter items strictly checking if the user's role exists in the tab's permission array
  const filteredNavItems = navItems.filter((item) => {
    const allowedRoles = TAB_PERMISSIONS[item.id] || [];
    return allowedRoles.includes(userRole);
  });

  return (
    <aside className="w-55 bg-[#EDE8D0] min-h-[calc(100vh-140px)] border-r border-[#eadecc] flex flex-col justify-between p-4 box-border shrink-0">
      <div className="flex flex-col gap-1.5 mt-8">
        
        {/* Render ONLY the allowed buttons */}
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-[#0f6266] text-white shadow-md" 
                  : "text-[#556677] text-xs hover:bg-[#fcfaf2] hover:text-[#0e1e38]"
              }`}
            >
              <span
                className={`text-base ${isActive ? "text-white" : "text-gray-400"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}

      </div>
    </aside>
  );
}