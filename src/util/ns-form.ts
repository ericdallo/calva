import * as path from 'path';
import * as tokenCursor from '../cursor-doc/token-cursor';
import * as lexer from '../cursor-doc/clojure-lexer';
import * as model from '../cursor-doc/model';

export function isPrefix(parentPath: string, filePath: string): boolean {
  const relative = path.relative(parentPath, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function pathToNs(filePath: string): string {
  const extName: string = path.extname(filePath);
  return filePath
    .substring(0, filePath.length - extName.length)
    .replace(/[/\\]/g, '.')
    .replace(/_/g, '-');
}

export function resolveNsName(sourcePaths: string[], filePath: string): string {
  if (sourcePaths) {
    for (const sourcePath of sourcePaths) {
      if (isPrefix(sourcePath, filePath)) {
        const relative = path.relative(sourcePath, filePath);
        return pathToNs(relative);
      }
    }
  }
  return pathToNs(path.basename(filePath));
}

export function nsFromCursorDoc(
  cursorDoc: model.EditableDocument,
  p: number = cursorDoc.selection.active
): string | null {
  const cursor: tokenCursor.LispTokenCursor = cursorDoc.getTokenCursor(p);
  cursor.backwardWhitespace(true);
  if (cursor.atTopLevel(true)) {
    while (cursor.backwardSexp()) {
      const nsCheckCursor = cursor.clone();
      nsCheckCursor.downList();
      nsCheckCursor.forwardWhitespace(true);
      const token = nsCheckCursor.getToken();
      if (token.type === 'id' && token.raw == 'ns') {
        nsCheckCursor.forwardSexp(true, true, true);
        nsCheckCursor.forwardWhitespace(true);
        const nsToken = nsCheckCursor.getToken();
        if (nsToken.type === 'id') {
          return nsToken.raw;
        }
      }
    }
  } else {
    cursor.backwardList();
    cursor.backwardUpList();
    cursor.backwardWhitespace(true);
    if (cursor.atStart()) {
      return null;
    } else {
      return nsFromCursorDoc(cursorDoc, cursor.offsetStart);
    }
  }
  return null;
}

export function nsFromText(text: string, p = text.length): string | null {
  const stringDoc: model.StringDocument = new model.StringDocument(text);
  return nsFromCursorDoc(stringDoc, p);
}
