import {convertToModelMessages, generateId, streamText, stepCountIs} from 'ai'
import {createDeepSeek} from "@ai-sdk/deepseek";
import {DEEPSEEK_API_KEY} from "./key";
import {createMCPClient} from '@ai-sdk/mcp';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {saveMessages} from '@/lib/chat-store';
import {fileToolDefs, knowledgeToolDefs, type ToolMessage} from '@/lib/chat-tools';
import {seedAssetsIfEmpty} from '@/lib/asset-store';

const deepSeek = createDeepSeek({
    apiKey: DEEPSEEK_API_KEY,
});

const SYSTEM_PROMPT = `你是「知识资产助手」，工作在一个企业内部知识库问答工作台中。

行为规范：
1. 每次回答用户问题前，必须先调用 \`searchKnowledge\` 工具检索知识库。仅在检索结果为空、或命中内容确实无法回答用户问题时，才可以回答"知识库中未找到相关信息"。
2. 回答须严格基于检索到的资产内容；不要引入检索结果以外的事实。
3. 如果检索结果中有多条相关资产，可以调用 \`readAsset\` 读取完整正文。
4. 在回答正文末尾，以 \`[1] [2] [3]\` 的形式列出引用编号，每个编号对应一条被引用的资产。编号顺序与检索/阅读的先后顺序一致。
5. 如果 \`listAssets\` 表明知识库为空，直接告知用户当前知识库无内容。
6. 保持简洁、结构化、有依据。`;

await seedAssetsIfEmpty();

const mcpClient = await createMCPClient({
    transport: new StdioClientTransport({
        command: 'npx',
        args: ["-y", "@upstash/context7-mcp", "--api-key", process.env.CONTEXT7_API_KEY!],
    }),
});
const context7Tools = await mcpClient.tools();

const tools = {
    ...fileToolDefs,
    ...context7Tools,
    ...knowledgeToolDefs
};
export const maxDuration = 30;


export async function POST(request: Request) {
    const {id, messages}: { id?: string; messages: ToolMessage[] } = await request.json();
    const chatId = id ?? messages[0]?.id ?? '';

    const result = streamText({
        model: deepSeek('deepseek-chat'),
        messages: await convertToModelMessages(messages),
        system: SYSTEM_PROMPT,
        tools,
        stopWhen: [stepCountIs(10)],
    });

    return result.toUIMessageStreamResponse({
        originalMessages: messages,
        generateMessageId: generateId,
        onFinish: async ({messages: finalMessages}) => {
            if (chatId) {
                await saveMessages(chatId, finalMessages);
            }
            await mcpClient.close();
        },
    });
}
