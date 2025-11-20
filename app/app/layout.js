"use client";
import CallMenu from "../components/CallMenu";
import MainContainer from "../components/MainContainer";
import DirectMessagesMenu from "../components/side menus/DirectMessagesMenu";
import SocialMenu from "../components/side menus/SocialMenu";
import SocketProvider from "../components/SocketProvider";
import TopBar from "../components/TopBar";
import { UserProvider } from "../components/UserContext";
import authenticateUser from "../utils/authenticateUser";

export const metadata = {
  title: "Sonora App",
  description: "Sonora main front page",
};

export default async function RootLayout({ children }) {
  const userData = await authenticateUser();

  return (
    <div className="bg-shade-900 flex h-full w-full flex-col gap-2 p-2">
      <UserProvider userData={userData}>
        <SocketProvider userData={userData}>
          <TopBar />
          <div className="flex-layout">
            <DirectMessagesMenu />
            <MainContainer>{children}</MainContainer>
            {/* <CallMenu /> */}
            <SocialMenu />
          </div>
        </SocketProvider>
      </UserProvider>
    </div>
  );
}
