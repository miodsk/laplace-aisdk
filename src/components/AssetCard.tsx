"use client";

import * as React from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Eye,
    FileText,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import type { KnowledgeAsset } from "@/lib/asset-store";

interface AssetCardProps {
    asset: KnowledgeAsset;
    onView: (asset: KnowledgeAsset) => void;
    onEdit: (asset: KnowledgeAsset) => void;
    onDelete: (asset: KnowledgeAsset) => void;
    onTagClick?: (tag: string) => void;
    activeTag?: string | null;
}

const PREVIEW_LIMIT = 200;

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function AssetCard({
    asset,
    onView,
    onEdit,
    onDelete,
    onTagClick,
    activeTag,
}: AssetCardProps) {
    const preview =
        asset.content.length <= PREVIEW_LIMIT
            ? asset.content
            : asset.content.slice(0, PREVIEW_LIMIT).trimEnd() + "…";

    return (
        <Card className="group/card hover:border-foreground/20 hover:shadow-sm gap-2 transition-all">
            <CardHeader>
                <div className="flex items-start gap-3 min-w-0">
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                        <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <CardTitle
                            className="truncate text-[15px] leading-snug"
                            title={asset.title}
                        >
                            {asset.title}
                        </CardTitle>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">
                            {asset.id} · {formatDate(asset.createdAt)} ·{" "}
                            {asset.content.length} 字
                        </p>
                    </div>
                </div>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="资产操作"
                                />
                            }
                        >
                            <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(asset)}>
                                <Eye />
                                查看完整
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(asset)}>
                                <Pencil />
                                编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDelete(asset)}
                            >
                                <Trash2 />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>

            <CardContent>
                <p className="line-clamp-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/75">
                    {preview}
                </p>
            </CardContent>

            <CardContent className="flex flex-wrap items-center gap-1.5 pt-0">
                {asset.tags.length > 0 ? (
                    asset.tags.map((t) => {
                        const isActive = activeTag === t;
                        const baseClass =
                            "cursor-pointer font-normal transition-colors";
                        return (
                            <Badge
                                key={t}
                                variant={isActive ? "default" : "secondary"}
                                className={baseClass}
                                onClick={() => onTagClick?.(t)}
                            >
                                {t}
                            </Badge>
                        );
                    })
                ) : (
                    <span className="text-xs text-muted-foreground/60">
                        暂无标签
                    </span>
                )}
                <Button
                    variant="link"
                    size="xs"
                    className="ml-auto h-6 px-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100"
                    onClick={() => onView(asset)}
                >
                    <Eye />
                    展开
                </Button>
            </CardContent>
        </Card>
    );
}
