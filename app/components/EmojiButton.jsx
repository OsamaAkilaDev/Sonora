"use client";
import React, { useRef, useState } from "react";
import { EmojiIcon } from "./Icons";
import EmojiMenu from "./EmojiMenu";

function EmojiButton({ setMsgText }) {
  const [showPicker, setShowPicker] = useState(false);
  let triggerRef = useRef(null);
  return (
    <div className="flex items-center justify-center relative">
      <button
        ref={triggerRef}
        className="text-shade-600 hover:text-shade-500 h-5 w-5 cursor-pointer"
        aria-label="Emoji menu"
        onClick={(e) => {
          e.preventDefault();
          setShowPicker((prev) => !prev);
        }}
      >
        <EmojiIcon />
      </button>
      {showPicker && (
        <div className="absolute bottom-[calc(100%+18px)] mb-2 -right-6.5 z-50">
          <EmojiMenu
            triggerRef={triggerRef}
            setMsgText={setMsgText}
            setShowPicker={setShowPicker}
          />
        </div>
      )}
    </div>
  );
}

export default EmojiButton;
