import { useContext, useEffect, useState } from 'react';

import { fetchGtfsStatus, GtfsStatusData, resetGtfsPipeline, runGtfsPipeline } from '../../../communication/backend';
import { SLButton } from '../../common/sl-button';
import ErrorContext from '../../../contexts/error-context';

const RESET_ALLOWED_STATUSES = ['UNZIP_START', 'UNZIP_DONE', 'PARSE_START', 'PARSE_DONE', 'FAILED'];

function statusLabel(status: string): string {
  switch (status) {
    case 'DOWNLOAD_START': return 'Downloading';
    case 'DOWNLOAD_DONE': return 'Download done';
    case 'UNZIP_START': return 'Unzipping';
    case 'UNZIP_DONE': return 'Unzip done';
    case 'PARSE_START': return 'Parsing';
    case 'PARSE_DONE': return 'Done';
    case 'FAILED': return 'Failed';
    default: return status;
  }
}

// Parse "yyyy-MM-dd HH:mm" to Date
function parseTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.split(' ');
  return new Date(`${datePart}T${timePart}:00`);
}

function duration(from: string | null, to: string | null, inProgress: boolean): string {
  if (!from) {
    return '–';
  }
  if (!to) {
    return inProgress ? 'pågår' : '–';
  }
  const diffMs = parseTimestamp(to).getTime() - parseTimestamp(from).getTime();
  if (diffMs < 0) {
    return '–';
  }
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${seconds} s`;
  }
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-800 font-mono">{value}</span>
    </div>
  );
}

export function GtfsStatus() {
  const { setError } = useContext(ErrorContext);
  const [status, setStatus] = useState<GtfsStatusData | null | undefined>(undefined);
  const [resetting, setResetting] = useState(false);
  const [running, setRunning] = useState(false);

  async function loadStatus() {
    const data = await fetchGtfsStatus(setError);
    setStatus(data);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleReset() {
    setResetting(true);
    const ok = await resetGtfsPipeline(setError);
    if (ok) {
      await loadStatus();
    }
    setResetting(false);
  }

  async function handleRunPipeline() {
    setRunning(true);
    const ok = await runGtfsPipeline(setError);
    if (ok) {
      await loadStatus();
    }
    setRunning(false);
  }

  const resetAllowed = status !== null && status !== undefined && RESET_ALLOWED_STATUSES.includes(status.status);
  const runPipelineAllowed = status !== null && status !== undefined && status.status === 'DOWNLOAD_DONE';

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Pipeline status</h2>
        {status === undefined && <p className="text-sm text-gray-500">Loading...</p>}
        {status === null && <p className="text-sm text-gray-500">No data yet.</p>}
        {status && (
          <div className="space-y-1">
            <StatusRow label="Date" value={status.date} />
            <StatusRow label="Status" value={statusLabel(status.status)} />
            {status.errorMessage && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {status.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {status && (
        <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Phase durations</h2>
          <div className="space-y-1">
            <StatusRow
              label="Download"
              value={duration(status.downloadStartTime, status.downloadEndTime, status.status === 'DOWNLOAD_START')}
            />
            <StatusRow
              label="Unzip"
              value={duration(status.unzipStartTime, status.unzipEndTime, status.status === 'UNZIP_START')}
            />
            <StatusRow
              label="Parse"
              value={duration(status.parseStartTime, status.parseEndTime, status.status === 'PARSE_START')}
            />
          </div>
        </div>
      )}

      <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Actions</h2>
        <div className="flex flex-col space-y-2">
          <SLButton onClick={handleRunPipeline} thin disabled={!runPipelineAllowed || running}>
            {running ? 'Running...' : 'Run pipeline'}
          </SLButton>
          <SLButton onClick={handleReset} thin disabled={!resetAllowed || resetting}>
            {resetting ? 'Resetting...' : 'Reset to DOWNLOAD_DONE'}
          </SLButton>
        </div>
        {!resetAllowed && !runPipelineAllowed && status !== undefined && (
          <p className="mt-2 text-xs text-gray-500">
            No actions available for current status.
          </p>
        )}
      </div>
    </div>
  );
}
