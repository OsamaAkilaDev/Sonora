import { io } from "socket.io-client";
import { socketURL } from "./constants";
import { useFriends } from "../hooks/useFriends";

export function initSocket(userData) {
  const socket = io(socketURL);
  socket.emit("join", String(userData.id));

  socket.on("update-social-data", (message) => {
    // console.log(message);
    // updateData(message);

    useFriends.getState().setFriends(message.friends);
    useFriends.getState().setRequestedRequests(message.sentRequests);
    useFriends.getState().setReceievedRequests(message.receivedRequests);
  });

  socket.on("update-chat-list", (message) => {
    // console.log(message);
    // chatContacts.set(message.chatList);
  });

  socket.on("new-message", (message) => {
    // if (message.chatId === get(selectedChat)) {
    //   activeChatData.update((chat) => ({
    //     ...chat,
    //     messages: [...chat.messages, message.message], // append safely
    //   }));
    // }
  });
}
