import { notFound } from 'next/navigation';
import { getChat } from '@/lib/chat-store';
import { ChatView } from '@/components/ChatView';
import type { ToolMessage } from '@/app/api/chat/route';

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const chat = await getChat(id);
    if (!chat) notFound();
    return <ChatView id={id} initialMessages={chat.messages as ToolMessage[]} />;
}
