import { redirect } from "next/navigation";
import { isSuccess } from "../utils/status";
import { backendURL } from "./constants";
import { cookies } from "next/headers"; // App Router only
import { useUserData } from "../hooks/useUserData";

export async function authenticateUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let res = await fetch(backendURL + "/auth/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  let data = await res.json();

  if (!isSuccess(data.status)) {
    return redirect("/login");
  }

  // useUserData.getState().setUserData(data.content.user);

  return data.content.user;
}

export async function isUserLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let res = await fetch(backendURL + "/auth/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  let data = await res.json();

  if (isSuccess(data.status)) {
    return redirect("/app");
  }

  return data;
}

export default authenticateUser;
