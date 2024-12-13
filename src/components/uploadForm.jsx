'use client'

import { useState } from 'react'

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setUploadStatus('');
    setFileUrl('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setUploadStatus('Adicione um arquivo antes de tentar processar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('Processando...');

      const response = await fetch('/api/csv/scrape', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'text/csv',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setFileUrl(`Arquivo gerado: ${result.file_url}`);

        const a = document.createElement('a');
        a.href = result.file_url;
        a.click();
      } else {
        setUploadStatus('Erro ao fazer upload do arquivo. Tente novamente.');
      }
    } catch (error) {
      setUploadStatus('Erro ao fazer upload do arquivo. Tente novamente.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <input type="file" accept=".csv" onChange={handleFileChange} className="bg-foreground text-background rounded-sm" />

        <button type="submit" className="bg-foreground text-background rounded-sm" disabled={!! uploadStatus}>Processar</button>
      </form>

      {uploadStatus && <p className="max-w-96">{uploadStatus}</p>}

      {fileUrl && <p className="max-w-96">{fileUrl}</p>}
    </>
  );
};