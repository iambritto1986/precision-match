import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION } from '../config/version';

export interface VersionData {
  version: string;
  changelog: string[];
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersionData, setNewVersionData] = useState<VersionData | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      // Bypass cache to get the absolute latest version
      const res = await fetch('/version.json?t=' + Date.now());
      if (!res.ok) return;
      
      const data: VersionData = await res.json();
      
      // Determine what version the app currently thinks it is running
      const currentStoredVersion = localStorage.getItem('precision_match_current_version') || APP_VERSION;

      // If remote version differs from our local running version, an update is available!
      if (data.version && data.version !== currentStoredVersion) {
        setNewVersionData(data);
        setUpdateAvailable(true);
      }
    } catch (err) {
      console.error('Failed to check for app updates:', err);
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkForUpdate();

    // Check every 5 minutes (300,000 ms)
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Check whenever the user switches back to this tab
    const handleFocus = () => checkForUpdate();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdate]);

  const triggerUpdate = () => {
    if (newVersionData) {
      // Save the new version so we don't prompt again until the next update
      localStorage.setItem('precision_match_current_version', newVersionData.version);
      
      // Flag that we need to show the changelog for this version after reload
      localStorage.setItem('show_changelog_for_version', newVersionData.version);
      
      // Store the changelog data itself so we don't have to fetch it again purely for the modal
      localStorage.setItem('latest_changelog_data', JSON.stringify(newVersionData.changelog));
      
      // Reload the page to fetch the new JavaScript bundle
      window.location.reload();
    }
  };

  return { updateAvailable, newVersionData, triggerUpdate };
}
