import React from "react";
import { CancelIcon, CheckmarkIcon, CrossIcon } from "../../Icons";
import ProfileIcon from "../../ProfileIcon";
import { deleteRequest, putRequest } from "@/app/utils/fetchers";
import { isSuccess } from "@/app/utils/status";
import { errorToast, iconToast, successToast } from "@/app/utils/toasts";

function RequestCard({ displayName, username, isSent, requestId, img }) {
  return (
    <div className="item flex h-13 w-full items-center gap-3.5 rounded-md p-2 transition-all duration-300">
      <div className="h-[35px] w-[35px]">
        <ProfileIcon statusIndicator={false} img={img} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-shade-600 truncate text-sm">{displayName}</p>
        <p className="text-shade-600 truncate text-xs">{username}</p>
      </div>

      <div className="ml-auto flex h-full items-center gap-1.5 p-0.5">
        {isSent ? (
          <ActionButton
            name="Cancel"
            action={() => cancelFriendRequest(requestId)}
          >
            <CancelIcon />
          </ActionButton>
        ) : (
          <>
            <ActionButton
              name="Accept"
              action={() => acceptFriendRequest(requestId)}
            >
              <CheckmarkIcon />
            </ActionButton>
            <ActionButton
              name="Deny"
              action={() => rejectFriendRequest(requestId)}
            >
              <CrossIcon />
            </ActionButton>
          </>
        )}
      </div>
    </div>
  );
}

export default RequestCard;

function ActionButton({ name, action, children }) {
  return (
    <button
      className="bg-shade-800 hover:bg-shade-700 active:bg-shade-650 text-shade-600 flex aspect-square h-full cursor-pointer items-center justify-center rounded-full p-1.5"
      onClick={action}
      aria-label={name}
    >
      {children}
    </button>
  );
}

async function cancelFriendRequest(id) {
  // console.log('cancel');
  let res = await deleteRequest("/relation/cancel-friendship-request", {
    relationId: id,
  });

  let data = await res.json();
  // console.log(data);

  if (isSuccess(data.status)) iconToast(data.content, "🗑️");
  else errorToast(data.content);
}

async function acceptFriendRequest(id) {
  // console.log('cancel');
  let res = await putRequest("/relation/accept-friendship-request", {
    relationId: id,
  });

  let data = await res.json();
  // console.log(data);

  if (isSuccess(data.status)) successToast(data.content);
  else errorToast(data.content);
}

async function rejectFriendRequest(id) {
  // console.log('cancel');

  let res = await putRequest("/relation/reject-friendship-request", {
    relationId: id,
  });

  let data = await res.json();
  // console.log(data);

  if (isSuccess(data.status)) iconToast(data.content, "🛑");
  else errorToast(data.content);
}
