import React, { useState, useEffect, useRef } from 'react';
import { versionControl } from '../../services/versionControl';
import { useCanvas } from '../../hooks/useCanvas';
import { useWallet } from '../../contexts/WalletContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';

interface Version {
  version: number;
  timestamp: number;
  changedBy: string;
  changeDescription: string;
  data: any;
}

interface VersionHistoryPanelProps {
  designId: string;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ designId, onClose }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { loadCanvas } = useCanvas(canvasContainerRef);
  const { address } = useWallet();

  useEffect(() => {
    loadVersionHistory();
  }, [designId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const history = await versionControl.getVersionHistory(designId);
      setVersions(history);
      setError(null);
    } catch (err) {
      setError('Failed to load version history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: number) => {
    setSelectedVersion(version);
  };

  const handleRollback = async (version: number) => {
    try {
      setLoading(true);
      await versionControl.rollbackToVersion(designId, version, address || '');
      // Reload canvas with rolled back version
      const data = await versionControl.getVersion(designId, version);
      if (data) {
        await loadCanvas(data.data);
      }
      setError(null);
      onClose();
    } catch (err) {
      setError('Failed to rollback version');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Version History</h2>
        <button onClick={onClose} className="text-gray-500">
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {versions.map((version) => (
          <div 
            key={version.version}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedVersion === version.version 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleVersionSelect(version.version)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">Version {version.version}</div>
              <div className="text-sm text-gray-500">{formatDate(version.timestamp)}</div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              By: {version.changedBy}
            </div>
            <div className="text-sm">{version.changeDescription}</div>

            {selectedVersion === version.version && (
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handleRollback(version.version)}
                  disabled={loading}
                >
                  Rollback to this version
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
