import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatSidebar, type ChatListItem } from "@/components/ChatSidebar";
import { loadChats } from "@/lib/chat-store";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "AI Chat",
    description: "A simple AI chatbot",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const chats = await loadChats();
    const items: ChatListItem[] = chats
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(c => {
            const firstUserText = c.messages
                .find(m => m.role === 'user')
                ?.parts.find(p => p.type === 'text')?.text;
            return {
                id: c.id,
                title: firstUserText?.slice(0, 30),
                updatedAt: c.updatedAt,
                messageCount: c.messages.length,
            };
        });

    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <ChatSidebar chats={items} />
                {children}
            </body>
        </html>
    );
}
