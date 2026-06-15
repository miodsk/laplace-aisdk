'use client';

import * as React from 'react';
import {
    usePathname,
    useRouter,
    useSearchParams,
} from 'next/navigation';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    BookMarked,
    Database,
    History,
    MessageSquare,
    Plus,
} from 'lucide-react';
import { KnowledgeAssetsPanel } from '@/components/KnowledgeAssetsPanel';
import { ChatView } from '@/components/ChatView';
import {
    ChatSidebar,
    type ChatListItem,
} from '@/components/ChatSidebar';
import {
    createChatRequest,
    fetchChat,
} from '@/lib/chat-api-client';
import { fetchAssets } from '@/lib/asset-api-client';
import type { ToolMessage } from '@/lib/chat-tools';

type TabKey = 'assets' | 'chat';

const VALID_TABS: readonly TabKey[] = ['assets', 'chat'] as const;

function parseTab(raw: string | null): TabKey {
    return VALID_TABS.includes(raw as TabKey) ? (raw as TabKey) : 'assets';
}

export function WorkbenchTabs({ chats }: { chats: ChatListItem[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tab = parseTab(searchParams.get('tab'));
    const chatId = searchParams.get('chat');

    const setTab = React.useCallback(
        (next: TabKey) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === 'assets') {
                params.delete('tab');
                params.delete('chat');
            } else {
                params.set('tab', 'chat');
            }
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    const setChatId = React.useCallback(
        (id: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (id) {
                params.set('tab', 'chat');
                params.set('chat', id);
            } else {
                params.delete('chat');
            }
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    const [chatMessages, setChatMessages] = React.useState<
        ToolMessage[] | null
    >(null);
    const [chatError, setChatError] = React.useState<string | null>(null);
    const [chatLoading, setChatLoading] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [assetCount, setAssetCount] = React.useState<number | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        fetchAssets()
            .then((list) => {
                if (!cancelled) setAssetCount(list.length);
            })
            .catch(() => {
                if (!cancelled) setAssetCount(0);
            });
        return () => {
            cancelled = true;
        };
    }, [tab, chatId]);

    React.useEffect(() => {
        if (tab !== 'chat' || !chatId) {
            setChatMessages(null);
            setChatError(null);
            return;
        }
        let cancelled = false;
        setChatLoading(true);
        setChatError(null);
        fetchChat(chatId)
            .then((detail) => {
                if (cancelled) return;
                if (!detail) {
                    setChatMessages([]);
                    setChatError(null);
                } else {
                    setChatMessages(detail.messages as ToolMessage[]);
                }
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setChatError(
                    err instanceof Error ? err.message : '加载对话失败',
                );
                setChatMessages([]);
            })
            .finally(() => {
                if (!cancelled) setChatLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [tab, chatId]);

    function handleNewChat() {
        setCreating(true);
        void createChatRequest()
            .then((chat) => {
                setChatId(chat.id);
            })
            .catch((err: unknown) => {
                console.error('createChatRequest failed', err);
            })
            .finally(() => {
                setCreating(false);
            });
    }

    return (
        <Tabs
            value={tab}
            onValueChange={(v) => setTab(parseTab(v))}
            className="flex min-h-svh flex-col gap-0"
        >
            <AppHeader
                tab={tab}
                assetCount={assetCount}
                chatCount={chats.length}
                chats={chats}
            />

            <TabsContent
                value="assets"
                className="flex-1 overflow-y-auto"
            >
                <KnowledgeAssetsPanel />
            </TabsContent>

            <TabsContent
                value="chat"
                className="flex flex-1 flex-col overflow-hidden"
            >
                {!chatId ? (
                    <EmptyChat
                        assetCount={assetCount}
                        creating={creating}
                        onNewChat={handleNewChat}
                    />
                ) : chatLoading || chatMessages === null ? (
                    <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
                        <Spinner /> 加载对话中…
                    </div>
                ) : chatError ? (
                    <div className="mx-auto w-full max-w-2xl p-6">
                        <Alert variant="destructive">
                            <AlertDescription>
                                {chatError}
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    className="ml-2"
                                    onClick={() => setChatId(null)}
                                >
                                    返回
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center overflow-y-auto p-4 sm:p-6">
                        <ChatView
                            id={chatId}
                            initialMessages={chatMessages}
                        />
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}

function AppHeader({
    tab,
    assetCount,
    chatCount,
    chats,
}: {
    tab: TabKey;
    assetCount: number | null;
    chatCount: number;
    chats: ChatListItem[];
}) {
    return (
        <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex flex-col gap-3 border-b px-4 pt-3 pb-2 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-foreground text-background flex size-8 items-center justify-center rounded-lg">
                        <BookMarked className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-heading text-[15px] font-semibold leading-none tracking-tight">
                            知识资产工作台
                        </h1>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-none">
                            RAG 问答 · 资产 CRUD · Trace
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <ChatSidebar
                        chats={chats}
                        trigger={
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="对话历史"
                                className="text-muted-foreground"
                            >
                                <History className="size-4" />
                                <span className="hidden sm:inline">
                                    历史
                                </span>
                                {chatCount > 0 && (
                                    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                                        {chatCount}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                    <TabsList className="h-8">
                        <TabsTrigger value="assets" className="text-xs">
                            <Database />
                            资产
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="text-xs">
                            <MessageSquare />
                            对话
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>
            <KnowledgeContext assetCount={assetCount} activeTab={tab} />
        </header>
    );
}

function KnowledgeContext({
    assetCount,
    activeTab,
}: {
    assetCount: number | null;
    activeTab: TabKey;
}) {
    if (assetCount === null) {
        return (
            <p className="text-muted-foreground/80 text-[11px]">
                知识库加载中…
            </p>
        );
    }
    if (assetCount === 0) {
        return (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                知识库为空 — Agent 暂时无法基于内容回答，请先到「资产」Tab 添加。
            </p>
        );
    }
    return (
        <p
            className={
                'text-[11px] ' +
                (activeTab === 'chat'
                    ? 'text-foreground/70'
                    : 'text-muted-foreground/80')
            }
        >
            当前知识库 <span className="font-medium">{assetCount}</span> 条资产
            · Agent 回答时会基于这些内容检索并附引用
        </p>
    );
}

function EmptyChat({
    assetCount,
    creating,
    onNewChat,
}: {
    assetCount: number | null;
    creating: boolean;
    onNewChat: () => void;
}) {
    const empty = assetCount === 0;
    return (
        <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <div className="bg-foreground/5 flex size-14 items-center justify-center rounded-2xl">
                    <MessageSquare className="text-foreground/70 size-6" />
                </div>
                <div>
                    <h3 className="font-heading text-base font-semibold">
                        开始一段新对话
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {empty
                            ? '当前知识库为空，请先到「资产」Tab 添加内容，Agent 才能基于检索给出有依据的回答。'
                            : 'Agent 会先调用 searchKnowledge 检索知识库，再以引用形式给出答案。'}
                    </p>
                </div>
                <Button
                    onClick={onNewChat}
                    disabled={creating}
                    size="lg"
                >
                    {creating ? <Spinner /> : <Plus />}
                    {creating ? '创建中…' : '新建对话'}
                </Button>
            </div>
        </div>
    );
}
