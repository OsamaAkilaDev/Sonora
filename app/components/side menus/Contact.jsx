import React from "react";
import ProfileIcon from "../ProfileIcon";
import { usePathname, useRouter } from "next/navigation";

function Contact({ user, chat }) {
  const router = useRouter();

  const params = usePathname().split("/");
  const chatId = params[params.length - 1];

  function navigateToChat() {
    router.push(`/app/chat/${chat.id}`);
  }

  return (
    <button
      className={`hover:bg-shade-700 ${
        chatId === chat?.id ? "bg-shade-750" : ""
      }  flex w-full cursor-pointer items-center gap-3.5 rounded-md p-2 transition-all duration-300`}
      onClick={navigateToChat}
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

export default Contact;
