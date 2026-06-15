'use client';

import {
    Conversation,
    ConversationContent,
    ConversationDownload,
    ConversationEmptyState,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
    Message as ElementsMessage,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message";
import {
    PromptInput,
    PromptInputHeader,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { BookMarked } from "lucide-react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ToolMessage } from "@/lib/chat-tools";
import { ToolPart } from "@/components/ToolMessage";
import { CitationsForMessage } from "@/components/CitationsForMessage";
import PromptInputAttachmentsDisplay from "@/components/AttachmentDisplay";

const QUICK_PROMPTS = [
    "AIOS 平台有哪些核心能力？",
    "数字资产知识库支持哪些类型的内容？",
    "Agent 工作流里「可观测性」指的是什么？",
    "如何保证 Agent 任务执行的可靠性？",
];

export function ChatView({
    id,
    initialMessages,
}: {
    id: string;
    initialMessages: ToolMessage[];
}) {
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } = useChat<ToolMessage>({
        id,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            prepareSendMessagesRequest({ messages, id, headers }) {
                return {
                    body: { id, messages },
                    headers: {
                        ...headers,
                        "X-Chat-Id": id,
                    },
                };
            },
        }),
    });

    const handleSubmit = (message: PromptInputMessage) => {
        if (message.text.trim()) {
            sendMessage({ text: message.text });
            setInput("");
        }
    };

    return (
        <div className="relative flex h-full w-full max-w-4xl flex-col rounded-2xl border bg-card/30 ring-1 ring-foreground/5">
            <div className="flex h-full min-h-0 flex-col">
                <Conversation>
                    <ConversationContent>
                        {messages.length === 0 ? (
                            <ConversationEmptyState>
                                <div className="bg-foreground/5 text-foreground/70 mx-auto flex size-12 items-center justify-center rounded-2xl">
                                    <BookMarked className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-sm">
                                        向知识库提问
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        Agent 会先调用 searchKnowledge
                                        检索知识库，再以引用形式给出答案。
                                    </p>
                                </div>
                                <Suggestions className="mt-2 max-w-full">
                                    {QUICK_PROMPTS.map((p) => (
                                        <Suggestion
                                            key={p}
                                            suggestion={p}
                                            onClick={(s) => {
                                                sendMessage({ text: s });
                                            }}
                                        />
                                    ))}
                                </Suggestions>
                            </ConversationEmptyState>
                        ) : (
                            messages.map((message) => (
                                <ElementsMessage
                                    from={message.role}
                                    key={message.id}
                                >
                                    <MessageContent>
                                        {message.parts.map((part, i) => {
                                            if (part.type === "text") {
                                                return (
                                                    <MessageResponse
                                                        key={`${message.id}-${i}`}
                                                    >
                                                        {part.text}
                                                    </MessageResponse>
                                                );
                                            }
                                            return (
                                                <ToolPart
                                                    key={`${message.id}-${i}`}
                                                    part={part}
                                                />
                                            );
                                        })}
                                        {message.role === "assistant" && (
                                            <CitationsForMessage
                                                parts={message.parts}
                                            />
                                        )}
                                    </MessageContent>
                                </ElementsMessage>
                            ))
                        )}
                    </ConversationContent>
                    <ConversationDownload messages={messages} />
                    <ConversationScrollButton />
                </Conversation>

                <div className="px-4 pt-3 pb-4 sm:px-6">
                    <PromptInput
                        onSubmit={handleSubmit}
                        className="mx-auto w-full max-w-2xl"
                    >
                        <PromptInputHeader>
                            <PromptInputAttachmentsDisplay />
                        </PromptInputHeader>
                        <PromptInputTextarea
                            value={input}
                            placeholder="问点什么…（按 Enter 发送，Shift+Enter 换行）"
                            onChange={(e) => setInput(e.currentTarget.value)}
                            className="pr-12"
                        />
                        <PromptInputSubmit
                            status={
                                status === "streaming" ? "streaming" : "ready"
                            }
                            disabled={!input.trim()}
                            className="absolute right-1 bottom-1"
                        />
                    </PromptInput>
                </div>
            </div>
        </div>
    );
}
