"use client";

import * as React from "react";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { BookOpen, FileText } from "lucide-react";
import type { ToolMessage } from "@/lib/chat-tools";

interface SearchHit {
    id: string;
    title: string;
    tags: string[];
    snippet: string;
    score: number;
}

function getOutput<T>(part: ToolMessage["parts"][number]): T | null {
    if ("state" in part && part.state === "output-available") {
        return part.output as T;
    }
    return null;
}

export function CitationsForMessage({
    parts,
}: {
    parts: ToolMessage["parts"];
}) {
    const seen = new Set<string>();
    const citations: { index: number; id: string; title: string; snippet: string }[] = [];

    for (const part of parts) {
        if (part.type !== "tool-searchKnowledge") continue;
        const out = getOutput<{ hits: SearchHit[] }>(part);
        if (!out) continue;
        for (const hit of out.hits) {
            if (seen.has(hit.id)) continue;
            seen.add(hit.id);
            citations.push({
                index: citations.length + 1,
                id: hit.id,
                title: hit.title,
                snippet: hit.snippet,
            });
        }
    }

    if (citations.length === 0) return null;

    return (
        <Sources className="not-prose mt-3">
            <SourcesTrigger count={citations.length}>
                <span className="text-foreground/70 inline-flex items-center gap-1.5 font-medium">
                    <BookOpen className="size-3.5" />
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
                        <span className="text-muted-foreground block max-w-md text-xs">
                            {c.snippet}
                        </span>
                    </Source>
                ))}
            </SourcesContent>
        </Sources>
    );
}
