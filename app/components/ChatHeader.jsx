import React from "react";
import ProfileIcon from "./ProfileIcon";
import { OptionsUtilIcon, VideoCallIcon, VoiceCallIcon } from "./Icons";
import { useSideMenu } from "../hooks/useSideMenu";
import CallMenu from "./CallMenu";

function ChatHeader({ info }) {
  const { isCallMenu, toggleIsCallMenu } = useSideMenu();

  return (
    <div className="transition-all duration-300">
      <nav className="flex h-[50px] w-full items-center justify-between p-2 px-2">
        <div className="flex items-center gap-3">
          <div className="h-[30px] w-[30px]">
            <ProfileIcon clickable={false} img={info?.profilePicture} />
          </div>
          <p className="text-shade-600 text-sm font-[420]">
            {info ? info.displayName : ""}
          </p>
        </div>

        <div className="flex h-5 gap-4">
          <NavigationButton name="Video Call" onClick={toggleIsCallMenu}>
            <VideoCallIcon />
          </NavigationButton>

          {/* <NavigationButton name="Voice Call" onClick={toggleIsCallMenu}>
            <VoiceCallIcon />
          </NavigationButton> */}

          <NavigationButton name="options">
            <OptionsUtilIcon />
          </NavigationButton>
        </div>
      </nav>

      {isCallMenu && <CallMenu info={info} />}

      <div className="flex w-full items-center justify-center">
        <div className="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
      </div>
    </div>
  );

  function NavigationButton({ children, name, ...props }) {
    return (
      <button
        className="text-shade-600 hover:text-shade-500 w-5 cursor-pointer"
        aria-label={name}
        {...props}
      >
        {children}
      </button>
    );
  }
}

export default ChatHeader;
