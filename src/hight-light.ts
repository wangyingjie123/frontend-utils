/**
 * 匹配整个关键词 不拆分
 * @param text 全部文本
 * @param words 匹配的关键词
 * @param html 高亮部分html标签
 * @returns text
 */
export function highlight(text: string, words: string, html?: string) {
  // 默认的标签，如果没有指定，使用span
  const tag = html || 'span';
  // 匹配每一个特殊字符 ，进行转义
  const specialStr = ['*', '.', '?', '+', '$', '^', '[', ']', '{', '}', '|', '\\', '(', ')', '/', '%'];

  let result = text;
  specialStr.forEach((v) => {
    if (words.indexOf(v) !== -1) {
      result = words.replace(new RegExp(`\\${v}`, 'g'), `\\${v}`);
    }
  });
  // 匹配整个关键词
  const regexp = new RegExp(words, 'g');
  if (regexp.test(text)) {
    result = text.replace(regexp, `<${tag} class="highlight">$&</${tag}>`);
  }
  return result;
}
