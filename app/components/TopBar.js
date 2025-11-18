"use client";
import {
  FriendsSocialIcon,
  NotificationsIcon,
  OptionsNavIcon,
  ConnectionStatusIcon,
  UndeafenedIcon,
  UnmutedIcon,
  LogoIcon,
} from "./Icons";
import React from "react";
import ProfileIcon from "./ProfileIcon";
import ToggleSideMenuButton from "./ToggleSideMenuButton";
import LogOutButton from "./LogOutButton";
import UserTagInfo from "./UserTagInfo";
import { useUser } from "./UserContext";

function TopBar() {
  const { userData } = useUser();

  return (
    <nav className="bubble navigation-bar">
      <div className="navigation-left-menu">
        <div className="h-[35px] w-[35px]">
          <ProfileIcon clickable={false} img={userData.profilePicture} />
        </div>

        <UserTagInfo />
      </div>

      <div className="navigation-middle-menu"></div>

      <div className="navigation-right-menu">
        <LogOutButton />
        {/* <OptionsButton /> */}
        <ToggleSideMenuButton />

        <div className=" flex h-full items-center">
          <div className="bg-shade-700 h-[85%] w-[1.5px] rounded-2xl"></div>
        </div>
        <a
          className="text-shade-600 hover:text-shade-500 h-fit w-5"
          href="/"
          aria-label="Sonora Logo (Go back to the main site)"
        >
          <LogoIcon />
        </a>
      </div>
    </nav>
  );
}

function OptionsButton() {
  return (
    <button
      className="text-shade-600 hover:text-shade-500 h-5 w-5"
      aria-label="Options"
    >
      <OptionsNavIcon />
    </button>
  );
}

export default TopBar;
