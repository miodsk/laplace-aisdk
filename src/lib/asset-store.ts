import { promises as fs } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';

export interface KnowledgeAsset {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
}

export interface KnowledgeAssetMeta {
    id: string;
    title: string;
    tags: string[];
    createdAt: string;
    file: string;
    size: number;
}

interface IndexFile {
    version: number;
    assets: KnowledgeAssetMeta[];
}

const ASSETS_DIR = join(
    process.cwd(),
    'data',
    'file-system-db.local',
    'assets',
);
const INDEX_FILE = join(ASSETS_DIR, '_index.json');
const INDEX_VERSION = 1;

async function ensureAssetsDir(): Promise<void> {
    try {
        await fs.access(ASSETS_DIR);
    } catch {
        await fs.mkdir(ASSETS_DIR, { recursive: true });
    }
}

async function readIndex(): Promise<IndexFile> {
    await ensureAssetsDir();
    try {
        const data = await fs.readFile(INDEX_FILE, 'utf-8');
        const parsed = JSON.parse(data) as IndexFile;
        if (parsed.version !== INDEX_VERSION) {
            return { version: INDEX_VERSION, assets: parsed.assets ?? [] };
        }
        return parsed;
    } catch {
        return { version: INDEX_VERSION, assets: [] };
    }
}

async function writeIndex(index: IndexFile): Promise<void> {
    await ensureAssetsDir();
    await fs.writeFile(
        INDEX_FILE,
        JSON.stringify(index, null, 2),
        'utf-8',
    );
}

function slugify(title: string): string {
    return (
        title
            .toLowerCase()
            .trim()
            .replace(/[\s\u3000]+/g, '-')
            // keep ascii word chars and CJK
            .replace(/[^\w\u4e00-\u9fa5-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40) || 'asset'
    );
}

function nextNumericSeedId(assets: KnowledgeAssetMeta[]): string {
    const used = new Set(
        assets
            .map((a) => a.id)
            .filter((id) => /^\d+$/.test(id))
            .map((id) => parseInt(id, 10)),
    );
    let n = 1;
    while (used.has(n)) n += 1;
    return String(n).padStart(2, '0');
}

export async function listAssets(): Promise<KnowledgeAsset[]> {
    const index = await readIndex();
    const out: KnowledgeAsset[] = [];
    for (const meta of index.assets) {
        const asset = await readAssetFromDisk(meta);
        if (asset) out.push(asset);
    }
    return out;
}

export async function getAsset(id: string): Promise<KnowledgeAsset | null> {
    const index = await readIndex();
    const meta = index.assets.find((a) => a.id === id);
    if (!meta) return null;
    return readAssetFromDisk(meta);
}

async function readAssetFromDisk(
    meta: KnowledgeAssetMeta,
): Promise<KnowledgeAsset | null> {
    try {
        const content = await fs.readFile(
            join(ASSETS_DIR, meta.file),
            'utf-8',
        );
        return {
            id: meta.id,
            title: meta.title,
            tags: meta.tags,
            createdAt: meta.createdAt,
            content,
        };
    } catch {
        return null;
    }
}

export interface CreateAssetInput {
    title: string;
    content: string;
    tags: string[];
}

export async function createAsset(
    input: CreateAssetInput,
): Promise<KnowledgeAsset> {
    await ensureAssetsDir();
    const id = nanoid(10);
    const slug = slugify(input.title);
    const file = `${id}-${slug}.md`;
    const mdPath = join(ASSETS_DIR, file);
    const createdAt = new Date().toISOString();
    const size = Buffer.byteLength(input.content, 'utf-8');

    await fs.writeFile(mdPath, input.content, 'utf-8');

    try {
        const index = await readIndex();
        index.assets.push({
            id,
            title: input.title,
            tags: input.tags,
            createdAt,
            file,
            size,
        });
        await writeIndex(index);
    } catch (err) {
        await fs.unlink(mdPath).catch(() => undefined);
        throw err;
    }

    return {
        id,
        title: input.title,
        content: input.content,
        tags: input.tags,
        createdAt,
    };
}

export interface UpdateAssetPatch {
    title?: string;
    content?: string;
    tags?: string[];
}

export async function updateAsset(
    id: string,
    patch: UpdateAssetPatch,
): Promise<KnowledgeAsset | null> {
    const index = await readIndex();
    const idx = index.assets.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const meta = index.assets[idx]!;
    let newSize = meta.size;

    if (patch.content !== undefined) {
        newSize = Buffer.byteLength(patch.content, 'utf-8');
        await fs.writeFile(
            join(ASSETS_DIR, meta.file),
            patch.content,
            'utf-8',
        );
    }

    const nextMeta: KnowledgeAssetMeta = {
        ...meta,
        title: patch.title ?? meta.title,
        tags: patch.tags ?? meta.tags,
        size: newSize,
    };
    index.assets[idx] = nextMeta;
    await writeIndex(index);

    return {
        id: nextMeta.id,
        title: nextMeta.title,
        tags: nextMeta.tags,
        createdAt: nextMeta.createdAt,
        content: patch.content ?? (await readContent(meta.file)),
    };
}

async function readContent(file: string): Promise<string> {
    try {
        return await fs.readFile(join(ASSETS_DIR, file), 'utf-8');
    } catch {
        return '';
    }
}

export async function deleteAsset(id: string): Promise<boolean> {
    const index = await readIndex();
    const idx = index.assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    const meta = index.assets[idx]!;
    index.assets.splice(idx, 1);
    await writeIndex(index);

    try {
        await fs.unlink(join(ASSETS_DIR, meta.file));
    } catch {
        // file already gone or unreadable - non-fatal
    }

    return true;
}

interface SeedEntry {
    id: string;
    title: string;
    tags: string[];
    file: string;
    content: string;
}

const SEEDS: SeedEntry[] = [
    {
        id: '01',
        title: 'AIOS 平台介绍',
        tags: ['aios', 'platform', 'agent', '企业'],
        file: '01-aios-platform.md',
        content: `AIOS 是一个面向企业的智能体操作平台。它在统一的工作台中提供四类核心能力：

1. 知识库：将企业内部的文档、流程、案例与产品资料沉淀为可检索的知识资产，供智能体在回答中按需调用与引用。
2. 工具调用：以函数 / MCP 形式把内部系统、第三方 SaaS 与数据源暴露给智能体，每一次调用均可观测、可审计。
3. 工作流编排：通过可视化节点把多步任务拆解为 DAG，支持人工审批、条件分支与失败重试。
4. 多智能体协作：把复杂任务拆给具备不同专长的子 Agent，通过消息与共享上下文协同完成。

AIOS 的目标不是替代业务系统，而是成为这些系统与一线员工之间的智能中介层。`,
    },
    {
        id: '02',
        title: '数字资产知识库',
        tags: ['knowledge', 'document', 'rag', '资产'],
        file: '02-digital-asset-kb.md',
        content: `数字资产知识库是 AIOS 内用于沉淀企业知识的基础组件，承担两类工作：

一、内容沉淀
- 文档：合同、规章、产品手册、销售一图、FAQ。
- 业务流程：售前方案、SOP、审批链。
- 客户案例：脱敏后的成功故事、ROI 数据、复盘。
- 产品说明：版本差异、计费规则、技术参数。

二、智能检索与问答
- 提供全文检索、标签筛选、向量召回等多路召回。
- 检索结果以"引用"形式出现在 Agent 回答中，回答可追溯到原始片段。
- 资产更新走 CRUD 流程，索引与正文分离存储以保证列表性能。

使用建议：标签体系保持扁平（不超过两级），避免同名标题，按业务域划分命名空间。`,
    },
    {
        id: '03',
        title: 'Agent 工作流',
        tags: ['agent', 'workflow', 'observability', 'reliability'],
        file: '03-agent-workflow.md',
        content: `Agent 是 AIOS 内执行任务的主体。一个可靠的 Agent 工作流由以下几部分组成：

1. 任务拆解
   把用户请求拆成可独立验证的子任务，定义子任务之间的依赖。

2. 工具调用
   子任务落到具体工具上执行，例如搜索知识库、查询数据库、调用外部 API。工具必须是无状态或可重入的。

3. 上下文记忆
   短期上下文用消息历史，长期记忆走知识库 / 状态文件，避免无限堆叠导致成本失控。

4. 结果校验
   每一步产出都需要校验：工具调用是否成功、是否符合约束、是否需要回滚或重试。

5. 可观测性
   全链路 Trace：用户输入 → 任务拆解 → 工具调用 → 中间结果 → 最终答复。每条 Trace 包含 trace_id、actor、duration、status、引用。

6. 权限控制
   Agent 持有的工具集是它能力的上限；不同业务域的 Agent 看到的工具与知识库应当隔离。

可靠性 = 可观测 + 可校验 + 可重试。三者缺一就会变成"看起来很聪明的玩具"。`,
    },
];

export async function seedAssetsIfEmpty(): Promise<void> {
    const index = await readIndex();
    if (index.assets.length > 0) return;
    await ensureAssetsDir();
    const now = new Date().toISOString();
    for (const seed of SEEDS) {
        const filePath = join(ASSETS_DIR, seed.file);
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, seed.content, 'utf-8');
        }
        index.assets.push({
            id: seed.id,
            title: seed.title,
            tags: seed.tags,
            createdAt: now,
            file: seed.file,
            size: Buffer.byteLength(seed.content, 'utf-8'),
        });
    }
    await writeIndex(index);
}
