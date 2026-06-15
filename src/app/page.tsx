import { Suspense } from 'react';
import { loadChats } from '@/lib/chat-store';
import {
    type ChatListItem,
} from '@/components/ChatSidebar';
import { WorkbenchTabs } from '@/components/WorkbenchTabs';

export default async function WorkbenchPage() {
    const chats = await loadChats();
    const items: ChatListItem[] = chats
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((c) => {
            const firstUserText = c.messages
                .find((m) => m.role === 'user')
                ?.parts.find((p) => p.type === 'text')?.text;
            return {
                id: c.id,
                title: firstUserText?.slice(0, 30),
                updatedAt: c.updatedAt,
                messageCount: c.messages.length,
            };
        });
    return (
        <Suspense fallback={null}>
            <WorkbenchTabs chats={items} />
        </Suspense>
    );
}
