"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HangUpIcon, MutedIcon, UndeafenedIcon, UnmutedIcon } from "./Icons";
import { useSideMenu } from "../hooks/useSideMenu";

let AgoraRTC; // We'll import it dynamically

const APP_ID = "4966640f8f824322a9688fd62de19ddb";
const TOKEN =
  "007eJxTYJC4zfWCOTk39uaJuI1ezzxVNn2Rmmi5oHm57cPfWefCZ85VYDCxNDMzMzFIs0izMDIxNjJKtDSzsEhLMTNKSTW0TElJ2vlBNrMhkJFh0YFkJkYGCATxWRnyixNzExkYAKKZIQQ=";
const CHANNEL = "osama";

export default function CallMenu() {
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [muted, setMuted] = useState(false);

  const { toggleIsCallMenu } = useSideMenu();

  useEffect(() => {
    let isMounted = true;

    const initAgora = async () => {
      // Dynamic import only on client
      const AgoraModule = await import("agora-rtc-sdk-ng");
      AgoraRTC = AgoraModule.default;

      const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(rtcClient);

      try {
        const uid = await rtcClient.join(APP_ID, CHANNEL, TOKEN, null);
        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        if (!isMounted) return;

        setLocalTracks([audioTrack, videoTrack]);
        setUsers([{ uid, audioTrack, videoTrack }]);

        await rtcClient.publish([audioTrack, videoTrack]);

        rtcClient.on("user-published", async (user, mediaType) => {
          await rtcClient.subscribe(user, mediaType);

          if (mediaType === "video") {
            setUsers((prev) => [
              ...prev,
              { uid: user.uid, videoTrack: user.videoTrack },
            ]);
          }
          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        rtcClient.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });
      } catch (err) {
        console.error("Agora error:", err);
      }
    };

    initAgora();

    return () => {
      isMounted = false;
      localTracks.forEach((t) => {
        t.stop();
        t.close();
      });
      client?.leave();
    };
  }, []);

  const toggleMute = () => {
    if (!localTracks.length) return;
    const [audioTrack] = localTracks;
    audioTrack.setEnabled(muted);
    setMuted(!muted);
  };

  const leaveCall = () => {
    localTracks.forEach((t) => {
      t.stop();
      t.close();
    });
    client?.leave();
    setUsers([]);
    toggleIsCallMenu();
  };

  return (
    <div className="pb-4">
      {/* Video Grid */}
      <div className="w-full flex items-center justify-center gap-5 flex-wrap">
        {users.map((user) => (
          <div
            key={user.uid}
            className="h-50 w-50 bg-black rounded-md overflow-hidden"
          >
            {user.videoTrack && (
              <div
                ref={(el) => user.videoTrack.play(el)}
                className="w-full h-full"
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="w-full flex justify-center mt-5 gap-1.5">
        <button
          className="w-[38px] aspect-square bubble p-[7px] text-shade-600 cursor-pointer"
          onClick={toggleMute}
        >
          {muted ? <MutedIcon /> : <UnmutedIcon />}
        </button>
        <button
          className="w-[38px] aspect-square bg-red-700 rounded-lg p-[8.5px] text-white cursor-pointer"
          onClick={leaveCall}
        >
          <HangUpIcon />
        </button>
      </div>
    </div>
  );
}
