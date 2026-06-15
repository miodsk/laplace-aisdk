import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    createAsset,
    listAssets,
    type KnowledgeAsset,
} from '@/lib/asset-store';

export async function GET() {
    const assets = await listAssets();
    return NextResponse.json({ assets });
}

const CreateBody = z.object({
    title: z.string().trim().min(1, '标题不能为空').max(120),
    content: z.string().min(1, '内容不能为空'),
    tags: z.array(z.string().trim().min(1)).max(20).default([]),
});

function validationError(issues: z.ZodIssue[]) {
    return NextResponse.json(
        {
            error: 'ValidationError',
            message: issues
                .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
                .join('; '),
        },
        { status: 400 },
    );
}

export async function POST(request: Request) {
    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'BadRequest', message: '请求体不是合法 JSON' },
            { status: 400 },
        );
    }
    const parsed = CreateBody.safeParse(json);
    if (!parsed.success) return validationError(parsed.error.issues);

    const normalized: KnowledgeAsset = await createAsset({
        title: parsed.data.title.trim(),
        content: parsed.data.content,
        tags: parsed.data.tags.map((t) => t.toLowerCase()),
    });
    return NextResponse.json({ asset: normalized }, { status: 201 });
}
