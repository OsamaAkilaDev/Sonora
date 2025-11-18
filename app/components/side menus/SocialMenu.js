"use client";
import { useSideMenu } from "@/app/hooks/useSideMenu";
import React, { useState } from "react";
import { AddUserIcon, FriendsSocialIcon } from "../Icons";
import Friends from "./SocialMenu/Friends";
import Pending from "./SocialMenu/Pending";
import TabBar from "./TabBar";

function SocialMenu() {
  let categories = [
    { name: "Friends", icon: FriendsSocialIcon, element: Friends },
    { name: "Connect", icon: AddUserIcon, element: Pending },
  ];

  const [selectedCategory, setSelectedCategory] = useState(0);
  let DisplayedCategory = categories[selectedCategory].element;

  const { isSideMenuActive } = useSideMenu();

  if (isSideMenuActive)
    return (
      <aside className="bubble min-w-[270px] p-2">
        <TabBar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <div className=" flex h-[calc(100%-53.5px)] max-h-[calc(100%-53.5px)] flex-col gap-2 overflow-y-auto">
          <DisplayedCategory />
        </div>
      </aside>
    );
}

export default SocialMenu;
