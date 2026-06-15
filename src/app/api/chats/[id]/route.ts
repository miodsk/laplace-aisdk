import { NextResponse } from 'next/server';
import { getChat } from '@/lib/chat-store';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
    const { id } = await context.params;
    const chat = await getChat(id);
    if (!chat) {
        return NextResponse.json(
            { error: 'NotFound', message: 'chat not found' },
            { status: 404 },
        );
    }
    return NextResponse.json({
        id: chat.id,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
    });
}
