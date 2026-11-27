import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { editor as monacoEditorApi } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { registerCopyActions } from './editor-copy-actions';

const mockMonaco = {
  KeyMod: {
    CtrlCmd: 2048,
    WinCtrl: 256
  },
  KeyCode: {
    KeyC: 33
  }
} as unknown as Parameters<typeof registerCopyActions>[1];

describe('registerCopyActions', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true
    });
  });

  function setupEditor({
    selectedText = 'const x = 1;',
    fullText = 'const x = 1;\nconst y = 2;',
    isEmptySelection = false
  } = {}) {
    const actions = new Map<string, monacoEditorApi.IActionDescriptor>();
    const fullRange = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 13
    };
    const selection = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 13,
      isEmpty: () => isEmptySelection
    };

    const editorMock = {
      addAction: vi.fn((descriptor: monacoEditorApi.IActionDescriptor) => {
        actions.set(descriptor.id, descriptor);
        return { dispose: vi.fn() };
      }),
      getSelection: vi.fn(() => selection),
      setSelection: vi.fn(),
      trigger: vi.fn(),
      getModel: vi.fn(() => ({
        getFullModelRange: () => fullRange,
        getValueInRange: (range: typeof fullRange) =>
          range === fullRange ? fullText : selectedText
      }))
    };

    registerCopyActions(
      editorMock as unknown as monacoEditorApi.IStandaloneCodeEditor,
      mockMonaco
    );

    return { actions, editorMock, fullRange };
  }

  it('registers copy-selection and select-all-and-copy actions with keybindings', () => {
    const { actions } = setupEditor();

    const copySelection = actions.get('copy-selection');
    expect(copySelection).toBeDefined();
    expect(copySelection?.precondition).toBe('editorHasSelection');
    expect(copySelection?.contextMenuGroupId).toBe('9_cutcopypaste');
    expect(copySelection?.contextMenuOrder).toBe(2);
    expect(copySelection?.keybindings).toEqual([
      mockMonaco.KeyMod.CtrlCmd | mockMonaco.KeyCode.KeyC,
      mockMonaco.KeyMod.WinCtrl | mockMonaco.KeyCode.KeyC
    ]);

    const selectAllAndCopy = actions.get('select-all-and-copy');
    expect(selectAllAndCopy).toBeDefined();
    expect(selectAllAndCopy?.contextMenuGroupId).toBe('9_cutcopypaste');
    expect(selectAllAndCopy?.contextMenuOrder).toBe(3);
  });

  it('copies only the active selection when non-empty', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    const { actions, editorMock } = setupEditor({
      selectedText: 'const x = 1;',
      isEmptySelection: false
    });

    await actions.get('copy-selection')?.run(editorMock as never);
    expect(writeText).toHaveBeenCalledWith('const x = 1;');
  });

  it('does not write to clipboard when selection is empty', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    const { actions, editorMock } = setupEditor({ isEmptySelection: true });
    await actions.get('copy-selection')?.run(editorMock as never);

    expect(writeText).not.toHaveBeenCalled();
    expect(editorMock.trigger).not.toHaveBeenCalled();
  });

  it('falls back to Monaco clipboardCopyAction when navigator.clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });

    const { actions, editorMock } = setupEditor({
      selectedText: 'fallback text',
      isEmptySelection: false
    });

    await actions.get('copy-selection')?.run(editorMock as never);

    expect(editorMock.trigger).toHaveBeenCalledWith(
      'copy-selection',
      'editor.action.clipboardCopyAction',
      null
    );
  });

  it('selects all text and copies full content on select-all-and-copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    const { actions, editorMock, fullRange } = setupEditor({
      fullText: 'full editor content'
    });

    await actions.get('select-all-and-copy')?.run(editorMock as never);

    expect(editorMock.setSelection).toHaveBeenCalledWith(fullRange);
    expect(writeText).toHaveBeenCalledWith('full editor content');
  });
});
