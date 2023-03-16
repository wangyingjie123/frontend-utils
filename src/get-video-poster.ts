export const getVideoBase64 = (url: string) => {
  return new Promise((resolve) => {
    // let dataURL = '';
    const width = 400;
    const height = 224;
    const video = document.createElement('video');
    video.setAttribute('useCORS', 'true'); // 解决跨域
    video.setAttribute('crossOrigin', 'anonymous');
    video.width = width;
    video.height = height;
    video.setAttribute('preload', 'auto');
    video.setAttribute('src', url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const canvasCtx = canvas.getContext('2d');

    video.addEventListener('loadeddata', () => {
      const img = new Image();
      const type = 'image/png';
      const encoderOptions = 0.92;
      img.onload = () => {
        canvasCtx!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgsrc = canvas.toDataURL(type, encoderOptions).replace(type, 'image/octet-stream');
        img.src = imgsrc;
        resolve(imgsrc);
      };
      img.setAttribute('crossOrigin', 'Anonymous');
    });
  });
};
