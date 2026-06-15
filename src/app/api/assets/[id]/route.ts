import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    deleteAsset,
    getAsset,
    updateAsset,
} from '@/lib/asset-store';

interface RouteContext {
    params: Promise<{ id: string }>;
}

async function resolveId(
    context: RouteContext,
): Promise<{ id: string } | NextResponse> {
    const { id } = await context.params;
    if (!id || id.startsWith('_')) {
        return NextResponse.json(
            { error: 'BadRequest', message: 'invalid id' },
            { status: 400 },
        );
    }
    return { id };
}

const UpdateBody = z
    .object({
        title: z.string().trim().min(1).max(120).optional(),
        content: z.string().min(1).optional(),
        tags: z.array(z.string().trim().min(1)).max(20).optional(),
    })
    .refine(
        (v) =>
            v.title !== undefined ||
            v.content !== undefined ||
            v.tags !== undefined,
        { message: '至少需要提供一个字段' },
    );

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

export async function GET(_req: Request, context: RouteContext) {
    const r = await resolveId(context);
    if (r instanceof NextResponse) return r;
    const asset = await getAsset(r.id);
    if (!asset) {
        return NextResponse.json(
            { error: 'NotFound', message: 'asset not found' },
            { status: 404 },
        );
    }
    return NextResponse.json({ asset });
}

export async function PUT(request: Request, context: RouteContext) {
    const r = await resolveId(context);
    if (r instanceof NextResponse) return r;

    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'BadRequest', message: '请求体不是合法 JSON' },
            { status: 400 },
        );
    }
    const parsed = UpdateBody.safeParse(json);
    if (!parsed.success) return validationError(parsed.error.issues);

    const patch: { title?: string; content?: string; tags?: string[] } = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim();
    if (parsed.data.content !== undefined) patch.content = parsed.data.content;
    if (parsed.data.tags !== undefined) {
        patch.tags = parsed.data.tags.map((t) => t.toLowerCase());
    }

    const updated = await updateAsset(r.id, patch);
    if (!updated) {
        return NextResponse.json(
            { error: 'NotFound', message: 'asset not found' },
            { status: 404 },
        );
    }
    return NextResponse.json({ asset: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
    const r = await resolveId(context);
    if (r instanceof NextResponse) return r;
    const ok = await deleteAsset(r.id);
    if (!ok) {
        return NextResponse.json(
            { error: 'NotFound', message: 'asset not found' },
            { status: 404 },
        );
    }
    return NextResponse.json({ ok: true });
}
