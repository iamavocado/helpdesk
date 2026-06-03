import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DB_KEY = 'dozzier.db.key';

/**
 * Obtiene (o genera la primera vez) la clave de cifrado de la base local.
 * La clave se genera con CSPRNG y se guarda en almacenamiento seguro; nunca
 * se deriva de datos predecibles ni se hardcodea. La consume el adaptador
 * SQLCipher en el build nativo. Ver SECURITY.md §5.
 */
export async function getOrCreateDbEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DB_KEY);
  if (existing) return existing;

  const bytes = Crypto.getRandomBytes(32); // 256 bits
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await SecureStore.setItemAsync(DB_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}
