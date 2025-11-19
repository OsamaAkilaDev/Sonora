"use client";
import React from "react";
import { useSideMenu } from "../hooks/useSideMenu";

function MainContainer({ children }) {
  return (
    <main className="bubble grid grid-cols-1 grid-rows-[auto_1fr_50px] h-full grow">
      {children}
    </main>
  );
}

export default MainContainer;

// {`bubble  ${
//         isSideMenuActive ? "col-span-1" : "col-span-2"
//       } `}
