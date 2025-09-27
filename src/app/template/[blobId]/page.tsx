'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fabric } from '@/lib/fabric';
import { useCanvas } from '@/hooks/useCanvas';
import { encryptedStorage } from '@/services/encryptedStorage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

export default function PublicDesignView() {
  const { blobId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvas } = useCanvas(containerRef);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDesign = async () => {
      try {
        if (!blobId || typeof blobId !== 'string') {
          throw new Error('Invalid blob ID');
        }

        if (!canvas) {
          return; // Canvas not ready yet
        }

        // Load the public design
        const design = await encryptedStorage.loadPublicDesign(blobId);
        
        if (canvas instanceof fabric.Canvas) {
          canvas.loadFromJSON(design, () => {
            canvas.renderAll();
            setLoading(false);
          });
        }
      } catch (err) {
        console.error('Failed to load design:', err);
        setError(err instanceof Error ? err.message : 'Failed to load design');
        setLoading(false);
      }
    };

    if (canvas) {
      loadDesign();
    }
  }, [blobId, canvas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Public Design View</h1>
        <p className="text-gray-600">Viewing design: {blobId}</p>
      </div>
      <div ref={containerRef} className="border rounded-lg overflow-hidden">
        <canvas id="canvas" />
      </div>
    </div>
  );
}