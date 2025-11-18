"use client";
import React, { useEffect, useState } from "react";
import Contact from "../Contact";
import { getRequest } from "@/app/utils/fetchers";
import LoadingSpinner from "../../Icons";
import { useSocket } from "../../SocketProvider";

function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeChatId, setActiveChatId] = useState();

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdateChatData = (message) => {
      setChats(message.chatList || []);
    };

    socket.on("update-chat-list", handleUpdateChatData);

    return () => {
      socket.off("update-chat-list", handleUpdateChatData);
    };
  }, [socket]);

  useEffect(() => {
    fetchChats();
  }, []);

  if (chats.length === 0 && loading) return <LoadingWrapper />;
  else if (chats.length >= 1)
    return chats.map((chat, index) => (
      <Contact
        user={chat.participants[0].user}
        key={index}
        chat={chat}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
      />
    ));
  else return <NoChatsNotation />;

  function LoadingWrapper() {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-shade-600 w-8 h-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  function NoChatsNotation() {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-full w-full flex-col items-center justify-center">
          <p className="text-shade-600 text-center text-lg font-semibold">
            It's so quiet here…
          </p>
          <p className="text-shade-600 text-center">
            Break the silence and chat!
          </p>
        </div>
      </div>
    );
  }

  async function fetchChats() {
    try {
      const res = await getRequest("/chat/list");
      const data = await res.json();

      setChats(Array.isArray(data.content) ? data.content : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChats([]);
    }
  }
}

export default Chats;
