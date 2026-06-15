"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";
import type { KnowledgeAsset } from "@/lib/asset-store";

interface DeleteAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: KnowledgeAsset | null;
    onConfirm: () => Promise<void>;
}

export function DeleteAssetDialog({
    open,
    onOpenChange,
    asset,
    onConfirm,
}: DeleteAssetDialogProps) {
    const [deleting, setDeleting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setError(null);
        }
    }, [open]);

    async function handleConfirm() {
        if (!asset) return;
        setDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                showCloseButton={!deleting}
            >
                <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogDescription>
                        将永久删除资产
                        {asset && (
                            <>
                                {" "}
                                <span className="font-medium text-foreground">
                                    「{asset.title}」
                                </span>
                            </>
                        )}
                        。索引与文件都会被移除，此操作不可撤销。
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={deleting || !asset}
                    >
                        {deleting ? <Spinner /> : <Trash2 />}
                        {deleting ? "删除中…" : "删除"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
