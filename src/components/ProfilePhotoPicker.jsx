import { useEffect, useId, useRef, useState } from 'react';

export default function ProfilePhotoPicker({ value, onChange }) {
  const inputId = useId();
  const captureId = `${inputId}-capture`;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera capture is not supported by this browser. Choose a file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError('Camera access was blocked. Allow camera permission or choose a file instead.');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    onChange(canvas.toDataURL('image/jpeg', 0.88));
    stopCamera();
  };

  const readPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Profile photo (optional)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor={inputId} className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-500 hover:bg-slate-50">
          Choose file
        </label>
        <button type="button" onClick={openCamera} className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-500 hover:bg-slate-50">
          Capture photo
        </button>
      </div>
      <input id={inputId} type="file" accept="image/*" onChange={readPhoto} className="sr-only" />
      <input id={captureId} type="file" accept="image/*" capture="user" onChange={readPhoto} className="sr-only" />
      {cameraError && <p className="mt-2 text-sm text-rose-600">{cameraError}</p>}
      {cameraOpen && (
        <div className="mt-3 max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
          <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-slate-900 object-cover" />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={takePhoto} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Take photo</button>
            <button type="button" onClick={stopCamera} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}
      {value && <img src={value} alt="Profile preview" className="mt-3 h-20 w-20 rounded-full border border-slate-200 object-cover shadow-sm" />}
    </div>
  );
}
