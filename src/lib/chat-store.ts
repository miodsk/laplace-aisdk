import {promises as fs} from 'fs';
import {join} from 'path';
import type {UIMessage} from 'ai';

export namespace DB {
    export interface Chat {
        id: string;
        messages: UIMessage[];
        createdAt: string;
        updatedAt: string;
    }

    export interface PersistenceData {
        chats: DB.Chat[];
    }
}

const DATA_FILE_PATH = join(process.cwd(), 'data', 'chats.local.json');

async function ensureDataDirectory(): Promise<void> {
    const dataDir = join(process.cwd(), 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, {recursive: true});
    }
}

export async function loadChats(): Promise<DB.Chat[]> {
    try {
        await ensureDataDirectory();
        const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const parsed: DB.PersistenceData = JSON.parse(data);
        return parsed.chats || [];
    } catch {
        return [];
    }
}

export async function saveChats(chats: DB.Chat[]): Promise<void> {
    await ensureDataDirectory();
    const data: DB.PersistenceData = {chats};
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function createChat(
    id: string,
    initialMessages: UIMessage[] = [],
): Promise<DB.Chat> {
    const chats = await loadChats();
    const now = new Date().toISOString();
    const newChat: DB.Chat = {id, messages: initialMessages, createdAt: now, updatedAt: now};
    chats.push(newChat);
    await saveChats(chats);
    return newChat;
}

export async function getChat(chatId: string): Promise<DB.Chat | null> {
    const chats = await loadChats();
    return chats.find(c => c.id === chatId) ?? null;
}

export async function getOrCreateChat(chatId: string): Promise<DB.Chat> {
    return (await getChat(chatId)) ?? (await createChat(chatId));
}

export async function saveMessages<M extends UIMessage = UIMessage>(
    chatId: string,
    messages: M[],
): Promise<DB.Chat | null> {
    const chats = await loadChats();
    const idx = chats.findIndex(c => c.id === chatId);
    if (idx === -1) return null;
    chats[idx]!.messages = messages;
    chats[idx]!.updatedAt = new Date().toISOString();
    await saveChats(chats);
    return chats[idx]!;
}

export async function appendToChatMessages(
    chatId: string,
    messages: UIMessage[],
): Promise<DB.Chat | null> {
    const chats = await loadChats();
    const idx = chats.findIndex(c => c.id === chatId);
    if (idx === -1) return null;
    chats[idx]!.messages = [...chats[idx]!.messages, ...messages];
    chats[idx]!.updatedAt = new Date().toISOString();
    await saveChats(chats);
    return chats[idx]!;
}

export async function deleteChat(chatId: string): Promise<boolean> {
    const chats = await loadChats();
    const filtered = chats.filter(c => c.id !== chatId);
    if (filtered.length === chats.length) return false;
    await saveChats(filtered);
    return true;
}
