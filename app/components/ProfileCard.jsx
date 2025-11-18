"use client";
import React from "react";
import { useUser } from "./UserContext";
import { OptionsUtilIcon, VerifiedIcon } from "./Icons";
import { useProfile } from "../hooks/useProfile";
import { dateOf } from "../utils/time";

function ProfileCard() {
  const { userData } = useUser();
  const { isProfileActive } = useProfile();

  if (isProfileActive) {
    return (
      <div
        aria-label="Profile Card"
        className="bg-shade-700 fixed top-1/2 left-1/2 z-51 flex w-124 -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-xl p-2 shadow-xl drop-shadow-lg"
      >
        <Banner
          bannerImage={userData.bannerPicture}
          profileImage={userData.profilePicture}
        />
        <DateJoined date={userData.createdAt} />

        <div className="mb-2.5 flex flex-col gap-2.5">
          <Username
            displayName={userData.displayName}
            username={userData.username}
          />
          <Bio content={userData.about} />
        </div>
      </div>
    );
  }

  function Banner({ bannerImage, profileImage }) {
    return (
      <div className="relative mb-2 h-40 w-full rounded-md bg-teal-700">
        <div className="absolute flex w-full justify-end gap-1.5 p-1.5">
          <button className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#00000080] p-[5px] text-white">
            <OptionsUtilIcon />
          </button>
        </div>

        <img
          className="h-full w-full rounded-[inherit] object-cover object-bottom"
          src={bannerImage || "/banner.jpeg"}
          alt="User banner"
        />
        <div className="bg-shade-800 absolute -bottom-[50px] left-4 z-55 h-25 w-25 rounded-full">
          <img
            className="h-full w-full rounded-full"
            src={profileImage || "/default_pfp.png"}
            alt="Profile picture"
          />
        </div>
      </div>
    );
  }

  function DateJoined({ date }) {
    return (
      <div className="mb-6 flex justify-end">
        <p className="bg-shade-640 rounded-md px-2 py-1 text-[13px] font-thin text-white">
          Joined on {dateOf(date)}
        </p>
      </div>
    );
  }

  function Username({ displayName, username }) {
    return (
      <div className=" flex flex-col px-4">
        <div className="flex h-[33px] items-center gap-2">
          <p className="selectable text-[22px] font-[450] text-white">
            {displayName}
          </p>
          {/* <div className="h-[22px] text-yellow-500">
            <VerifiedIcon />
          </div> */}
        </div>
        <p className="selectable text-[17px] font-[250] text-white">
          @{username}
        </p>
      </div>
    );
  }

  function Bio({ content }) {
    return (
      <div className=" mx-3">
        <p className="mx-1 mb-1 text-sm text-white">About Me</p>
        <div className="bg-shade-640 h-0.5 rounded-md"></div>
        <p className="mx-1 mt-1.5 text-sm font-light text-white">{content}</p>
      </div>
    );
  }
}

export default ProfileCard;
