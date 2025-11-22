"use client";
import React, { useState } from "react";
import { isSuccess } from "../utils/status";
import { postRequest } from "../utils/fetchers";
import { SendIcon } from "./Icons";
import EmojiButton from "./EmojiButton";
import { useChats } from "../hooks/useChats";
import { useUser } from "./UserContext";

function MessageComposer({ chatId, chatBoxRef }) {
  const [msgText, setMsgText] = useState("");
  const { addUnsentChatMessage, chatData, chatMessages } = useChats();
  const { userData } = useUser();

  async function onSubmit(e) {
    e.preventDefault();
    let msgTextVar = msgText;
    setMsgText("");

    if (!msgTextVar) return;

    let newMessage = {
      chatId: chatData.id,
      content: msgTextVar,
      createdAt: new Date().toISOString(),
      id: `temp-${Date.now()}`,
      sender: {
        id: userData.id,
        displayName: userData.displayName,
        username: userData.username,
        profilePicture: userData.profilePicture,
      },
      senderId: userData.id,
      updatedAt: new Date().toISOString(),
      notSent: true,
    };
    addUnsentChatMessage(newMessage);

    setTimeout(() => {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, 50);

    let res = await postRequest("/chat/message", {
      chatId: chatId,
      tempId: newMessage.id,
      messageContent: msgTextVar,
    });

    // let data = await res.json();
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <div>
      <div className="flex w-full items-center justify-center">
        <div className="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
      </div>
      <form
        className="flex max-h-[50px] h-[50px] flex-row gap-2 px-[18px] relative items-center justify-between"
        onSubmit={(e) => onSubmit(e)}
      >
        <textarea
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          name="msg-composer"
          id="msg-composer"
          placeholder="Type your message here"
          className="text-shade-500 text-4 resize-none bg-transparent outline-0 w-[93%] h-full pt-3"
          onKeyDown={(e) => handleKeydown(e)}
        ></textarea>

        <div className="flex h-full flex-row items-center gap-3">
          <EmojiButton setMsgText={setMsgText} />
          <button
            type="submit"
            className="text-shade-600 hover:text-shade-500 h-5 w-5 cursor-pointer"
            aria-label="send message"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageComposer;
