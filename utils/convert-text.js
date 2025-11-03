import * as OpenCC from 'opencc-js';
import config from '../config/index.js';

/**
 * Convert Markdown formatting to LINE-compatible format
 * LINE doesn't support native Markdown, so we convert it to readable text
 */
const convertMarkdownToLine = (text) => {
  let converted = text;

  // First, remove GPT Assistant file citation markers
  // Patterns like 【4:0†source】, 【citation_id†filename】, [1], [2] etc.
  converted = converted.replace(/【[^】]*†[^】]*】/g, '');  // Remove 【...†...】
  converted = converted.replace(/\s*\[\d+\]\s*/g, ' ');     // Remove [1], [2], etc.
  converted = converted.replace(/\s*\[\d+:\d+†[^\]]*\]/g, ''); // Remove [4:0†source]
  
  // Convert bold: **text** or __text__ -> 【text】
  converted = converted.replace(/\*\*(.+?)\*\*/g, '【$1】');
  converted = converted.replace(/__(.+?)__/g, '【$1】');

  // Convert italic: *text* or _text_ -> 《text》(keep simple, LINE doesn't support italic)
  // We skip single * or _ to avoid conflicts with other uses
  
  // Convert headers: ## Header -> ▸ Header
  converted = converted.replace(/^###\s+(.+)$/gm, '▸ $1');
  converted = converted.replace(/^##\s+(.+)$/gm, '▸▸ $1');
  converted = converted.replace(/^#\s+(.+)$/gm, '▸▸▸ $1');

  // Convert bullet points: - item or * item -> • item
  converted = converted.replace(/^[\-\*]\s+(.+)$/gm, '• $1');

  // Convert numbered lists: 1. item -> 1️⃣ item (but keep simple)
  converted = converted.replace(/^(\d+)\.\s+(.+)$/gm, '$1. $2');

  // Convert code blocks: ```code``` -> 「code」
  converted = converted.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```(\w*\n)?/, '').replace(/```$/, '');
    return `「${code.trim()}」`;
  });

  // Convert inline code: `code` -> 「code」
  converted = converted.replace(/`([^`]+)`/g, '「$1」');

  // Convert links: [text](url) -> text (url)
  converted = converted.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)');

  // Convert horizontal rules: --- or *** -> ─────────
  converted = converted.replace(/^(\*\*\*|---|\-\-\-)$/gm, '─────────');

  // Remove excessive blank lines (more than 2)
  converted = converted.replace(/\n{3,}/g, '\n\n');

  return converted;
};

const convertText = (text) => {
  // First convert Markdown formatting
  let converted = convertMarkdownToLine(text);

  // Then handle traditional/simplified Chinese conversion
  if (config.APP_LANG === 'zh_TW') {
    const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });
    return converter(converted);
  }
  if (config.APP_LANG === 'zh_CN') {
    const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
    return converter(converted);
  }
  return converted;
};

export default convertText;
