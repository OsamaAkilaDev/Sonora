import { redirect } from "next/navigation";
import { isSuccess } from "../utils/status";
import { backendURL } from "./constants";
import { cookies } from "next/headers"; // App Router only

export async function authenticateUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  console.log(token);

  let res = await fetch(backendURL + "/auth/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `token=${token}` } : {}),
    },
    // credentials: "include" is ignored on server
  });

  let data = await res.json();

  console.log(data);

  if (isSuccess(data.status)) {
    // Set cookie in browser for client-side navigation
    if (typeof window !== "undefined") {
      document.cookie = `token=${data.content.token}; path=/; SameSite=None; Secure`;
    }
    return data.content.user;
  }

  return redirect("/login");
}

export async function isUserLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let res = await fetch(backendURL + "/auth/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `token=${token}` } : {}),
    },
    // credentials: "include" is ignored on server
  });

  let data = await res.json();

  if (isSuccess(data.status)) {
    return redirect("/app");
  }

  return data;
}

export default authenticateUser;
