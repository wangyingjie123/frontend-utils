// promise版
export const loadScript = (url: string, attrs?: Record<string, any>) => {
  if (document.querySelector(`script[src="${url}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const oHead = document.getElementsByTagName('head')[0];
    const oScript = document.createElement('script');
    oScript.type = 'text/javascript';
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        oScript.setAttribute(key, attrs[key]);
      });
    }
    oScript.onload = (e) => {
      resolve(e);
    };
    oScript.onerror = (e) => {
      reject(e);
    };
    oScript.src = url;
    oHead.appendChild(oScript);
  });
};
