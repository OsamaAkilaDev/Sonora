import { backendURL } from "./constants";

export async function getRequest(route) {
  let res = await fetch(backendURL + route, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return res;
}

export async function postRequest(route, body) {
  let res = await fetch(backendURL + route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  return res;
}

export async function deleteRequest(route, body) {
  let res = await fetch(backendURL + route, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  return res;
}

export async function putRequest(route, body) {
  let res = await fetch(backendURL + route, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  return res;
}
