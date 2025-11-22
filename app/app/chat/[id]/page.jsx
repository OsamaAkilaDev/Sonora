"use client";
import MessageComposer from "@/app/components/MessageComposer";
import { backendURL } from "@/app/utils/constants";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { dateOf, timeOf } from "@/app/utils/time";
import { useSocket } from "@/app/components/SocketProvider";
import { countEmojis, isOnlyEmojis } from "@/app/utils/stringFunctions";
import ChatHeader from "@/app/components/ChatHeader";
import { useChats } from "@/app/hooks/useChats";

function page() {
  const params = usePathname().split("/");
  const chatId = params[params.length - 1];

  const {
    chatData,
    setChatData,
    chatMessages,
    setChatMessages,
    addSentChatMessages,
  } = useChats();

  const [loading, setLoading] = useState(true);

  const chatBoxRef = useRef(null);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log("NEW MESSAGE", message);
      if (message.chatId === chatId) {
        addSentChatMessages({ ...message, notSent: false });
        setTimeout(() => {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }, 50);
      }
    };

    socket.on("new-message", handleNewMessage);
    return () => socket.off("new-message", handleNewMessage);
  }, [socket, chatId]);

  useEffect(() => {
    fetchChatData(chatId);
  }, [chatId]);

  // useEffect(() => {
  //   console.log("chat messages", chatMessages);
  //   console.log("chat data", chatData);
  // }, [chatData, chatMessages]);

  // useEffect(() => {
  //   if (chatBoxRef.current) {
  //     chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  //   }
  // }, [chatMessages]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, []);

  const grouped = groupMessages([...chatMessages]);
  console.log(grouped);
  return (
    <>
      <ChatHeader info={chatData?.participants?.[0]?.user} />

      <div className="pr-2 pl-1.5 overflow-y-auto">
        <div
          className="flex h-full max-h-full flex-col px-3 overflow-x-hidden overflow-y-auto chat-srollbar"
          ref={chatBoxRef}
        >
          {loading ? null : chatMessages?.length >= 1 ? (
            <div className="flex flex-col-reverse gap-4">
              <div></div>

              {/* {[...chatMessages].reverse().map((message) => (
                <ChatMessage
                  key={message.id}
                  img={message.sender.profilePicture}
                  isoString={message.createdAt}
                  username={message.sender.displayName}
                  msg={message.content}
                  notSent={message.notSent}
                />
              ))} */}

              {grouped.reverse().map((group) => (
                <ChatMessageGroup
                  key={group.messages[0].id}
                  img={group.sender.profilePicture}
                  username={group.sender.displayName}
                  messages={group.messages}
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

      <MessageComposer chatBoxRef={chatBoxRef} chatId={chatData?.id} />
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

      const { messages, ...chatDataVar } = data.content;

      setChatMessages(messages);
      setChatData(chatDataVar);
      setTimeout(() => {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 50);
    } catch (err) {
      console.error("Failed to fetch chat data:", err);
    } finally {
      setLoading(false);
    }
  }
}

export default page;

function ChatMessage({ img, isoString, username, msg, notSent }) {
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
            {notSent
              ? "Sending..."
              : `${dateOf(isoString)} ${timeOf(isoString)}`}
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

function ChatMessageGroup({ img, username, messages }) {
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
            {dateOf(messages[0].createdAt)} {timeOf(messages[0].createdAt)}
          </p>
        </div>
        {[...messages].map((message) => (
          <p
            key={message.id}
            className={`selectable ${
              message.notSent ? "text-shade-600" : "text-white"
            } font-light whitespace-pre-line ${
              isOnlyEmojis(message.content) && countEmojis(message.content) < 9
                ? "text-4xl"
                : "text-md"
            }`}
          >
            {message.content}
          </p>
        ))}
      </div>
    </div>
  );
}

function groupMessages(messages) {
  const GROUP_WINDOW_MINUTES = 5;
  const groups = [];
  let currentGroup = null;

  messages.forEach((msg) => {
    const previous = currentGroup?.messages[currentGroup.messages.length - 1];

    const sameSender = previous?.senderId === msg.senderId;
    const closeInTime =
      previous &&
      (new Date(msg.createdAt) - new Date(previous.createdAt)) / 1000 / 60 <
        GROUP_WINDOW_MINUTES;

    if (sameSender && closeInTime) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = {
        sender: msg.sender,
        messages: [msg],
      };
      groups.push(currentGroup);
    }
  });

  return groups;
}
