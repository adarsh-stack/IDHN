"use client";

import React from "react";
import Header from "../Components/Header";
import ClinicalDashboardView from "@/app/Components/ClinicalDashboardView";

export default function HomePage() {
  return (
    <>
      <Header />
      <ClinicalDashboardView />
    </>
  );
}