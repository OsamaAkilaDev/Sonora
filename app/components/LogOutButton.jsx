"use client";
import React from "react";
import { LogOutIcon } from "./Icons";
import { postRequest } from "../utils/fetchers";
import { useRouter } from "next/navigation";
import { backendURL } from "../utils/constants";

function LogOutButton() {
  const router = useRouter();
  return (
    <button
      className="hover:text-shade-500 text-shade-600 h-5 w-5 hover:cursor-pointer transform-[scale(-1,1)]"
      onClick={async () => {
        // await postRequest("/auth/logout");
        // router.refresh();

        let res = await fetch(backendURL + "/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        router.refresh();
      }}
    >
      <LogOutIcon />
    </button>
  );
}

export default LogOutButton;
