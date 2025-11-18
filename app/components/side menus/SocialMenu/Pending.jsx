"use client";
import React, { Children, useEffect, useState } from "react";
import { AddUtilIcon, ListExpandedIcon, UsernameIcon } from "../../Icons";
import { getRequest, postRequest } from "@/app/utils/fetchers";
import { errorToast, successToast } from "@/app/utils/toasts";
import { isSuccess } from "@/app/utils/status";
import RequestCard from "./RequestCard";
import { useSocket } from "../../SocketProvider";

function Pending() {
  const [requestedRequests, setRequestedRequests] = useState([]);
  const [receievedRequests, setReceievedRequests] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdateSocialData = (message) => {
      setRequestedRequests(message.sentRequests || []);
      setReceievedRequests(message.receivedRequests || []);
    };

    socket.on("update-social-data", handleUpdateSocialData);

    return () => {
      socket.off("update-social-data", handleUpdateSocialData);
    };
  }, [socket]);

  return (
    <>
      <form onSubmit={onSubmit} className="flex h-8 gap-2">
        <div className="bg-shade-700 text-shade-600 flex h-full w-full items-center gap-2 rounded-sm p-2">
          <div className="h-full">
            <UsernameIcon />
          </div>
          <input
            id="username"
            name="username"
            placeholder="Enter username to add"
            className="h-full w-full text-sm outline-none"
          />
        </div>
        <button className="cyan-btn aspect-square h-full rounded-sm p-1.5">
          <AddUtilIcon />
        </button>
      </form>

      <RequestsList />
    </>
  );

  function RequestsList() {
    return (
      <div className="mt-2.5 flex h-[calc(100%-95.5px)] max-h-[calc(100%-95.5px)] flex-col gap-2 overflow-y-auto">
        <div className="mt-0.5 flex flex-col gap-3">
          <ExpandableList name="Received" count={receievedRequests.length}>
            {receievedRequests.map((request) => (
              <RequestCard
                key={request.id}
                displayName={request.requester.displayName}
                username={request.requester.username}
                requestId={request.id}
                img={request.requester.profilePicture}
                isSent={false}
              />
            ))}
          </ExpandableList>

          <ExpandableList name="Sent" count={requestedRequests.length}>
            {requestedRequests.map((request) => (
              <RequestCard
                key={request.id}
                displayName={request.receiver.displayName}
                username={request.receiver.username}
                requestId={request.id}
                isSent={true}
                img={request.receiver.profilePicture}
              />
            ))}
          </ExpandableList>
        </div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    let formData = new FormData(e.target);

    let username = formData.get("username");

    if (!username) return;

    let res = await postRequest("/relation/send-friendship-request", {
      username: username,
    });

    let data = await res.json();

    // console.log(data);

    if (isSuccess(data.status)) successToast("Friend Request Sent!");
    else errorToast(data.content);
  }

  async function fetchRequests() {
    try {
      const res = await getRequest("/relation/friend-requests");
      const data = await res.json();
      setRequestedRequests(
        Array.isArray(data.content.requestedFriendships)
          ? data.content.requestedFriendships
          : []
      );

      setReceievedRequests(
        Array.isArray(data.content.receivedFriendships)
          ? data.content.receivedFriendships
          : []
      );
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setRequestedRequests([]);
      setReceievedRequests([]);
    }
  }
}

export default Pending;

function ExpandableList({ name, count, children }) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-shade-600 flex h-5 items-center gap-2">
        <p className="ml-1.5 text-sm">
          {name} ({count})
        </p>
        <button
          className={`h-full cursor-pointer transition-[rotate] ${
            isExpanded ? "" : "rotate-90"
          }`}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <ListExpandedIcon />
        </button>
      </div>

      {Children.count(children) > 0 && isExpanded ? (
        <div className="flex flex-col gap-2">{children}</div>
      ) : null}
    </div>
  );
}
