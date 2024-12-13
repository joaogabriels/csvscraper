import Link from 'next/link';

import UploadForm from '../components/uploadForm';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-3xl text-center sm:text-left">CSV Scraper</h1>

        <ol className="list-inside list-decimal text-sm text-center sm:text-left">
          <li className="mb-2">Faça o upload do arquivo de template.</li>
          <li>Aguarde o download do arquivo com os dados coletados</li>
        </ol>

        <UploadForm />
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        Desenvolvido por:

        <Link href="https://github.com/joaogabriels/csvscraper" target='_blank'>
          João Gabriel
        </Link>
      </footer>
    </div>
  );
}
