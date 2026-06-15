"use client";

import * as React from "react";
import { AssetCard } from "@/components/AssetCard";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";
import { AssetForm, type AssetFormValues } from "@/components/AssetForm";
import { DeleteAssetDialog } from "@/components/DeleteAssetDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Database,
    FileText,
    Plus,
    Search,
    Sparkles,
    X,
} from "lucide-react";
import {
    ApiError,
    createAssetRequest,
    deleteAssetRequest,
    fetchAssets,
    updateAssetRequest,
} from "@/lib/asset-api-client";
import type { KnowledgeAsset } from "@/lib/asset-store";

type FormState =
    | { kind: "closed" }
    | { kind: "create" }
    | { kind: "edit"; asset: KnowledgeAsset };

type DeleteState =
    | { kind: "closed" }
    | { kind: "open"; asset: KnowledgeAsset };

type DetailState =
    | { kind: "closed" }
    | { kind: "open"; asset: KnowledgeAsset };

function filterAssets(
    assets: KnowledgeAsset[],
    query: string,
    activeTag: string | null,
): KnowledgeAsset[] {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
        if (activeTag && !a.tags.includes(activeTag)) return false;
        if (!q) return true;
        if (a.title.toLowerCase().includes(q)) return true;
        if (a.tags.some((t) => t.toLowerCase().includes(q))) return true;
        if (a.content.toLowerCase().includes(q)) return true;
        return false;
    });
}

export function KnowledgeAssetsPanel() {
    const [assets, setAssets] = React.useState<KnowledgeAsset[]>([]);
    const [query, setQuery] = React.useState("");
    const [activeTag, setActiveTag] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [form, setForm] = React.useState<FormState>({ kind: "closed" });
    const [del, setDel] = React.useState<DeleteState>({ kind: "closed" });
    const [detail, setDetail] = React.useState<DetailState>({
        kind: "closed",
    });

    const reload = React.useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const list = await fetchAssets();
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setAssets(list);
        } catch (err) {
            setLoadError(
                err instanceof Error ? err.message : "加载失败",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void reload();
    }, [reload]);

    const visible = React.useMemo(
        () => filterAssets(assets, query, activeTag),
        [assets, query, activeTag],
    );

    const allTags = React.useMemo(() => {
        const set = new Map<string, number>();
        for (const a of assets) {
            for (const t of a.tags) {
                set.set(t, (set.get(t) ?? 0) + 1);
            }
        }
        return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
    }, [assets]);

    async function handleFormSubmit(values: AssetFormValues) {
        if (form.kind === "create") {
            await createAssetRequest(values);
        } else if (form.kind === "edit") {
            await updateAssetRequest(form.asset.id, values);
        }
        await reload();
    }

    async function handleDelete() {
        if (del.kind !== "open") return;
        await deleteAssetRequest(del.asset.id);
        await reload();
    }

    function handleTagClick(tag: string) {
        setActiveTag((prev) => (prev === tag ? null : tag));
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-6 sm:py-8">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="font-heading text-xl font-semibold tracking-tight">
                        知识资产
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        共 {assets.length} 条资产 ·{" "}
                        {visible.length === assets.length
                            ? "全部可见"
                            : `筛选后 ${visible.length} 条`}{" "}
                        · Agent 将基于这些内容回答问题。
                    </p>
                </div>
                <Button onClick={() => setForm({ kind: "create" })}>
                    <Plus />
                    新增资产
                </Button>
            </header>

            <div className="flex flex-col gap-2">
                <div className="relative">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                        placeholder="按标题 / 标签 / 内容过滤…"
                        className="h-9 pl-8 pr-8"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="清空检索"
                            onClick={() => setQuery("")}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground/80">
                            标签：
                        </span>
                        {allTags.slice(0, 12).map(([t, count]) => {
                            const isActive = activeTag === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTagClick(t)}
                                    className={
                                        "inline-flex h-6 items-center rounded-full border px-2 text-xs transition-colors " +
                                        (isActive
                                            ? "border-foreground/30 bg-foreground/5 text-foreground"
                                            : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground")
                                    }
                                >
                                    {t}
                                    <span className="ml-1 text-[10px] opacity-60">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                        {activeTag && (
                            <button
                                type="button"
                                onClick={() => setActiveTag(null)}
                                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                            >
                                清除筛选
                            </button>
                        )}
                    </div>
                )}
            </div>

            {loadError && (
                <Alert variant="destructive">
                    <AlertDescription>
                        加载失败：{loadError}
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => void reload()}
                            className="ml-2"
                        >
                            重试
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                <SkeletonGrid />
            ) : visible.length === 0 ? (
                <EmptyState
                    hasAssets={assets.length > 0}
                    query={query}
                    activeTag={activeTag}
                    onCreate={() => setForm({ kind: "create" })}
                    onClear={() => {
                        setQuery("");
                        setActiveTag(null);
                    }}
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {visible.map((a) => (
                        <AssetCard
                            key={a.id}
                            asset={a}
                            onView={(asset) =>
                                setDetail({ kind: "open", asset })
                            }
                            onEdit={(asset) =>
                                setForm({ kind: "edit", asset })
                            }
                            onDelete={(asset) =>
                                setDel({ kind: "open", asset })
                            }
                            onTagClick={handleTagClick}
                            activeTag={activeTag}
                        />
                    ))}
                </div>
            )}

            <AssetForm
                mode={form.kind === "edit" ? "edit" : "create"}
                open={form.kind !== "closed"}
                onOpenChange={(open) => {
                    if (!open) setForm({ kind: "closed" });
                }}
                initialValues={
                    form.kind === "edit" ? form.asset : undefined
                }
                onSubmit={handleFormSubmit}
            />

            <DeleteAssetDialog
                open={del.kind === "open"}
                onOpenChange={(open) => {
                    if (!open) setDel({ kind: "closed" });
                }}
                asset={del.kind === "open" ? del.asset : null}
                onConfirm={handleDelete}
            />

            <AssetDetailDialog
                open={detail.kind === "open"}
                onOpenChange={(open) => {
                    if (!open) setDetail({ kind: "closed" });
                }}
                asset={detail.kind === "open" ? detail.asset : null}
            />

            {form.kind === "create" &&
                !loadError &&
                assets.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        提示：底层错误码为
                        <code className="mx-1 rounded bg-muted px-1">
                            {ApiError.prototype.name}
                        </code>
                        。
                    </p>
                )}
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl py-4 ring-1"
                >
                    <div className="flex items-start gap-3 px-4">
                        <div className="bg-muted size-8 animate-pulse rounded-md" />
                        <div className="flex-1 space-y-2">
                            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                        </div>
                    </div>
                    <div className="space-y-2 px-4">
                        <div className="bg-muted h-3 w-full animate-pulse rounded" />
                        <div className="bg-muted h-3 w-5/6 animate-pulse rounded" />
                        <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({
    hasAssets,
    query,
    activeTag,
    onCreate,
    onClear,
}: {
    hasAssets: boolean;
    query: string;
    activeTag: string | null;
    onCreate: () => void;
    onClear: () => void;
}) {
    if (!hasAssets) {
        return (
            <div className="border-muted-foreground/20 bg-muted/30 flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
                <div className="bg-background text-muted-foreground flex size-12 items-center justify-center rounded-full ring-1 ring-foreground/10">
                    <Database className="size-5" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-heading text-base font-semibold">
                        知识库还是空的
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        添加资产后，Agent 在「对话」中会自动检索并基于这些内容回答。
                    </p>
                </div>
                <Button onClick={onCreate}>
                    <Plus />
                    新增第一条资产
                </Button>
            </div>
        );
    }
    return (
        <div className="border-muted-foreground/20 flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                <FileText className="size-4" />
            </div>
            <div className="space-y-0.5">
                <h3 className="font-heading text-sm font-medium">
                    没有匹配的资产
                </h3>
                <p className="text-muted-foreground text-xs">
                    {query && `查询「${query}」`}
                    {query && activeTag && " · "}
                    {activeTag && `标签 #${activeTag}`}
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
                <X />
                清除筛选
            </Button>
        </div>
    );
}
