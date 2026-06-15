"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Save } from "lucide-react";
import type { KnowledgeAsset } from "@/lib/asset-store";

export type AssetFormMode = "create" | "edit";

export interface AssetFormValues {
    title: string;
    content: string;
    tags: string[];
}

interface AssetFormProps {
    mode: AssetFormMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: KnowledgeAsset;
    onSubmit: (values: AssetFormValues) => Promise<void>;
}

function valuesFromAsset(a: KnowledgeAsset): AssetFormValues {
    return {
        title: a.title,
        content: a.content,
        tags: [...a.tags],
    };
}

function parseTagsInput(raw: string): string[] {
    return raw
        .split(/[,，;；\n]/g)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

export function AssetForm({
    mode,
    open,
    onOpenChange,
    initialValues,
    onSubmit,
}: AssetFormProps) {
    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [tagsRaw, setTagsRaw] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) return;
        if (mode === "edit" && initialValues) {
            const v = valuesFromAsset(initialValues);
            setTitle(v.title);
            setContent(v.content);
            setTagsRaw(v.tags.join(", "));
        } else {
            setTitle("");
            setContent("");
            setTagsRaw("");
        }
        setError(null);
    }, [open, mode, initialValues]);

    const titleError =
        title.trim().length === 0 ? "标题不能为空" :
        title.length > 120 ? "标题不能超过 120 字" : null;

    const contentError =
        content.trim().length === 0 ? "内容不能为空" : null;

    const tagsPreview = React.useMemo(
        () =>
            parseTagsInput(tagsRaw).slice(0, 12).map((t) => t.toLowerCase()),
        [tagsRaw],
    );

    const canSubmit =
        !submitting && titleError === null && contentError === null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                title: title.trim(),
                content,
                tags: parseTagsInput(tagsRaw).map((t) => t.toLowerCase()),
            });
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setSubmitting(false);
        }
    }

    const isCreate = mode === "create";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl"
                showCloseButton={!submitting}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? "新增知识资产" : "编辑知识资产"}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? "向知识库添加一条新的资产。Title 与 Content 必填，Tags 用逗号或换行分隔。"
                            : "修改资产内容。Tags 留空则清空标签。"}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3"
                >
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="asset-title"
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Title <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="asset-title"
                            value={title}
                            onChange={(e) => setTitle(e.currentTarget.value)}
                            placeholder="例如：AIOS 平台介绍"
                            disabled={submitting}
                            maxLength={120}
                            aria-invalid={titleError !== null}
                        />
                        {titleError && (
                            <p className="text-xs text-destructive">
                                {titleError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="asset-content"
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Content <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            id="asset-content"
                            value={content}
                            onChange={(e) => setContent(e.currentTarget.value)}
                            placeholder="写入正文。多段、空行、Markdown 都可。"
                            rows={10}
                            disabled={submitting}
                            aria-invalid={contentError !== null}
                            className="font-mono text-[13px] leading-relaxed"
                        />
                        {contentError && (
                            <p className="text-xs text-destructive">
                                {contentError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="asset-tags"
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Tags{" "}
                            <span className="text-muted-foreground/70">
                                （用 , 或换行分隔，≤ 12 个）
                            </span>
                        </label>
                        <Input
                            id="asset-tags"
                            value={tagsRaw}
                            onChange={(e) => setTagsRaw(e.currentTarget.value)}
                            placeholder="aios, platform, 企业"
                            disabled={submitting}
                        />
                        {tagsPreview.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                预览：{tagsPreview.join(" · ")}
                            </p>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <Spinner />
                            ) : isCreate ? (
                                <Plus />
                            ) : (
                                <Save />
                            )}
                            {submitting
                                ? "保存中…"
                                : isCreate
                                  ? "新增"
                                  : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
