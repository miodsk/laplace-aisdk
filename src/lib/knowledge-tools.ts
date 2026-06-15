import { tool } from 'ai';
import { z } from 'zod';
import {
    getAsset as storeGetAsset,
    listAssets as storeListAssets,
} from '@/lib/asset-store';

export interface SearchHit {
    id: string;
    title: string;
    tags: string[];
    snippet: string;
    score: number;
    contentLength: number;
}

const SNIPPET_RADIUS = 60;

function tokenize(s: string): string[] {
    return s
        .toLowerCase()
        .split(/[\s,，。.;；、]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

function makeSnippet(content: string, tokens: string[]): string {
    if (content.length <= SNIPPET_RADIUS * 2) return content;
    const lower = content.toLowerCase();
    let firstHit = -1;
    for (const t of tokens) {
        const idx = lower.indexOf(t);
        if (idx !== -1 && (firstHit === -1 || idx < firstHit)) {
            firstHit = idx;
        }
    }
    if (firstHit === -1) {
        return content.slice(0, SNIPPET_RADIUS * 2) + '…';
    }
    const start = Math.max(0, firstHit - SNIPPET_RADIUS);
    const end = Math.min(
        content.length,
        firstHit + SNIPPET_RADIUS + tokens[0]!.length,
    );
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

function scoreAsset(
    asset: { id: string; title: string; tags: string[]; content: string },
    tokens: string[],
): number {
    const titleLower = asset.title.toLowerCase();
    const contentLower = asset.content.toLowerCase();
    const tagSet = new Set(asset.tags.map((t) => t.toLowerCase()));
    let score = 0;
    for (const t of tokens) {
        if (titleLower.includes(t)) score += 3;
        if (tagSet.has(t)) score += 2;
        else if (asset.tags.some((tag) => tag.toLowerCase().includes(t))) {
            score += 1;
        }
        if (contentLower.includes(t)) score += 1;
    }
    return score;
}

export async function searchKnowledgeBase(
    query: string,
    limit = 5,
): Promise<SearchHit[]> {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];
    const all = await storeListAssets();
    const scored: SearchHit[] = all
        .map((a) => ({
            id: a.id,
            title: a.title,
            tags: a.tags,
            snippet: makeSnippet(a.content, tokens),
            score: scoreAsset(a, tokens),
            contentLength: a.content.length,
        }))
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    return scored;
}

export const knowledgeToolDefs = {
    listAssets: tool({
        description:
            'List all knowledge assets with their metadata (id, title, tags, length). Returns NO content. Use this to discover what is in the knowledge base before searching or reading.',
        inputSchema: z.object({}),
        execute: async () => {
            const assets = await storeListAssets();
            return assets.map((a) => ({
                id: a.id,
                title: a.title,
                tags: a.tags,
                createdAt: a.createdAt,
                contentLength: a.content.length,
            }));
        },
    }),

    searchKnowledge: tool({
        description:
            'Search the knowledge base by a free-text query. Matches against asset title, tags, and content. Returns the top N hits with a short snippet and a relevance score. ALWAYS call this before answering a user question about knowledge base content.',
        inputSchema: z.object({
            query: z
                .string()
                .describe(
                    'Free-text query, e.g. "AIOS 平台能力" or "Agent 工作流可靠性"',
                ),
            limit: z
                .number()
                .int()
                .min(1)
                .max(10)
                .default(5)
                .describe('Maximum number of results to return (default 5)'),
        }),
        execute: async ({ query, limit }) => {
            const hits = await searchKnowledgeBase(query, limit);
            return {
                query,
                count: hits.length,
                hits,
            };
        },
    }),

    readAsset: tool({
        description:
            'Read the FULL content of a single knowledge asset by id. Use after searchKnowledge to load the complete text of a hit you want to cite.',
        inputSchema: z.object({
            id: z
                .string()
                .describe('Asset id, e.g. "01" for seed assets, or the full nanoid for user-added ones'),
        }),
        execute: async ({ id }) => {
            const asset = await storeGetAsset(id);
            if (!asset) {
                return { error: 'Asset not found', id };
            }
            return asset;
        },
    }),
};
