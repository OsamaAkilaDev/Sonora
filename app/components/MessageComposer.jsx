"use client";
import React, { useState } from "react";
import { isSuccess } from "../utils/status";
import { postRequest } from "../utils/fetchers";
import { SendIcon } from "./Icons";
import EmojiButton from "./EmojiButton";

function MessageComposer({ chatId, chatBoxRef }) {
  const [msgText, setMsgText] = useState("");
  async function onSubmit(e) {
    e.preventDefault();

    if (!msgText) return;

    let res = await postRequest("/chat/message", {
      chatId: chatId,
      messageContent: msgText,
    });

    let data = await res.json();

    if (isSuccess(data.status)) {
      setMsgText("");
      chatBoxRef.current.scrollTop = 0;
    }
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <>
      <div className="flex w-full items-center justify-center">
        <div className="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
      </div>
      <form
        className="flex h-[50px] max-h-20 flex-row gap-2 px-[18px] relative"
        onSubmit={(e) => onSubmit(e)}
      >
        <textarea
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          name="msg-composer"
          id="msg-composer"
          placeholder="Type your message here"
          className="text-shade-500 text-4 grow resize-none bg-transparent py-[13px] outline-0"
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
    </>
  );
}

export default MessageComposer;
