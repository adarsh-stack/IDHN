"use client";

import React from "react";

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

export default function Sidebar({
  activeTab,
  setActiveTab,
}: SidebarProps): React.JSX.Element {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "opd", label: "OPD / Doctors", icon: "🩺" },
    { id: "ipd", label: "IPD / Wards", icon: "🛏️" },
    { id: "laboratory", label: "Laboratory", icon: "🔬" },
    { id: "pharmacy", label: "Pharmacy", icon: "💊" },
    { id: "billing", label: "Billing", icon: "🧾" },
    { id: "patients", label: "Patients", icon: "👥" },
  ];

  return (
    <aside className="w-55  bg-[#EDE8D0] min-h-[calc(100vh-140px)] border-r border-[#eadecc] flex flex-col justify-between p-4 box-border shrink-0">
      <div className="flex flex-col gap-1.5 mt-8">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-[#0f6266] text-white shadow-md" // Deep teal active background from your image
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

      {/* Optional bottom branding accent box matching your layout footer */}
      {/* <div className="bg-[#eaf8f9] text-[#006677] text-xs font-semibold p-3 rounded-xl text-center border border-[#d8f3f5]">
        Secure Terminal Session
      </div> */}
    </aside>
  );
}
