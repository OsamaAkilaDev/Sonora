import React from "react";
import ProfileIcon from "./ProfileIcon";

function FriendContact({ user, chat, ...props }) {
  return (
    <button
      className="hover:bg-shade-700 flex w-full cursor-pointer items-center gap-3.5 rounded-md p-2 transition-all duration-300"
      {...props}
    >
      <div className="h-[35px] w-[35px]">
        <ProfileIcon img={user.profilePicture} clickable={false} />
      </div>
      <div className="flex flex-col items-start">
        <p className="text-shade-600 text-sm">{user.displayName}</p>
      </div>
    </button>
  );
}

export default FriendContact;
