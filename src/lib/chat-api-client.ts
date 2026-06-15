import type { UIMessage } from 'ai';

export interface ChatDetail {
    id: string;
    messages: UIMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatedChat {
    id: string;
    messages: UIMessage[];
    createdAt: string;
    updatedAt: string;
}

const BASE = '/api/chats';

export async function fetchChat(
    id: string,
): Promise<ChatDetail | null> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`加载对话失败：HTTP ${res.status}`);
    }
    return (await res.json()) as ChatDetail;
}

export async function createChatRequest(): Promise<CreatedChat> {
    const res = await fetch(BASE, { method: 'POST' });
    if (!res.ok) {
        throw new Error(`创建对话失败：HTTP ${res.status}`);
    }
    const data = (await res.json()) as { chat: CreatedChat };
    return data.chat;
}
