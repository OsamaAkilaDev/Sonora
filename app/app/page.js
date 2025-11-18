"use client";
import React from "react";
import { ChatIcon } from "../components/Icons";

function page() {
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden w-full h-full">
      <div className="text-shade-640 drop-shadow-3xl relative max-w-[210px] max-md:max-w-[150px]">
        <ChatIcon />
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-1">
        <p className="text-shade-600 text-center text-[26px] font-medium max-md:text-[18px]">
          Your chat awaits
        </p>
        <p className="text-shade-600 max-w-[30%] text-center text-xl max-md:text-[18px]">
          Select a friend to begin the conversation
        </p>
      </div>
    </div>
  );
}

export default page;
