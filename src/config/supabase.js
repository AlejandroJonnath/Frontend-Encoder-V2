import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIGURACION } from './constantes';

export const supabase = createClient(
  CONFIGURACION.SUPABASE_URL,
  CONFIGURACION.SUPABASE_CLAVE_ANONIMA,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);
