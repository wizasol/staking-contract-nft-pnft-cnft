import Header from "@/components/navigation/Header";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/navigation/Footer";
import ReactLenisComponent from "@/components/ReactLenisComponent";
import ClickImage from "@/components/ClickImage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Provider from "./context/client-provider";
import { QueryClient, QueryClientProvider } from "react-query";
import QueryProvider from "./context/query-provider";

const bozoFont = localFont({
  src: "../public/font/bozo.ttf",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bozo Collective",
  description:
    "Bozo Collective is a collection with art inspired by Diary of a Wimpy Kid. Created to remind the community that we are all Bozos and we are all in this together.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={bozoFont.className}>
      <body
        className="bg-beige text-black" /* style={{ overflow: "hidden" }} */
      >
        <Provider session={session}>
          <QueryProvider>
            <ReactLenisComponent>
              {/* <ClickImage>{children}</ClickImage> */}
              {children}
            </ReactLenisComponent>
          </QueryProvider>
        </Provider>
      </body>
    </html>
  );
}
