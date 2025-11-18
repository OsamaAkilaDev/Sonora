import { Rubik } from "next/font/google";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sonora",
  description: "Sonora main front page",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} antialiased`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
