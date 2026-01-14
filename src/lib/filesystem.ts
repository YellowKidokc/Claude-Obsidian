/**
 * File System Access Layer
 *
 * Provides a unified interface for file system operations,
 * working with both Tauri (desktop) and browser-based storage.
 */

import {
  readDir,
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  remove,
  rename,
  stat,
} from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import type { FileEntry, PipelineFile, Node } from '../types';
import { parseMarkdownFile, serializeToMarkdown, frontmatterToNode } from './frontmatter';

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Open a folder picker dialog
 */
export async function selectVaultFolder(): Promise<string | null> {
  if (!isTauri()) {
    console.warn('Folder selection not available in browser');
    return null;
  }

  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Vault Folder',
  });

  return selected as string | null;
}

/**
 * Read directory contents recursively
 */
export async function readDirectoryTree(path: string): Promise<FileEntry[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const entries = await readDir(path);
    const result: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = `${path}/${entry.name}`;
      const fileEntry: FileEntry = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory,
        expanded: false,
      };

      // For directories, recursively read contents
      if (entry.isDirectory) {
        try {
          fileEntry.children = await readDirectoryTree(fullPath);
        } catch {
          fileEntry.children = [];
        }
      } else {
        // Only include markdown files
        if (!entry.name.endsWith('.md')) {
          continue;
        }

        try {
          const fileStat = await stat(fullPath);
          fileEntry.modified = new Date(fileStat.mtime ?? Date.now());
        } catch {
          fileEntry.modified = new Date();
        }
      }

      result.push(fileEntry);
    }

    // Sort: directories first, then alphabetically
    return result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Failed to read directory:', error);
    return [];
  }
}

/**
 * Read a markdown file and parse it
 */
export async function readMarkdownFile(path: string): Promise<PipelineFile | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const content = await readTextFile(path);
    return parseMarkdownFile(content, path);
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
}

/**
 * Read a file and convert to Node
 */
export async function readNodeFromFile(path: string): Promise<Node | null> {
  const file = await readMarkdownFile(path);
  if (!file) return null;

  return frontmatterToNode(file.frontmatter, file.content);
}

/**
 * Save a node to disk
 */
export async function saveNode(path: string, node: Node): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const content = serializeToMarkdown(node);
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * Save raw markdown content to disk
 */
export async function saveMarkdownFile(path: string, content: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * Create a new markdown file
 */
export async function createNewFile(
  directory: string,
  filename: string,
  initialContent: string = ''
): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  const path = `${directory}/${filename}`;

  try {
    // Check if file already exists
    if (await exists(path)) {
      console.warn('File already exists:', path);
      return null;
    }

    await writeTextFile(path, initialContent);
    return path;
  } catch (error) {
    console.error('Failed to create file:', error);
    return null;
  }
}

/**
 * Create a new directory
 */
export async function createDirectory(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    await mkdir(path, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create directory:', error);
    return false;
  }
}

/**
 * Delete a file or directory
 */
export async function deleteEntry(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    await remove(path, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to delete:', error);
    return false;
  }
}

/**
 * Rename a file or directory
 */
export async function renameEntry(oldPath: string, newPath: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Failed to rename:', error);
    return false;
  }
}

/**
 * Check if a path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    return await exists(path);
  } catch {
    return false;
  }
}

/**
 * Get all markdown files in a directory (flat list)
 */
export async function getAllMarkdownFiles(path: string): Promise<string[]> {
  const tree = await readDirectoryTree(path);
  const files: string[] = [];

  function collectFiles(entries: FileEntry[]) {
    for (const entry of entries) {
      if (entry.isDirectory && entry.children) {
        collectFiles(entry.children);
      } else if (entry.name.endsWith('.md')) {
        files.push(entry.path);
      }
    }
  }

  collectFiles(tree);
  return files;
}

/**
 * Search for files by name pattern
 */
export async function searchFiles(
  rootPath: string,
  query: string
): Promise<FileEntry[]> {
  const allFiles = await readDirectoryTree(rootPath);
  const results: FileEntry[] = [];
  const lowerQuery = query.toLowerCase();

  function searchInEntries(entries: FileEntry[]) {
    for (const entry of entries) {
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        results.push(entry);
      }
      if (entry.isDirectory && entry.children) {
        searchInEntries(entry.children);
      }
    }
  }

  searchInEntries(allFiles);
  return results;
}

/**
 * Build an index of wiki links from a vault
 */
export async function buildWikiLinkIndex(
  vaultPath: string
): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const files = await getAllMarkdownFiles(vaultPath);

  for (const filePath of files) {
    // Extract filename without extension as the link target
    const filename = filePath.split('/').pop()?.replace('.md', '') ?? '';
    index.set(filename.toLowerCase(), filePath);
  }

  return index;
}
