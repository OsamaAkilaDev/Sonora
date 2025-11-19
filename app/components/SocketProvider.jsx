"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { socketURL } from "../utils/constants";

const SocketContext = createContext(null);
const CallContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function useCall() {
  return useContext(CallContext);
}

export default function SocketProvider({ userData, children }) {
  const [socket, setSocket] = useState(null);
  const [callState, setCallState] = useState({
    incoming: null, // { from, offer }
    active: null, // { peerConnection, remoteStream }
    answered: false,
    candidate: null,
  });

  useEffect(() => {
    if (!userData) return;

    const sock = io(socketURL);

    sock.emit("join", String(userData.id));

    setSocket(sock);

    // --- WebRTC signaling listeners ---
    sock.on("incoming-call", ({ from, offer }) => {
      setCallState((prev) => ({ ...prev, incoming: { from, offer } }));
    });
    sock.on("call-answered", (answer) => {
      setCallState((prev) => ({ ...prev, answered: answer }));
    });
    sock.on("ice-candidate", (candidate) => {
      setCallState((prev) => ({ ...prev, candidate }));
    });

    return () => {
      sock.disconnect();
    };
  }, [userData]);

  // --- Signaling functions ---
  const callUser = (to, offer) => {
    socket?.emit("call-user", { to, offer });
  };
  const answerCall = (to, answer) => {
    socket?.emit("answer-call", { to, answer });
  };
  const sendIceCandidate = (to, candidate) => {
    socket?.emit("ice-candidate", { to, candidate });
  };

  return (
    <SocketContext.Provider value={socket}>
      <CallContext.Provider
        value={{
          callState,
          setCallState,
          callUser,
          answerCall,
          sendIceCandidate,
        }}
      >
        {children}
      </CallContext.Provider>
    </SocketContext.Provider>
  );
}
