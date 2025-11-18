"use client";
import React, { useState } from "react";
import { ArchiveIcon, DirectMessagesIcon } from "../Icons";
import Chats from "./DirectMessages/Chats";
import Archive from "./DirectMessages/Archive";
import TabBar from "./TabBar";

function DirectMessagesMenu() {
  let categories = [
    { name: "Chats", icon: DirectMessagesIcon, element: Chats },
    { name: "Archive", icon: ArchiveIcon, element: Archive },
  ];

  const [selectedCategory, setSelectedCategory] = useState(0);
  let DisplayedCategory = categories[selectedCategory].element;

  return (
    <aside className="bubble col-start-0 max-h-full min-w-[270px] overflow-hidden p-2">
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

export default DirectMessagesMenu;
