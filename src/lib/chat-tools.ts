import {tool, type InferUITools, type UIMessage} from 'ai';
import {z} from 'zod';
import {fileSystemTools} from '@/graph/tools/file/file_tools';
import {knowledgeToolDefs} from '@/lib/knowledge-tools';

export const fileToolDefs = {
    writeFile: tool({
        description: 'Write content to a file in the allowed directory',
        inputSchema: z.object({
            filePath: z.string().describe('Relative path of the file to write'),
            content: z.string().describe('Content to write to the file'),
        }),
        execute: async ({filePath, content}) =>
            fileSystemTools.writeFile(filePath, content),
    }),
    readFile: tool({
        description: 'Read content from a file in the allowed directory',
        inputSchema: z.object({
            filePath: z.string().describe('Relative path of the file to read'),
        }),
        execute: async ({filePath}) =>
            fileSystemTools.readFile(filePath),
    }),
    deletePath: tool({
        description: 'Delete a file or directory in the allowed directory',
        inputSchema: z.object({
            pathToDelete: z.string().describe('Relative path of the file or directory to delete'),
        }),
        execute: async ({pathToDelete}) =>
            fileSystemTools.deletePath(pathToDelete),
    }),
    listDirectory: tool({
        description: 'List contents of a directory in the allowed directory',
        inputSchema: z.object({
            dirPath: z.string().default('.').describe('Relative directory path to list'),
        }),
        execute: async ({dirPath}) =>
            fileSystemTools.listDirectory(dirPath),
    }),
    createDirectory: tool({
        description: 'Create a new directory in the allowed directory',
        inputSchema: z.object({
            dirPath: z.string().describe('Relative path of the directory to create'),
        }),
        execute: async ({dirPath}) =>
            fileSystemTools.createDirectory(dirPath),
    }),
    exists: tool({
        description: 'Check if a file or directory exists in the allowed directory',
        inputSchema: z.object({
            pathToCheck: z.string().describe('Relative path to check'),
        }),
        execute: async ({pathToCheck}) =>
            fileSystemTools.exists(pathToCheck),
    }),
    searchFiles: tool({
        description: 'Search for files by pattern in the allowed directory',
        inputSchema: z.object({
            pattern: z.string().describe('Search pattern (supports * wildcard)'),
            searchDir: z.string().default('.').describe('Relative directory to search in'),
        }),
        execute: async ({pattern, searchDir}) =>
            fileSystemTools.searchFiles(pattern, searchDir),
    }),
};

export {knowledgeToolDefs} from '@/lib/knowledge-tools';

const allToolDefs = {...fileToolDefs, ...knowledgeToolDefs};

export type ToolMessage = UIMessage<
    never,
    never,
    InferUITools<typeof allToolDefs>
>;
