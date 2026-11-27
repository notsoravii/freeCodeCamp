const { cloneDeep } = require('lodash');

exports.translateComments = (text, lang, dict, codeLang) => {
  const knownComments = Object.keys(dict);
  const config = { knownComments, dict, lang };
  const input = { text };
  switch (codeLang) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return transMultiline(transInline(input, config), config);
    case 'css':
      return transMultiline(input, config);
    case 'py':
    case 'python':
      return transPython(input, config);
    case 'html':
      return transScript(transHTML(transCSS(input, config), config), config);
    default:
      return input;
  }
};

exports.translateCommentsInChallenge = (challenge, lang, dict) => {
  const challClone = cloneDeep(challenge);
  if (challClone?.challengeFiles) {
    challClone.challengeFiles.forEach(challengeFile => {
      if (challengeFile.contents) {
        // It cannot be this.translateComments because 'this' does not exist
        // when imported into an ES module.
        let { text } = exports.translateComments(
          challengeFile.contents,
          lang,
          dict,
          challengeFile.ext
        );
        challengeFile.contents = text;
      }
    });
  }
  return challClone;
};

// bare urls could be interpreted as comments, so we have to lookbehind for
// http:// or https://
function transInline(input, config) {
  return translateGeneric(input, config, '((?<!https?:)//\\s*)', '(\\s*$)');
}

function transMultiline(input, config) {
  return translateGeneric(input, config, '(/\\*\\s*)', '(\\s*\\*/)');
}

// CSS has to be handled separately since it is looking for comments inside tags
function transCSS({ text }, config) {
  const regex = /<style>.*?<\/style>/gms;
  const matches = text.matchAll(regex);

  for (const [match] of matches) {
    let { text: styleText } = transMultiline({ text: match }, config);
    text = text.replace(match, styleText);
  }
  return { text };
}

function transScript({ text }, config) {
  const regex = /<script>.*?<\/script>/gms;
  const matches = text.matchAll(regex);

  for (const [match] of matches) {
    let { text: scriptText } = transMultiline(
      transInline({ text: match }, config),
      config
    );
    text = text.replace(match, scriptText);
  }
  return { text };
}

function transHTML(input, config) {
  return translateGeneric(input, config, '(<!--\\s*)', '(\\s*--!?>)');
}

function transPython({ text }, config) {
  // Match string literals (triple- and single-quoted, with optional prefixes)
  // before '#' comments so hashes inside strings are preserved unchanged.
  const regex =
    /(?:[rRfFbBuU]{0,2})(?:"""(?:\\[\s\S]|[^\\])*?"""|'''(?:\\[\s\S]|[^\\])*?'''|"(?:\\[\s\S]|[^"\\\r\n])*"|'(?:\\[\s\S]|[^'\\\r\n])*')|(#)([ \t]*)([^\r\n]*)/g;

  return {
    text: text.replace(regex, (match, hash, beforeSpaces, rawComment) => {
      if (!hash) return match;
      const trailingMatch = rawComment.match(/([ \t]*)$/);
      const after = trailingMatch ? trailingMatch[1] : '';
      const comment = rawComment.slice(0, rawComment.length - after.length);
      const translated = translateComment(comment, config);
      return translated === null
        ? match
        : `${hash}${beforeSpaces}${translated}${after}`;
    })
  };
}

function translateComment(comment, config) {
  const { knownComments, dict, lang } = config;
  if (knownComments.includes(comment)) {
    return dict[comment][lang];
  }
  if (comment.trim()) {
    throw `The comment
${comment}
does not appear in the comment dictionary.
When updating or adding a comment it must have the same text in the English challenges and the comment dictionary.
`;
  }
  return null;
}

function translateGeneric({ text }, config, regexBefore, regexAfter) {
  const regex = new RegExp(regexBefore + '(.*?)' + regexAfter, 'gms');
  const matches = text.matchAll(regex);

  for (const [match, before, comment, after] of matches) {
    const translated = translateComment(comment, config);
    if (translated !== null) {
      text = text.replace(match, `${before}${translated}${after}`);
    }
  }

  return { text };
}

exports.translateGeneric = translateGeneric;
