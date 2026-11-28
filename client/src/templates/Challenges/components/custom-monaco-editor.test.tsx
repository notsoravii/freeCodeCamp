import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import store from 'store';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api.js';
import CustomMonacoEditor from './custom-monaco-editor';

const mockUpdateOptions = vi.fn();
const mockAddAction = vi.fn();

const { capturedProps } = vi.hoisted(() => ({
  capturedProps: {
    current: null as Record<string, unknown> | null
  }
}));

vi.mock('@loadable/component', () => ({
  default: () =>
    function MockMonacoEditor(props: Record<string, unknown>) {
      capturedProps.current = props;
      return <div data-testid='mock-monaco-editor' />;
    }
}));

vi.mock('@codesandbox/sandpack-react', () => ({
  useActiveCode: () => ({
    code: 'h1 { color: red; }',
    updateCode: vi.fn()
  }),
  useSandpack: () => ({
    sandpack: {
      activeFile: '/styles.css'
    }
  })
}));

describe('<CustomMonacoEditor /> accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clearAll();
    capturedProps.current = null;
  });

  it('disables editContext and configures default auto accessibilitySupport and ariaLabel', () => {
    render(<CustomMonacoEditor />);

    const options = capturedProps.current?.options as Record<string, unknown>;
    expect(options).toMatchObject({
      editContext: false,
      accessibilitySupport: 'auto'
    });
    expect(options.ariaLabel).toBe('aria.editor-a11y-off-non-macos');
  });

  it('enables accessibilitySupport when accessibilityMode is stored as true', () => {
    store.set('accessibilityMode', true);
    render(<CustomMonacoEditor />);

    const options = capturedProps.current?.options as Record<string, unknown>;
    expect(options).toMatchObject({
      editContext: false,
      accessibilitySupport: 'on',
      ariaLabel: 'aria.editor-a11y-on-non-macos'
    });
  });

  it('registers Ctrl/Cmd+E toggle action on mount and toggles accessibilityMode', () => {
    render(<CustomMonacoEditor />);

    const editorDidMount = capturedProps.current?.editorDidMount as (
      ed: unknown,
      monaco: unknown
    ) => void;
    const actions: Record<string, { run: () => void; keybindings?: number[] }> =
      {};
    mockAddAction.mockImplementation(
      (action: { id: string; run: () => void; keybindings?: number[] }) => {
        actions[action.id] = action;
      }
    );

    const mockEditor = {
      updateOptions: mockUpdateOptions,
      addAction: mockAddAction
    } as unknown as monacoEditor.editor.IStandaloneCodeEditor;

    const mockMonaco = {
      KeyMod: { CtrlCmd: 2048, WinCtrl: 256 },
      KeyCode: { KeyE: 35 }
    };

    editorDidMount(mockEditor, mockMonaco);

    expect(mockUpdateOptions).toHaveBeenCalledWith({
      accessibilitySupport: 'auto',
      ariaLabel: 'aria.editor-a11y-off-non-macos'
    });
    expect(actions['toggle-accessibility']?.keybindings).toEqual([
      2048 | 35,
      256 | 35
    ]);

    actions['toggle-accessibility'].run();

    expect(store.get('accessibilityMode')).toBe(true);
    expect(mockUpdateOptions).toHaveBeenLastCalledWith({
      accessibilitySupport: 'on',
      ariaLabel: 'aria.editor-a11y-on-non-macos'
    });
  });
});
