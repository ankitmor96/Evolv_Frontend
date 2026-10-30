import { useSyncExternalStore } from 'react';
import {
  getThemePreference,
  setThemePreference,
  subscribeTheme,
} from '../../services/themeService.js';

export default function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getThemePreference);
  return { theme, setTheme: setThemePreference };
}