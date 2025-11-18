// UserContext.js
"use client";
import { createContext, useContext } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ userData, children }) => (
  <UserContext.Provider value={{ userData }}>{children}</UserContext.Provider>
);

export const useUser = () => useContext(UserContext);
