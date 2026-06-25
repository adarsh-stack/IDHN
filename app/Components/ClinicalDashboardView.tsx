"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import DashboardPanel from "./sidebar/DashboardPanel";
import PatientsPanel from "./sidebar/PatientPanel";
import PharmacyPanel from "./sidebar/PharmacyPanel";
import BillingPanel from "./sidebar/BillingPanel";

export default function ClinicalDashboardView() {
  const router = useRouter();

  // 1. Start with an empty tab to prevent UI flicker while reading local storage
  const [activeTab, setActiveTab] = useState<string>("");
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem("idhn_session");
    };

    window.addEventListener("beforeunload", handleUnload);

    // Cleanup the listener if the component unmounts normally
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
  // 2. Hydration: Check the session and assign the default landing tab
  useEffect(() => {
    const sessionStr = localStorage.getItem("idhn_session");

    if (!sessionStr) {
      // Security fallback: if they aren't logged in, kick to login page
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(sessionStr);

      // Instantly set the landing view based strictly on role
      if (user.role === "Pharmacy") {
        setActiveTab("pharmacy");
      } else if (user.role === "Receptionist") {
        setActiveTab("patients");
      } else {
        setActiveTab("dashboard"); // Default for Doctors
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // Conditional engine mapping the active tab ID to the correct view panel
  const renderActivePanel = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPanel />;
      case "pharmacy":
        return <PharmacyPanel />;
      case "billing":
        return <BillingPanel />;
      case "patients":
        return <PatientsPanel />;
      case "":
        // Shows for a split millisecond while determining the role
        return (
          <div className="flex h-full items-center justify-center animate-pulse text-[#0f6266] font-bold mt-20">
            Loading Workspace Protocol...
          </div>
        );
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff]">
      {/* 1. Global Application System Header */}
      <Header />

      {/* 2. Main Workspace Row Wrapper */}
      <div className="flex flex-1">
        {/* Fixed Left Sidebar Module passing tracking states. Only loads once tab is known */}
        {activeTab && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* 3. Scrollable Content Window Area displaying the chosen layout panel */}
        <main className="flex-1 bg-gradient-to-br from-[#fcfaf4] to-[#f5f0e1] overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm min-h-[calc(100vh-140px)]">
            {renderActivePanel()}
          </div>
        </main>
      </div>
    </div>
  );
}
