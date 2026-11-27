// oxlint-disable-next-line import/no-duplicates
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api.js';
import type {
  IRange,
  editor as monacoEditorApi
  // oxlint-disable-next-line import/no-duplicates
} from 'monaco-editor/esm/vs/editor/editor.api.js';

function copyRangeToClipboard(
  editorInstance: monacoEditorApi.IStandaloneCodeEditor,
  range: IRange | null | undefined
): void {
  if (!range) return;

  const data = editorInstance.getModel()?.getValueInRange(range);
  if (!data) return;

  const fallbackCopy = () => {
    editorInstance.trigger(
      'copy-selection',
      'editor.action.clipboardCopyAction',
      null
    );
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(data).catch(err => {
      console.error(err);
      fallbackCopy();
    });
  } else {
    fallbackCopy();
  }
}

export function registerCopyActions(
  editorInstance: monacoEditorApi.IStandaloneCodeEditor,
  monaco: Pick<typeof monacoEditor, 'KeyMod' | 'KeyCode'>
): void {
  editorInstance.addAction({
    id: 'copy-selection',
    label: 'Copy Selection',
    precondition: 'editorHasSelection',
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC,
      monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyC
    ],
    contextMenuGroupId: '9_cutcopypaste',
    contextMenuOrder: 2,
    run: () => {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        copyRangeToClipboard(editorInstance, selection);
      }
    }
  });

  editorInstance.addAction({
    id: 'select-all-and-copy',
    label: 'Select All and Copy',
    contextMenuGroupId: '9_cutcopypaste',
    contextMenuOrder: 3,
    run: () => {
      const fullSelection = editorInstance.getModel()?.getFullModelRange();
      if (fullSelection) {
        editorInstance.setSelection(fullSelection);
        copyRangeToClipboard(editorInstance, fullSelection);
      }
    }
  });
}
