import type { KnowledgeAsset } from "@/lib/asset-store";

const BASE = "/api/assets";

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function parseError(res: Response): Promise<ApiError> {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
        const data = (await res.json()) as { message?: string; error?: string };
        if (data?.message) message = data.message;
        else if (data?.error) message = data.error;
    } catch {
        // ignore
    }
    return new ApiError(message, res.status);
}

export async function fetchAssets(): Promise<KnowledgeAsset[]> {
    const res = await fetch(BASE, { cache: "no-store" });
    if (!res.ok) throw await parseError(res);
    const data = (await res.json()) as { assets: KnowledgeAsset[] };
    return data.assets;
}

export interface CreatePayload {
    title: string;
    content: string;
    tags: string[];
}

export async function createAssetRequest(
    payload: CreatePayload,
): Promise<KnowledgeAsset> {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res);
    const data = (await res.json()) as { asset: KnowledgeAsset };
    return data.asset;
}

export type UpdatePayload = Partial<CreatePayload>;

export async function updateAssetRequest(
    id: string,
    payload: UpdatePayload,
): Promise<KnowledgeAsset> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res);
    const data = (await res.json()) as { asset: KnowledgeAsset };
    return data.asset;
}

export async function deleteAssetRequest(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!res.ok) throw await parseError(res);
}
