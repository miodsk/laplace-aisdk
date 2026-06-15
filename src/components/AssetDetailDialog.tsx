"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, Tag } from "lucide-react";
import type { KnowledgeAsset } from "@/lib/asset-store";

interface AssetDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: KnowledgeAsset | null;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AssetDetailDialog({
    open,
    onOpenChange,
    asset,
}: AssetDetailDialogProps) {
    if (!asset) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl" />
            </Dialog>
        );
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 sm:max-w-3xl">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                            <FileText className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="leading-tight">
                                {asset.title}
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                <span className="font-mono">
                                    id · {asset.id}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(asset.createdAt)}
                                </span>
                                <span>{asset.content.length} 字</span>
                            </DialogDescription>
                        </div>
                    </div>
                    {asset.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <Tag className="text-muted-foreground size-3" />
                            {asset.tags.map((t) => (
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
                </DialogHeader>
                <ScrollArea className="-mx-2 flex-1 px-2">
                    <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
                        {asset.content}
                    </pre>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
