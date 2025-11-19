"use client";
import MessageComposer from "@/app/components/MessageComposer";
import { backendURL } from "@/app/utils/constants";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { dateOf, timeOf } from "@/app/utils/time";
import { useSocket } from "@/app/components/SocketProvider";
import { useUser } from "@/app/components/UserContext";
import { countEmojis, isOnlyEmojis } from "@/app/utils/stringFunctions";
import ChatHeader from "@/app/components/ChatHeader";

function page() {
  const params = usePathname().split("/");
  const chatId = params[params.length - 1];

  const [activeChat, setActiveChat] = useState({});
  const [loading, setLoading] = useState(true);

  const chatBoxRef = useRef(null);

  const socket = useSocket();
  const userData = useUser();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.chatId === chatId) {
        setActiveChat((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), message.message],
        }));
      }
    };

    socket.on("new-message", handleNewMessage);
    return () => socket.off("new-message", handleNewMessage);
  }, [socket, chatId]);

  useEffect(() => {
    fetchChatData(chatId);
  }, [chatId]);

  return (
    <>
      <ChatHeader info={activeChat?.participants?.[0]?.user} />

      <div className="pr-2 pl-1.5 overflow-y-auto">
        <div
          className="flex h-full max-h-full flex-col px-3 overflow-x-hidden overflow-y-auto chat-srollbar"
          ref={chatBoxRef}
        >
          {loading ? null : activeChat?.messages?.length >= 1 ? (
            <div className="flex flex-col-reverse gap-4">
              <div></div>

              {[...activeChat.messages].reverse().map((message) => (
                <ChatMessage
                  key={message.id}
                  img={message.sender.profilePicture}
                  isoString={message.createdAt}
                  username={message.sender.displayName}
                  msg={message.content}
                />
              ))}
              <div></div>
            </div>
          ) : (
            <>
              <div className="flex h-screen flex-col items-center justify-center">
                <div className="flex w-full flex-col items-center justify-center gap-0">
                  <p className="text-shade-600 text-center text-2xl font-medium max-md:text-[18px]">
                    No messages yet
                  </p>
                  <p className="text-shade-600 max-w-[30%] text-center text-xl max-md:text-[18px]">
                    Be the first to say hi!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <MessageComposer chatBoxRef={chatBoxRef} chatId={activeChat?.id} />
    </>
  );

  async function fetchChatData(chatId) {
    setLoading(true);
    try {
      let res = await fetch(backendURL + `/chat/${chatId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      let data = await res.json();
      setActiveChat(data.content);
    } catch (err) {
      console.error("Failed to fetch chat data:", err);
    } finally {
      setLoading(false);
    }
  }
}

export default page;

function ChatMessage({ img, isoString, username, msg }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div className={`flex gap-4 text-white`}>
      {!imgLoaded && (
        <div className="h-[37px] w-[37px] rounded-full bg-shade-700 animate-pulse"></div>
      )}
      <img
        className={`h-[37px] w-[37px] rounded-full ${
          imgLoaded ? "" : "hidden"
        }`}
        src={img ? img : "/default_pfp.png"}
        alt={username}
        onLoad={() => setImgLoaded(true)}
      />
      <div className="flex flex-col items-start gap-[1.5px]">
        <div className={`flex items-baseline gap-3`}>
          <p className="selectable text-[15px]">{username}</p>
          <p className="text-shade-600 selectable text-[11px]">
            {dateOf(isoString)} {timeOf(isoString)}
          </p>
        </div>
        <p
          className={`selectable font-light whitespace-pre-line ${
            isOnlyEmojis(msg) && countEmojis(msg) < 9 ? "text-4xl" : "text-md"
          }`}
        >
          {msg}
        </p>
      </div>
    </div>
  );
}
