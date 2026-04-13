import { useContext, useState } from 'react';

import {
  GtfsDownloadResponse,
  GtfsFileInfo,
  gtfsPocDownload,
  gtfsPocListFiles,
  gtfsPocUnzip,
  GtfsUnzipResponse,
} from '../../../communication/backend';
import { SLButton } from '../../common/sl-button';
import ErrorContext from '../../../contexts/error-context';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  if (bytes >= 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return bytes + ' B';
}

function FileTable({ files }: { files: GtfsFileInfo[] }) {
  return (
    <table className="w-full text-sm text-gray-800 mt-2">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="text-left py-1">Fil</th>
          <th className="text-right py-1">Storlek</th>
        </tr>
      </thead>
      <tbody>
        {files.map(f => (
          <tr key={f.name} className="border-b border-gray-200">
            <td className="py-1 font-mono text-xs">{f.name}</td>
            <td className="py-1 text-right font-mono text-xs">{formatBytes(f.sizeBytes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function GtfsPoc() {
  const { setError } = useContext(ErrorContext);
  const [downloading, setDownloading] = useState(false);
  const [unzipping, setUnzipping] = useState(false);
  const [listing, setListing] = useState(false);
  const [downloadResult, setDownloadResult] = useState<GtfsDownloadResponse | null>(null);
  const [unzipResult, setUnzipResult] = useState<GtfsUnzipResponse | null>(null);
  const [files, setFiles] = useState<GtfsFileInfo[] | null>(null);

  async function handleDownload() {
    setDownloading(true);
    const result = await gtfsPocDownload(setError);
    setDownloadResult(result);
    setDownloading(false);
  }

  async function handleUnzip() {
    setUnzipping(true);
    const result = await gtfsPocUnzip(setError);
    setUnzipResult(result);
    setUnzipping(false);
  }

  async function handleListFiles() {
    setListing(true);
    const result = await gtfsPocListFiles(setError);
    setFiles(result ? result.files : null);
    setListing(false);
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">1. Ladda ner GTFS-zip</h2>
        <SLButton onClick={handleDownload} thin disabled={downloading}>
          {downloading ? 'Laddar ner...' : 'Ladda ner'}
        </SLButton>
        {downloadResult && (
          <div className="mt-2 text-sm text-gray-700">
            {downloadResult.skipped
              ? <span>Fil finns redan ({formatBytes(downloadResult.fileSizeBytes)}), hoppades över.</span>
              : <span>
                  Nedladdad: {formatBytes(downloadResult.fileSizeBytes)}
                  {downloadResult.downloadDurationMs !== null && ` på ${downloadResult.downloadDurationMs} ms`}
                </span>
            }
          </div>
        )}
      </div>

      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">2. Packa upp zip</h2>
        <SLButton onClick={handleUnzip} thin disabled={unzipping}>
          {unzipping ? 'Packar upp...' : 'Packa upp'}
        </SLButton>
        {unzipResult && (
          <div className="mt-2 text-sm text-gray-700">
            <span>{unzipResult.files.length} filer extraherade på {unzipResult.unzipDurationMs} ms</span>
            <FileTable files={unzipResult.files} />
          </div>
        )}
      </div>

      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">3. Lista filer i /tmp/sl</h2>
        <SLButton onClick={handleListFiles} thin disabled={listing}>
          {listing ? 'Listar...' : 'Lista filer'}
        </SLButton>
        {files !== null && (
          <div className="mt-2 text-sm text-gray-700">
            <span>{files.length} filer</span>
            <FileTable files={files} />
          </div>
        )}
      </div>
    </div>
  );
}
