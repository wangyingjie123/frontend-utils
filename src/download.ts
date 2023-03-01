/**
 * 下载服务器文件
 * @param src 文件路径
 * @param fileName 文件名
 */
export function linkDownload(link: string, fileName: string) {
  const a = document.createElement('a');
  a.href = link;
  a.download = fileName;
  // 触发a链接点击事件，浏览器开始下载文件
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
