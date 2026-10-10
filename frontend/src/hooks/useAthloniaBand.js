/**
 * useAthloniaBand — React hook wrapping AthloniaBandService.
 * Auto-cleans up on unmount. Provides rolling HR averages.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { AthloniaBandService, getAthloniaBandService } from '../services/athloniaBandService';

export function useAthloniaBand() {
  const [supported] = useState(() => AthloniaBandService.isSupported());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState(null);
  const [latest, setLatest] = useState(null);
  const [averageHR, setAverageHR] = useState(0);
  const [maxHR, setMaxHR] = useState(0);
  const [error, setError] = useState(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const svc = getAthloniaBandService();
    serviceRef.current = svc;

    // Sync with any existing connection (singleton survives route changes)
    if (svc.connected) {
      setConnected(true);
      setDeviceName(svc.device?.name || null);
      setLatest(svc.getLatest());
    }

    svc.onPacket = (packet) => {
      setLatest(packet);
    };
    svc.onConnect = (info) => {
      setConnected(true);
      setConnecting(false);
      setDeviceName(info.deviceName);
      setError(null);
    };
    svc.onDisconnect = () => {
      setConnected(false);
      setDeviceName(null);
      setLatest(null);
      setAverageHR(0);
      setMaxHR(0);
    };

    return () => {
      // Keep the singleton connection alive across route changes.
      // Clear only this consumer's callbacks.
      svc.onPacket = null;
      svc.onConnect = null;
      svc.onDisconnect = null;
    };
  }, [supported]);

  // Refresh rolling averages every second
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      const svc = serviceRef.current;
      if (!svc) return;
      setAverageHR(svc.getAverageHR(30));
      setMaxHR(svc.getMaxHR(60));
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const connect = useCallback(async () => {
    const svc = serviceRef.current;
    if (!svc) return;
    if (svc.connected) {
      setConnected(true);
      setDeviceName(svc.device?.name || null);
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await svc.connect();
    } catch (err) {
      setConnecting(false);
      setError(err.message || 'Failed to connect to band');
    }
  }, []);

  const disconnect = useCallback(() => {
    const svc = serviceRef.current;
    if (!svc) return;
    svc.disconnect();
    setConnected(false);
  }, []);

  const resetBuffer = useCallback(() => {
    serviceRef.current?.resetBuffer();
    setLatest(null);
    setAverageHR(0);
    setMaxHR(0);
  }, []);

  return {
    supported, connected, connecting, deviceName, latest,
    averageHR, maxHR, error, connect, disconnect, resetBuffer,
  };
}