"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { socketURL } from "../utils/constants";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ userData, children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userData) return;

    const sock = io(socketURL);

    sock.emit("join", String(userData.id));

    setSocket(sock);

    return () => {
      sock.disconnect();
    };
  }, [userData]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
