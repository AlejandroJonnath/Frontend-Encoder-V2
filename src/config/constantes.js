import { Platform } from 'react-native';

// Las credenciales se leen desde variables de entorno EXPO_PUBLIC_*
// Definir en Frontend/.env (nunca commitear ese archivo)
// Los valores hardcodeados son fallback SOLO para desarrollo local.
export const CONFIGURACION = {
  // Credenciales de Supabase para Auth y Storage
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_CLAVE_ANONIMA: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

  // URL del Backend en Express.
  // - En producción: URL pública de Render terminada en /api
  // - En desarrollo local: http://192.168.1.2:3000/api
  URL_API_BACKEND: process.env.EXPO_PUBLIC_API_URL,

  // Lista estricta de idiomas permitidos para traducción con IA
  IDIOMAS_TRADUCCION: [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'Inglés', bandera: '🇺🇸' },
    { codigo: 'fr', nombre: 'Francés', bandera: '🇫🇷' },
    { codigo: 'de', nombre: 'Alemán', bandera: '🇩🇪' },
    { codigo: 'zh', nombre: 'Chino Mandarín', bandera: '🇨🇳' }
  ]
};
