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

export const imageDownload = (url: string, fileName: string) => {
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        // 将img中的内容画到画布上
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        // 将画布内容转换为Blob
        canvas.toBlob((blob) => {
          // blob转为同源url
          const blobUrl = window.URL.createObjectURL(blob as Blob);
          // 创建a链接
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName || 'download.png'; // 文件名称，不填默认为当前请求名称
          // 触发a链接点击事件，浏览器开始下载文件
          a.click();
          URL.revokeObjectURL(blobUrl);
          resolve('success');
        });
      } catch (e) {
        reject(e);
      }
    };
    img.src = url;
    // 必须设置，否则canvas中的内容无法转换为blob
    img.setAttribute('crossOrigin', 'Anonymous');
  });
};
