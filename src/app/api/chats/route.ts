import { NextResponse } from 'next/server';
import { generateId } from 'ai';
import { createChat } from '@/lib/chat-store';

export async function POST() {
    const id = generateId();
    const chat = await createChat(id);
    return NextResponse.json({ chat }, { status: 201 });
}
