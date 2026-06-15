"use client";

import * as React from 'react';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Database, FileText, Search } from 'lucide-react';
import type { ToolMessage } from '@/lib/chat-tools';

interface SearchHit {
    id: string;
    title: string;
    tags: string[];
    snippet: string;
    score: number;
    contentLength: number;
}

interface SearchKnowledgeOutput {
    query: string;
    count: number;
    hits: SearchHit[];
}

interface AssetOutput {
    id: string;
    title: string;
    tags: string[];
    content?: string;
    contentLength?: number;
    createdAt?: string;
}

interface ListAssetsOutputItem {
    id: string;
    title: string;
    tags: string[];
}

function getOutput<T>(part: ToolMessage['parts'][number]): T | null {
    if ('state' in part && part.state === 'output-available') {
        return part.output as T;
    }
    return null;
}

function getInput(part: ToolMessage['parts'][number]): unknown {
    if ('input' in part) return part.input;
    return null;
}

function getState(part: ToolMessage['parts'][number]) {
    if ('state' in part) return part.state;
    return 'output-available' as const;
}

type ToolState = Parameters<typeof ToolHeader>[0]['state'];

function toToolState(
    s: ReturnType<typeof getState>,
): ToolState {
    if (
        s === 'input-streaming' ||
        s === 'input-available' ||
        s === 'approval-requested' ||
        s === 'approval-responded' ||
        s === 'output-available' ||
        s === 'output-error' ||
        s === 'output-denied'
    ) {
        return s;
    }
    return 'output-available';
}

export function ToolPart({
    part,
}: {
    part: ToolMessage['parts'][number];
}) {
    switch (part.type) {
        case 'tool-writeFile':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="writeFile"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-readFile':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="readFile"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-deletePath':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="deletePath"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-listDirectory':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="listDirectory"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-createDirectory':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="createDirectory"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-exists':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="exists"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );
        case 'tool-searchFiles':
            return (
                <Tool defaultOpen={false}>
                    <ToolHeader
                        type={part.type}
                        state={toToolState(getState(part))}
                        title="searchFiles"
                    />
                    <ToolContent>
                        <ToolInput input={getInput(part)} />
                        <ToolOutput
                            output={getOutput(part)}
                            errorText={
                                'errorText' in part
                                    ? part.errorText
                                    : undefined
                            }
                        />
                    </ToolContent>
                </Tool>
            );

        case 'tool-listAssets': {
            const output = getOutput<ListAssetsOutputItem[]>(part);
            return (
                <ChainOfThought defaultOpen={!!output}>
                    <ChainOfThoughtHeader>
                        列出知识库
                    </ChainOfThoughtHeader>
                    <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                            icon={Database}
                            label="listAssets"
                            description={
                                output
                                    ? `共 ${output.length} 条`
                                    : '执行中…'
                            }
                            status={output ? 'complete' : 'active'}
                        >
                            {output && output.length > 0 && (
                                <ChainOfThoughtSearchResults>
                                    {output.slice(0, 12).map((a) => (
                                        <ChainOfThoughtSearchResult
                                            key={a.id}
                                        >
                                            [{a.id}] {a.title}
                                        </ChainOfThoughtSearchResult>
                                    ))}
                                </ChainOfThoughtSearchResults>
                            )}
                        </ChainOfThoughtStep>
                    </ChainOfThoughtContent>
                </ChainOfThought>
            );
        }

        case 'tool-searchKnowledge': {
            const output = getOutput<SearchKnowledgeOutput>(part);
            const query = output?.query ?? (getInput(part) as { query?: string } | null)?.query;
            return (
                <ChainOfThought defaultOpen={!!output}>
                    <ChainOfThoughtHeader>
                        检索知识库
                    </ChainOfThoughtHeader>
                    <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                            icon={Search}
                            label="searchKnowledge"
                            description={
                                output
                                    ? `query: "${query}" · 命中 ${output.count} 条`
                                    : `query: "${query ?? '...'}" · 执行中…`
                            }
                            status={output ? 'complete' : 'active'}
                        >
                            {output && output.hits.length > 0 && (
                                <ChainOfThoughtSearchResults>
                                    {output.hits.map((hit, i) => (
                                        <ChainOfThoughtSearchResult
                                            key={hit.id}
                                        >
                                            [{i + 1}] {hit.title} · score {hit.score}
                                        </ChainOfThoughtSearchResult>
                                    ))}
                                </ChainOfThoughtSearchResults>
                            )}
                        </ChainOfThoughtStep>
                    </ChainOfThoughtContent>
                </ChainOfThought>
            );
        }

        case 'tool-readAsset': {
            const output = getOutput<AssetOutput>(part);
            return (
                <ChainOfThought defaultOpen={!!output}>
                    <ChainOfThoughtHeader>
                        读取知识资产
                    </ChainOfThoughtHeader>
                    <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                            icon={BookOpen}
                            label="readAsset"
                            description={
                                output
                                    ? `#${output.id} · ${output.title}`
                                    : `执行中…`
                            }
                            status={output ? 'complete' : 'active'}
                        >
                            {output?.tags && output.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {output.tags.map((t) => (
                                        <Badge
                                            key={t}
                                            variant="secondary"
                                            className="font-normal"
                                        >
                                            {t}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </ChainOfThoughtStep>
                    </ChainOfThoughtContent>
                </ChainOfThought>
            );
        }

        default:
            return null;
    }
}

export interface Citation {
    index: number;
    id: string;
    title: string;
    snippet?: string;
}

export function CitationFooter({ citations }: { citations: Citation[] }) {
    if (citations.length === 0) return null;
    return (
        <Sources className="not-prose mt-3">
            <SourcesTrigger count={citations.length}>
                <span className="text-foreground/70 font-medium">
                    引用 {citations.length} 条
                </span>
            </SourcesTrigger>
            <SourcesContent>
                {citations.map((c) => (
                    <Source
                        key={c.id}
                        title={`[${c.index}] ${c.title}`}
                        href="#"
                        onClick={(e) => e.preventDefault()}
                    >
                        <FileText className="text-muted-foreground size-3.5" />
                        <span className="text-foreground/80 block font-medium">
                            [{c.index}] {c.title}
                        </span>
                        {c.snippet && (
                            <span className="text-muted-foreground block max-w-md text-xs">
                                {c.snippet}
                            </span>
                        )}
                    </Source>
                ))}
            </SourcesContent>
        </Sources>
    );
}

export const Wrapper = (props: { children: React.ReactNode }) => (
    <div className="flex w-full flex-col">{props.children}</div>
);

export const ChatInput = ({
    input,
    onChange,
    onSubmit,
    disabled,
}: {
    input: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled?: boolean;
}) => (
    <form onSubmit={onSubmit}>
        <input
            className={`fixed bottom-0 w-full max-w-md p-2 mb-8 border-2 border-zinc-700 rounded shadow-xl bg-gray-800 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={input}
            placeholder={
                disabled
                    ? 'Please handle tool calls first...'
                    : 'Say something...'
            }
            onChange={onChange}
            disabled={disabled}
            autoFocus
        />
    </form>
);
