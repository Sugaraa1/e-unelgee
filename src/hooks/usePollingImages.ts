// src/hooks/usePollingImages.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { getClaimImages, UploadedImage } from '../services/imagesService';

const POLL_INTERVAL_MS = 3500; // 3.5 секунд

interface UsePollingImagesResult {
  images:      UploadedImage[];
  isPolling:   boolean;
  isLoading:   boolean;
  allAnalyzed: boolean;
  refresh:     () => Promise<void>;
  setImages:   React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

/**
 * Зургуудыг polling-оор шалгах hook
 *
 * Логик:
 *  1. Mount болмогц нэг удаа fetch хийнэ
 *  2. pending/processing зураг байвал interval-ээр polling хийнэ
 *  3. Бүгд analyzed/failed болмогц polling зогсоно
 *  4. Unmount болмогц cleanup хийнэ (memory leak байхгүй)
 */
export function usePollingImages(
  claimId: string | undefined,
): UsePollingImagesResult {
  const [images, setImages]     = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);

  // ── Нэг удаагийн fetch ──────────────────────────────────────
  const fetchImages = useCallback(async (silent = false) => {
    if (!claimId) return;
    if (!silent) setIsLoading(true);

    try {
      const data = await getClaimImages(claimId);
      if (mountedRef.current) setImages(data);
      return data;
    } catch (err) {
      console.warn('[usePollingImages] fetch error:', err);
      return null;
    } finally {
      if (!silent && mountedRef.current) setIsLoading(false);
    }
  }, [claimId]);

  // ── Polling зогсоох ─────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mountedRef.current) setIsPolling(false);
  }, []);

  // ── Polling эхлүүлэх ────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // давхар эхлүүлэхгүй
    if (mountedRef.current) setIsPolling(true);

    intervalRef.current = setInterval(async () => {
      if (!claimId || !mountedRef.current) {
        stopPolling();
        return;
      }

      try {
        const data = await getClaimImages(claimId);
        if (!mountedRef.current) return;

        setImages(data);

        // Бүгд дууссан эсэх шалгах
        const allDone = data.every(
          (img) => img.status === 'analyzed' || img.status === 'failed',
        );
        if (allDone || data.length === 0) stopPolling();
      } catch {
        // Network алдааг тэвчнэ, polling үргэлжилнэ
      }
    }, POLL_INTERVAL_MS);
  }, [claimId, stopPolling]);

  // ── Mount / unmount ─────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!claimId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      const data = await fetchImages();
      if (!mountedRef.current || !data) return;

      // Pending/processing зураг байвал polling эхлүүл
      const needsPolling = data.some(
        (img) => img.status === 'pending' || img.status === 'processing',
      );
      if (needsPolling) startPolling();
    })();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Шинэ зураг нэмэгдэхэд polling эхлүүл ──────────────────
  useEffect(() => {
    const needsPolling = images.some(
      (img) => img.status === 'pending' || img.status === 'processing',
    );

    if (needsPolling && !intervalRef.current) {
      startPolling();
    } else if (!needsPolling && intervalRef.current) {
      stopPolling();
    }
  }, [images, startPolling, stopPolling]);

  const allAnalyzed =
    images.length > 0 &&
    images.every((img) => img.status === 'analyzed' || img.status === 'failed');

  const refresh = useCallback(async () => {
    await fetchImages(false);
  }, [fetchImages]);

  return { images, isPolling, isLoading, allAnalyzed, refresh, setImages };
}