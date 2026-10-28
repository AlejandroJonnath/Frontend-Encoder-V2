import { Platform } from 'react-native';

// Las credenciales se leen desde variables de entorno EXPO_PUBLIC_*
// Definir en Frontend/.env (nunca commitear ese archivo)
// Los valores hardcodeados son fallback SOLO para desarrollo local.
export const CONFIGURACION = {
  // Credenciales de Supabase para Auth y Storage
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://kxzonorzqvvtakioaypo.supabase.co',
  SUPABASE_CLAVE_ANONIMA: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4em9ub3J6cXZ2dGFraW9heXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDY2OTYsImV4cCI6MjEwODQyMjY5Nn0.2UTJcNpdnUK9lzQvw_jbRvNoXqC-0ufi8Jpzlq_zpNU',

  // URL del Backend en Express.
  // - En producción: URL pública de Render terminada en /api
  // - En desarrollo local: http://192.168.1.2:3000/api
  URL_API_BACKEND: process.env.EXPO_PUBLIC_API_URL || 'https://backend-encoder-v2.onrender.com/api',

  // Lista estricta de idiomas permitidos para traducción con IA
  IDIOMAS_TRADUCCION: [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'Inglés', bandera: '🇺🇸' },
    { codigo: 'fr', nombre: 'Francés', bandera: '🇫🇷' },
    { codigo: 'de', nombre: 'Alemán', bandera: '🇩🇪' },
    { codigo: 'zh', nombre: 'Chino Mandarín', bandera: '🇨🇳' }
  ]
};
