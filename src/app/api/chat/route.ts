import {convertToModelMessages, streamText, type UIMessage, stepCountIs, tool, InferUITools} from 'ai'
import {createDeepSeek} from "@ai-sdk/deepseek";
import {DEEPSEEK_API_KEY} from "./key";
import {fileSystemTools} from '@/graph/tools/file/file_tools';
import {z} from 'zod';
import {createMCPClient} from '@ai-sdk/mcp';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {getChat, saveMessages} from '@/lib/chat-store';

const deepSeek = createDeepSeek({
    apiKey: DEEPSEEK_API_KEY,
});

const SYSTEM_PROMPT = `你的名字叫派蒙，是提瓦特大陆的导游`;

const mcpClient = await createMCPClient({
    transport: new StdioClientTransport({
        command: 'npx',
        args: ["-y", "@upstash/context7-mcp", "--api-key", process.env.CONTEXT7_API_KEY!],
    }),
});
const context7Tools = await mcpClient.tools();

const tools = {
    writeFile: tool(
        {
            description: 'Write content to a file in the allowed directory',
            inputSchema: z.object({
                filePath: z.string().describe('Relative path of the file to write'),
                content: z.string().describe('Content to write to the file'),
            }),
            execute: async ({filePath, content}) =>
                fileSystemTools.writeFile(filePath, content),
        }
    ),
    readFile: tool(
        {
            description: 'Read content from a file in the allowed directory',
            inputSchema: z.object({
                filePath: z.string().describe('Relative path of the file to read'),
            }),
            execute: async ({filePath}) =>
                fileSystemTools.readFile(filePath),
        }
    ),
    deletePath: tool(
        {
            description: 'Delete a file or directory in the allowed directory',
            inputSchema: z.object({
                pathToDelete: z.string().describe('Relative path of the file or directory to delete'),
            }),
            execute: async ({pathToDelete}) =>
                fileSystemTools.deletePath(pathToDelete),
        }
    ),
    listDirectory: tool(
        {
            description: 'List contents of a directory in the allowed directory',
            inputSchema: z.object({
                dirPath: z.string().default('.').describe('Relative directory path to list'),
            }),
            execute: async ({dirPath}) =>
                fileSystemTools.listDirectory(dirPath),
        }
    ),
    createDirectory: tool(
        {
            description: 'Create a new directory in the allowed directory',
            inputSchema: z.object({
                dirPath: z.string().describe('Relative path of the directory to create'),
            }),
            execute: async ({dirPath}) =>
                fileSystemTools.createDirectory(dirPath),
        }
    ),
    exists: tool(
        {
            description: 'Check if a file or directory exists in the allowed directory',
            inputSchema: z.object({
                pathToCheck: z.string().describe('Relative path to check'),
            }),
            execute: async ({pathToCheck}) =>
                fileSystemTools.exists(pathToCheck),
        }
    ),
    searchFiles: tool({
        description: 'Search for files by pattern in the allowed directory',
        inputSchema: z.object({
            pattern: z.string().describe('Search pattern (supports * wildcard)'),
            searchDir: z.string().default('.').describe('Relative directory to search in'),
        }),
        execute: async ({pattern, searchDir}) =>
            fileSystemTools.searchFiles(pattern, searchDir),
    }),
    ...context7Tools
}
export const maxDuration = 30;
export type ToolMessage = UIMessage<
    never,
    never,
    InferUITools<typeof tools>
>;


export async function POST(request: Request) {
    const { id, messages }: { id?: string; messages: ToolMessage[] } = await request.json();

    const chatId = id ?? messages[0]?.id ?? '';
    const existing = chatId ? await getChat(chatId) : null;
    const allMessages: UIMessage[] = existing
        ? [...existing.messages, ...messages.filter(m => !existing.messages.some(e => e.id === m.id))]
        : messages;

    const result = streamText({
        model: deepSeek('deepseek-chat'),
        messages: await convertToModelMessages(allMessages),
        system: SYSTEM_PROMPT,
        tools,
        stopWhen: [stepCountIs(10)],
    });

    return result.toUIMessageStreamResponse({
        originalMessages: allMessages,
        onFinish: async ({ messages: finalMessages }) => {
            if (chatId) {
                await saveMessages(chatId, finalMessages as unknown as ToolMessage[]);
            }
            await mcpClient.close();
        },
    });
}