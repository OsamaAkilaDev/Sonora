"use client";
import React from "react";
import { useUser } from "./UserContext";
import { iconToast } from "../utils/toasts";

function UserTagInfo() {
  const { userData } = useUser();
  return (
    <div className="flex flex-col items-start">
      <p className="text-[14px] text-shade-500 px-0.5">
        {userData.displayName}
      </p>
      <button
        className="text-xs text-shade-600 hover:bg-shade-700 rounded-sm px-0.5 cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(userData.username);
          iconToast("Username copied", "📋");
        }}
      >
        @{userData.username}
      </button>
    </div>
  );
}

export default UserTagInfo;
