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

  const [activeTab, setActiveTab] = useState<string>("");
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem("idhn_session");
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
  useEffect(() => {
    const sessionStr = localStorage.getItem("idhn_session");

    if (!sessionStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(sessionStr);

      if (user.role === "Pharmacy") {
        setActiveTab("pharmacy");
      } else if (user.role === "Receptionist") {
        setActiveTab("patients");
      } else {
        setActiveTab("dashboard"); 
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

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
      <Header />

      <div className="flex flex-1">
        {activeTab && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main className="flex-1 bg-gradient-to-br from-[#fcfaf4] to-[#f5f0e1] overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm min-h-[calc(100vh-140px)]">
            {renderActivePanel()}
          </div>
        </main>
      </div>
    </div>
  );
}
