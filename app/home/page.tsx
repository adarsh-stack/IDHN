
"use client";

import React from "react";
import Header from "../Components/Header";
// 1. Notice the capital "C" in Components to match your folder
import ProtectedRoute from "@/app/Components/ProtectedRoute"; 
import ClinicalDashboardView from "@/app/Components/ClinicalDashboardView";

export default function HomePage() {
  return (
    // 2. Lock this route so ONLY Doctors can render it
    <ProtectedRoute allowedRoles={['Doctor']}>
      <Header />
      <ClinicalDashboardView />
      
    </ProtectedRoute>
  );
}