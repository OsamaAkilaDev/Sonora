"use client";
import React from "react";
import { useSideMenu } from "../hooks/useSideMenu";

function MainContainer({ children }) {
  const { isSideMenuActive, toggleSideMenu } = useSideMenu();

  return (
    <main
      className={`bubble  ${isSideMenuActive ? "col-span-1" : "col-span-2"}`}
    >
      {children}
    </main>
  );
}

export default MainContainer;
