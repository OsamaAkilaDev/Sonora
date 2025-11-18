"use client";
import EmojiPicker, { SkinTones } from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";

function EmojiMenu({ setMsgText, setShowPicker, triggerRef }) {
  const [skinTone, setSkinTone] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickerReady, setPickerReady] = useState(false);
  let pickerRef = useRef(null);

  useEffect(() => {
    const savedSkinTone = localStorage.getItem("emojiSkinTone");
    setSkinTone(savedSkinTone || SkinTones.NEUTRAL);
    setIsLoaded(true);

    // Small delay to let picker initialize
    const timer = setTimeout(() => setPickerReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowPicker]);

  const handleSkinToneChange = (newSkinTone) => {
    setSkinTone(newSkinTone);
    localStorage.setItem("emojiSkinTone", newSkinTone);
  };

  // Don't render until we've loaded the saved preference
  if (!isLoaded) {
    return null;
  }

  return (
    <div
      style={{
        opacity: pickerReady ? 1 : 0,
        transition: "opacity 0.1s ease-in",
      }}
      ref={pickerRef}
    >
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          setMsgText((prev) => prev + emojiData.emoji);
          setShowPicker(false);
        }}
        emojiStyle="native"
        lazyLoadEmojis={true}
        theme="dark"
        skinTonePickerLocation="PREVIEW"
        onSkinToneChange={handleSkinToneChange}
        defaultSkinTone={skinTone}
        style={{
          border: "2px solid #2c2c2c",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          backgroundColor: "#141414",
        }}
      />
    </div>
  );
}

export default EmojiMenu;
