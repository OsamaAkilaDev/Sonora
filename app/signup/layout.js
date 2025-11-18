import { isUserLoggedIn } from "../utils/authenticateUser";

export const metadata = {
  title: "Log in",
  description: "Sonora log in page",
};

export default async function RootLayout({ children }) {
  await isUserLoggedIn();
  return <>{children}</>;
}
