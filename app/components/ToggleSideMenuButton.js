"use client";
import React from "react";
import { FriendsSocialIcon } from "./Icons";
import { useSideMenu } from "../hooks/useSideMenu";

function ToggleSideMenuButton() {
  const { isSideMenuActive, toggleSideMenu } = useSideMenu();

  return (
    <button
      className={`${
        isSideMenuActive ? "text-shade-500" : "text-shade-600"
      } hover:text-shade-500 h-5 w-5 hover:cursor-pointer`}
      onClick={toggleSideMenu}
    >
      <FriendsSocialIcon />
    </button>
  );
}

export default ToggleSideMenuButton;
