import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
} from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';

/** Mapa de fuentes a cargar al iniciar la app. */
export const appFonts = {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
};

/** Hook que indica si las fuentes ya están listas para renderizar. */
export function useAppFonts(): boolean {
  const [loaded] = useFonts(appFonts);
  return loaded;
}
