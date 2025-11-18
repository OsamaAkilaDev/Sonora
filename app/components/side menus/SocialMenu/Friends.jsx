"use client";
import React, { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/app/utils/fetchers";
import LoadingSpinner from "../../Icons";
import { useRouter } from "next/navigation";
import { isSuccess } from "@/app/utils/status";
import { useSocket } from "../../SocketProvider";
import FriendContact from "../../FriendContact";

function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const socket = useSocket();

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdateSocialData = (message) => {
      setFriends(message.friends || []);
    };

    socket.on("update-social-data", handleUpdateSocialData);

    return () => {
      socket.off("update-social-data", handleUpdateSocialData);
    };
  }, [socket]);

  if (friends.length === 0 && loading) return <LoadingWrapper />;
  else if (friends.length >= 1)
    return (
      <div className="flex h-full flex-col gap-2">
        {friends.map((friend) => (
          <FriendContact
            user={friend}
            key={friend.id}
            onClick={() => navigateToChat(friend.id)}
          />
        ))}
      </div>
    );
  else return <NoFriendsNotation />;

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

  function NoFriendsNotation() {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-full w-full flex-col items-center justify-center">
          <p className="text-shade-600 text-center text-lg font-semibold">
            No friends yet?
          </p>
          <p className="text-shade-600 text-center">Let’s change that!</p>
        </div>
      </div>
    );
  }

  async function fetchFriends() {
    setLoading(true);
    try {
      const res = await getRequest("/relation/friends");
      const data = await res.json();

      setFriends(Array.isArray(data.content) ? data.content : []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }

  async function navigateToChat(friendId) {
    try {
      const res = await postRequest("/chat/", { targetUser: { id: friendId } });
      const data = await res.json();

      if (isSuccess(data.status)) {
        router.push(`/app/chat/${data.content.id}`);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  }
}

export default Friends;
