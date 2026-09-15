// Turns picked files into data the browser can show before they are uploaded, so a shop
// sees a preview of its photos while filling in the form.

export function fileToDataUrl(file, maxWidth = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(reader.result);
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function filesToDataUrls(files) {
  return Promise.all(Array.from(files || []).map((file) => fileToDataUrl(file)));
}
