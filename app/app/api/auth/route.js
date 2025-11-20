export async function GET(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const backend = process.env.NEXT_PUBLIC_BACKEND_URI; // https://your-backend.onrender.com

  const res = await fetch(`${backend}/auth/`, {
    method: "POST",
    headers: {
      cookie: cookieHeader, // forward browser cookies
    },
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
