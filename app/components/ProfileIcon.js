import Image from "next/image";
import React from "react";

function ProfileIcon({
  statusIndicator = true,
  img,
  size,
  clickable = true,
  onClick,
}) {
  return clickable ? (
    <button
      onClick={onClick}
      className="relative flex h-full w-full cursor-pointer items-center"
    >
      <ImageWrapper />
    </button>
  ) : (
    <div className="relative flex h-full w-full items-center">
      <ImageWrapper />
    </div>
  );

  function ImageWrapper() {
    return (
      <>
        <Image
          width={size || 35}
          height={size || 35}
          src={img || "/default_pfp.png"}
          alt="Profile Icon"
          className="h-full w-full rounded-full"
        />
        {statusIndicator && (
          <div className="border-shade-800 absolute -right-[3px] -bottom-[3px] h-[40%] w-[40%] rounded-2xl border-[3px] border-solid bg-green-500"></div>
        )}
      </>
    );
  }
}

export default ProfileIcon;
