'use server';

import { redirect } from 'next/navigation';
import { createChat } from '@/lib/chat-store';
import { generateId } from 'ai';

export async function createChatAction() {
    const id = generateId();
    await createChat(id);
    redirect(`/chat/${id}`);
}
