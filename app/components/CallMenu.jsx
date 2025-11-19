"use client";
import React from "react";
import {
  HangUpIcon,
  ShareScreenIcon,
  UndeafenedIcon,
  UnmutedIcon,
  VideoCallIcon,
} from "./Icons";

function CallMenu() {
  return (
    <div className="pb-4">
      <div className="w-full flex items-center justify-center gap-5">
        <div className="h-20 w-20 bg-amber-200 rounded-full"></div>
        <div className="h-20 w-20 bg-amber-200 rounded-full"></div>
      </div>
      <div className="w-full flex justify-center mt-5 gap-1.5">
        <button className="w-[38px] aspect-square bubble p-[7px] text-shade-600 cursor-pointer">
          <ShareScreenIcon />
        </button>
        <button className="w-[38px] aspect-square bubble p-[7px] text-shade-600 cursor-pointer">
          <VideoCallIcon />
        </button>
        <button className="w-[38px] aspect-square bubble p-[7px] text-shade-600 cursor-pointer">
          <UndeafenedIcon />
        </button>
        <button className="w-[38px] aspect-square bubble p-[7px] text-shade-600 cursor-pointer">
          <UnmutedIcon />
        </button>
        <button className="w-[38px] aspect-square bg-rednor-700 rounded-lg p-[8.5px] text-white cursor-pointer">
          <HangUpIcon />
        </button>
      </div>
    </div>
  );
}

export default CallMenu;
