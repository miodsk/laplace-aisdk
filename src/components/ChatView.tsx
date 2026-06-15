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
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ToolMessage } from "@/app/api/chat/route";
import { ToolPart } from "@/components/ToolMessage";
import PromptInputAttachmentsDisplay from "@/components/AttachmentDisplay";

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
            prepareSendMessagesRequest({ messages, id }) {
                return { body: { id, messages, trigger: "submit-message" } };
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
        <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
            <div className="flex flex-col h-full">
                <Conversation>
                    <ConversationContent>
                        {messages.length === 0 ? (
                            <ConversationEmptyState
                                icon={<MessageSquare className="size-12" />}
                                title="Hello World"
                                description="输入一些消息..."
                            />
                        ) : (
                            messages.map((message) => (
                                <ElementsMessage from={message.role} key={message.id}>
                                    <MessageContent>
                                        {message.parts.map((part, i) => {
                                            if (part.type === "text") {
                                                return (
                                                    <MessageResponse key={`${message.id}-${i}`}>
                                                        {part.text}
                                                    </MessageResponse>
                                                );
                                            }
                                            return <ToolPart key={`${message.id}-${i}`} part={part} />;
                                        })}
                                    </MessageContent>
                                </ElementsMessage>
                            ))
                        )}
                    </ConversationContent>
                    <ConversationDownload messages={messages} />
                    <ConversationScrollButton />
                </Conversation>

                <PromptInput
                    onSubmit={handleSubmit}
                    className="mt-4 w-full max-w-2xl mx-auto relative"
                >
                    <PromptInputHeader>
                        <PromptInputAttachmentsDisplay />
                    </PromptInputHeader>
                    <PromptInputTextarea
                        value={input}
                        placeholder="Say something..."
                        onChange={(e) => setInput(e.currentTarget.value)}
                        className="pr-12"
                    />
                    <PromptInputSubmit
                        status={status === "streaming" ? "streaming" : "ready"}
                        disabled={!input.trim()}
                        className="absolute bottom-1 right-1"
                    />
                </PromptInput>
            </div>
        </div>
    );
}
