import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate() {
  const basePath = '/tmp';
  const editorPath = path.join(basePath, 'editor_path.txt');
  const folderPath = path.join(basePath, 'folder_path.txt');

  // Keep listening to text-editor changes (works for text files)
  vscode.window.onDidChangeActiveTextEditor(() => {
    tryWrite(editorPath, resolveActivePath());
  });

  // Listen for tab changes (captures images, PDFs, custom editors, etc.)
  vscode.window.tabGroups.onDidChangeTabs(() => {
    tryWrite(editorPath, resolveActivePath());
    tryWrite(folderPath, getFolder());
  });

  // Also update when active tab group changes (tab group focus changes)
  vscode.window.tabGroups.onDidChangeTabGroups(() => {
    tryWrite(editorPath, resolveActivePath());
    tryWrite(folderPath, getFolder());
  });

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    tryWrite(folderPath, getFolder());
  });

  vscode.window.onDidChangeWindowState(() => {
    tryWrite(folderPath, getFolder());
  });

  // Initial write
  tryWrite(editorPath, resolveActivePath());
  tryWrite(folderPath, getFolder());
}

function tryWrite(destPath: fs.PathOrFileDescriptor, content: string) {
  try {
    fs.writeFileSync(destPath, content || '');
  } catch (err) {
    console.error('Failed to write to file:', err);
  }
}

/**
 * Resolve the best "active" path:
 * 1) active TextEditor document path (normal text)
 * 2) active Tab's input.uri (images, custom editors, webviews, notebooks)
 * 3) first workspace folder or "~"
 */
function resolveActivePath(): string {
  // 1) If there's an active text editor, use it
  const textEditor = vscode.window.activeTextEditor;
  if (textEditor?.document?.uri) {
    return textEditor.document.uri.fsPath;
  }

  // 2) Try active tab (works for images, custom editors)
  try {
    const activeTab = vscode.window.tabGroups.activeTabGroup?.activeTab;
    if (activeTab && activeTab.input) {
      const input: any = activeTab.input;

      // Common shapes:
      // - TabInputText / TabInputTextDiff: { uri: Uri }
      // - TabInputCustom: { viewType, uri? }
      // - TabInputWebview: maybe no uri
      // Check common properties
      if (input.uri && typeof input.uri.fsPath === 'string') {
        return input.uri.fsPath;
      }
      if (input.resource && input.resource.uri && typeof input.resource.uri.fsPath === 'string') {
        return input.resource.uri.fsPath;
      }

      // some custom inputs expose a 'uri' as a string or object
      if (input.options && input.options.uri && input.options.uri.fsPath) {
        return input.options.uri.fsPath;
      }

      // Last-ditch: if the tab has a label that looks like a file path, return it (not ideal)
      if (typeof (activeTab as any).label === 'string') {
        const lbl = (activeTab as any).label as string;
        // heuristics — only return if it contains a path separator
        if (lbl.includes('/') || lbl.includes('\\')) {
          return lbl;
        }
      }
    }
  } catch (e) {
    // ignore and fall back
  }

  // 3) fallback to workspace folder or ~
  return getFolder();
}

function getFolder(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    // If multi-root, use first workspace folder
    return folders[0].uri.fsPath;
  }
  return '~';
}

export function deactivate() {}
