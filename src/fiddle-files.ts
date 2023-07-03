import * as vscode from 'vscode';
import * as fiddleFilesUtil from './util/fiddle-files';
import * as state from './state';
import * as config from './config';

const filePathToViewColumn: Map<string, vscode.ViewColumn> = new Map();

export function updateFiddleFileOpenedContext(editor: vscode.TextEditor) {
  if (!editor || !editor.document || editor.document.languageId !== 'clojure') {
    return;
  }
  void vscode.commands.executeCommand(
    'setContext',
    'calva:activeEditorIsFiddle',
    fiddleFilesUtil.isFiddleFile(
      editor.document.fileName,
      state.getProjectRootUri().fsPath,
      config.getConfig().fiddleFilePaths
    )
  );
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      updateFiddleFileOpenedContext(editor);
      if (editor && editor.document && editor.document.languageId === 'clojure') {
        filePathToViewColumn.set(editor.document.fileName, editor.viewColumn);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('calva.fiddleFilePaths')) {
        updateFiddleFileOpenedContext(vscode.window.activeTextEditor);
      }
    })
  );
  updateFiddleFileOpenedContext(vscode.window.activeTextEditor);
}

function openFile(filePath: string) {
  const fileUri: vscode.Uri = vscode.Uri.file(filePath);
  return vscode.workspace.openTextDocument(fileUri).then((doc) =>
    vscode.window.showTextDocument(doc, {
      preserveFocus: false,
      viewColumn: filePathToViewColumn.get(filePath) || null,
    })
  );
}

function showConfirmationDialog(prompt: string, file: string, button: string) {
  return vscode.window.showInformationMessage(prompt, { modal: true, detail: file }, button);
}

async function createNewFile(filePath: string) {
  const fileUri = vscode.Uri.file(filePath);
  const dir = vscode.Uri.file(filePath.substring(0, filePath.lastIndexOf('/')));
  await vscode.workspace.fs.createDirectory(dir);
  const ws = new vscode.WorkspaceEdit();
  ws.createFile(fileUri);
  await vscode.workspace.applyEdit(ws);
}

async function askToCreateANewFile(filePath: string) {
  const answer = await showConfirmationDialog(
    `The file does not exist. Do you want to create it?`,
    vscode.workspace.asRelativePath(filePath),
    'Create'
  );
  if (answer === 'Create') {
    void createNewFile(filePath).then(() => {
      void openFile(filePath);
    });
  }
}

export function openFiddleForSourceFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document || editor.document.languageId !== 'clojure') {
    return;
  }
  const sourceFilePath = editor.document.fileName;
  const projectRootPath = state.getProjectRootUri().fsPath;
  const fiddleFilePaths = config.getConfig().fiddleFilePaths;
  const fiddleFilePath = fiddleFilesUtil.getFiddleForSourceFile(
    sourceFilePath,
    projectRootPath,
    fiddleFilePaths
  );

  const fiddleFileUri = vscode.Uri.file(fiddleFilePath);
  const relativeFiddleFilePath = vscode.workspace.asRelativePath(fiddleFileUri);
  void vscode.workspace.findFiles(relativeFiddleFilePath).then((files) => {
    if (!files.length) {
      void askToCreateANewFile(fiddleFilePath);
    } else {
      void openFile(files[0].fsPath);
    }
  });
}

export async function openSourceFileForFiddle() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document || editor.document.languageId !== 'clojure') {
    return;
  }
  const filePath = editor.document.fileName;
  const projectRootPath = state.getProjectRootUri().fsPath;
  const fiddleFilePaths = config.getConfig().fiddleFilePaths;
  const sourceFilePath = await fiddleFilesUtil.getSourceForFiddleFile(
    filePath,
    projectRootPath,
    fiddleFilePaths,
    vscode.workspace
  );

  const sourceFileUri = vscode.Uri.file(sourceFilePath);
  const relativeSourceFilePath = vscode.workspace.asRelativePath(sourceFileUri);
  void vscode.workspace.findFiles(relativeSourceFilePath).then((files) => {
    if (files.length) {
      void openFile(files[0].fsPath);
    } else {
      void vscode.window.showInformationMessage(
        'The source file for this fiddle does not exist. You need to create it manually.',
        'OK'
      );
    }
  });
}
