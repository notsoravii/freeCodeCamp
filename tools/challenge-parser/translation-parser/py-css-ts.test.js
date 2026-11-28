import { describe, expect, it } from 'vitest';
import { translateComments } from './index';

const dict = {
  'Single comment': { spanish: 'Comentario único', english: 'Single comment' },
  'Inline comment': {
    spanish: 'Comentario en línea',
    english: 'Inline comment'
  },
  'Multiline comment': {
    spanish: 'Comentario multilínea',
    english: 'Multiline comment'
  },
  'First comment': { spanish: 'Primer comentario', english: 'First comment' },
  'Second comment': {
    spanish: 'Segundo comentario',
    english: 'Second comment'
  },
  "Don't translate me? No, translate me!": {
    spanish: 'Tradúceme!',
    english: "Don't translate me? No, translate me!"
  }
};

describe('translateComments for py, css, ts, and tsx', () => {
  it('translates single-line Python comments and preserves quotes inside comments', () => {
    const text = `# Single comment
x = 1 # Inline comment
# Don't translate me? No, translate me!`;
    const result = translateComments(text, 'spanish', dict, 'py');
    expect(result.text).toBe(`# Comentario único
x = 1 # Comentario en línea
# Tradúceme!`);
  });

  it('also supports the "python" language tag and consecutive comments', () => {
    const text = `# First comment
# Second comment
#   `;
    const result = translateComments(text, 'spanish', dict, 'python');
    expect(result.text).toBe(`# Primer comentario
# Segundo comentario
#   `);
  });

  it('ignores "#" characters inside Python single, double, raw, and triple-quoted strings', () => {
    const text = `hex_color = '#ffffff' # Single comment
url = "https://example.com/#section"
raw_str = r'pattern # here'
multi = """
# not a comment
"""
single_multi = '''
# also not a comment
'''`;
    const result = translateComments(text, 'spanish', dict, 'py');
    expect(result.text).toBe(`hex_color = '#ffffff' # Comentario único
url = "https://example.com/#section"
raw_str = r'pattern # here'
multi = """
# not a comment
"""
single_multi = '''
# also not a comment
'''`);
  });

  it('throws on unknown Python comments', () => {
    expect(() =>
      translateComments('# Unknown python comment', 'spanish', dict, 'py')
    ).toThrow(/does not appear in the comment dictionary/);
  });

  it('translates CSS multiline comments and throws on unknown CSS comments', () => {
    const text = `body {
  /* Single comment */
  color: red;
}
/*
Multiline comment
*/`;
    const result = translateComments(text, 'spanish', dict, 'css');
    expect(result.text).toBe(`body {
  /* Comentario único */
  color: red;
}
/*
Comentario multilínea
*/`);

    expect(() =>
      translateComments('/* Unknown CSS comment */', 'spanish', dict, 'css')
    ).toThrow(/does not appear in the comment dictionary/);
  });

  it('translates inline and multiline comments for ts and tsx files', () => {
    const tsCode = `// Single comment
/* Multiline comment */
const x: number = 1;`;
    const tsResult = translateComments(tsCode, 'spanish', dict, 'ts');
    expect(tsResult.text).toBe(`// Comentario único
/* Comentario multilínea */
const x: number = 1;`);

    const tsxCode = `// Inline comment
const App = () => <div>Hello</div>;`;
    const tsxResult = translateComments(tsxCode, 'spanish', dict, 'tsx');
    expect(tsxResult.text).toBe(`// Comentario en línea
const App = () => <div>Hello</div>;`);
  });
});
