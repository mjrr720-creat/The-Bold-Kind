'use client';

import { useRef, useState } from 'react';

export default function UploadButton({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleFile(file: File) {
    setStatus('uploading');
    setMessage('Uploading and processing…');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setStatus('done');
      setMessage(`Added ${json.rowsInserted} orders${json.rowsSkipped ? `, skipped ${json.rowsSkipped} incomplete rows` : ''}.`);
      onUploaded();
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message ?? 'Upload failed');
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        className="btn-primary inline-flex items-center gap-2"
      >
        {status === 'uploading' ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 12.5V3.5M10 3.5L6.5 7M10 3.5L13.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.5 13v1.5A2.5 2.5 0 006 17h8a2.5 2.5 0 002.5-2.5V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload Excel
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {message && (
        <span className={`text-xs ${status === 'error' ? 'text-danger' : 'text-ink/50'}`}>{message}</span>
      )}
    </div>
  );
}
