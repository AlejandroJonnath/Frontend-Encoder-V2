import { Platform } from 'react-native';

export const CONFIGURACION = {
  // Credenciales de Supabase para Auth y Storage
  SUPABASE_URL: 'https://kxzonorzqvvtakioaypo.supabase.co',
  SUPABASE_CLAVE_ANONIMA: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4em9ub3J6cXZ2dGFraW9heXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDY2OTYsImV4cCI6MjEwODQyMjY5Nn0.2UTJcNpdnUK9lzQvw_jbRvNoXqC-0ufi8Jpzlq_zpNU',

  // URL del Backend en Express:
  // - En Android Emulator: http://10.0.2.2:3000/api
  // - En dispositivo físico con Expo Go: Cambiar por la IP local de tu PC (ej: http://192.168.1.5:3000/api)
  // - En Web o iOS Simulator: http://localhost:3000/api
  URL_API_BACKEND: 'http://192.168.1.2:3000/api',

  // Lista estricta de idiomas permitidos para traducción con IA
  IDIOMAS_TRADUCCION: [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'Inglés', bandera: '🇺🇸' },
    { codigo: 'fr', nombre: 'Francés', bandera: '🇫🇷' },
    { codigo: 'de', nombre: 'Alemán', bandera: '🇩🇪' },
    { codigo: 'zh', nombre: 'Chino Mandarín', bandera: '🇨🇳' }
  ]
};
