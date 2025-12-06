import { ActivityLog } from '../types';

const STORAGE_KEY = 'roadguard_logs';

export const addLog = (action: string, details: string, status: 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO'): ActivityLog => {
  const newLog: ActivityLog = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now(),
    action,
    details,
    status
  };

  try {
    const existingLogs = getLogs();
    const updatedLogs = [newLog, ...existingLogs].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error("Failed to save log", e);
  }
  return newLog;
};

export const getLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const clearLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
