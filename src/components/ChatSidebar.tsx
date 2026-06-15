'use client';

import { Menu, MessageSquare, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { createChatAction } from '@/lib/chat-actions';

export interface ChatListItem {
    id: string;
    title?: string;
    updatedAt: string;
    messageCount: number;
}

export function ChatSidebar({ chats }: { chats: ChatListItem[] }) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();

    const goToChat = (id: string) => {
        setOpen(false);
        router.push(`/chat/${id}`);
    };

    const newChat = () => {
        setOpen(false);
        startTransition(async () => {
            await createChatAction();
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={
                    <Button
                        variant="outline"
                        size="icon"
                        className="fixed top-4 left-4 z-40"
                        aria-label="Open chat list"
                    >
                        <Menu className="size-4" />
                    </Button>
                }
            />

            <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>聊天</SheetTitle>
                    <SheetDescription className="sr-only">
                        切换或新建对话
                    </SheetDescription>
                </SheetHeader>

                <div className="p-3 border-b">
                    <Button
                        type="button"
                        onClick={newChat}
                        disabled={pending}
                        className="w-full"
                    >
                        <Plus className="size-4" />
                        新建对话
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {chats.length === 0 ? (
                            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                                暂无对话
                            </div>
                        ) : (
                            chats.map(chat => {
                                const active = pathname === `/chat/${chat.id}`;
                                return (
                                    <button
                                        key={chat.id}
                                        type="button"
                                        onClick={() => goToChat(chat.id)}
                                        className={
                                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-muted ' +
                                            (active ? 'bg-muted font-medium' : '')
                                        }
                                    >
                                        <MessageSquare className="size-4 shrink-0" />
                                        <span className="flex-1 truncate">
                                            {chat.title ??
                                                `对话 ${chat.id.slice(0, 6)}`}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {chat.messageCount}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
