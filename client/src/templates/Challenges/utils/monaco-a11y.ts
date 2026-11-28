import store from 'store';
import type { TFunction } from 'i18next';
// oxlint-disable-next-line import/no-duplicates
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api.js';
import type {
  editor as monacoEditorApi
  // oxlint-disable-next-line import/no-duplicates
} from 'monaco-editor/esm/vs/editor/editor.api.js';

export function getEditorA11yLabel(
  t: TFunction,
  editorName: string,
  accessibilityMode: boolean
): string {
  const isMacOS = navigator.userAgent.includes('Mac OS');
  if (accessibilityMode) {
    return isMacOS
      ? t('aria.editor-a11y-on-macos', { editorName })
      : t('aria.editor-a11y-on-non-macos', { editorName });
  }
  return isMacOS
    ? t('aria.editor-a11y-off-macos', { editorName })
    : t('aria.editor-a11y-off-non-macos', { editorName });
}

export function syncEditorAccessibilityMode(
  editorInstance: monacoEditorApi.IStandaloneCodeEditor,
  t: TFunction,
  editorName: string,
  nextMode?: boolean
): boolean {
  const current = Boolean(store.get('accessibilityMode'));
  const accessibilityMode = nextMode ?? current;
  store.set('accessibilityMode', accessibilityMode);

  editorInstance.updateOptions({
    accessibilitySupport: accessibilityMode ? 'on' : 'auto',
    ariaLabel: getEditorA11yLabel(t, editorName, accessibilityMode)
  });

  return accessibilityMode;
}

export function registerAccessibilityToggleAction(
  editorInstance: monacoEditorApi.IStandaloneCodeEditor,
  monaco: Pick<typeof monacoEditor, 'KeyMod' | 'KeyCode'>,
  t: TFunction,
  getEditorName: () => string
): void {
  editorInstance.addAction({
    id: 'toggle-accessibility',
    label: 'Toggle Accessibility Mode',
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE,
      monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyE
    ],
    run: () => {
      const current = Boolean(store.get('accessibilityMode'));
      syncEditorAccessibilityMode(editorInstance, t, getEditorName(), !current);
    }
  });
}
