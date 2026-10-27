import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';

// Permite que WebBrowser complete el ciclo de redirección OAuth
WebBrowser.maybeCompleteAuthSession();

// Parser auxiliar para extraer parámetros tanto del fragmento '#' como de '?'
const extraerParametrosDeUrl = (url) => {
  const params = {};
  if (!url) return params;

  const procesarSegmento = (str) => {
    if (!str) return;
    str.split('&').forEach((par) => {
      const indiceIgual = par.indexOf('=');
      if (indiceIgual !== -1) {
        const clave = par.substring(0, indiceIgual);
        const valor = par.substring(indiceIgual + 1);
        try {
          params[decodeURIComponent(clave)] = decodeURIComponent(valor);
        } catch {
          params[clave] = valor;
        }
      }
    });
  };

  if (url.includes('#')) {
    procesarSegmento(url.split('#')[1]);
  }
  if (url.includes('?')) {
    const sinHash = url.split('?')[1].split('#')[0];
    procesarSegmento(sinHash);
  }

  return params;
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Guard para evitar el bucle infinito de Google OAuth:
  // WebBrowser.openAuthSessionAsync Y Linking.addEventListener disparan simultáneamente
  // con la misma URL de callback — procesandoUrlRef evita que se procese dos veces.
  const procesandoUrlRef = useRef(null);

  useEffect(() => {
    // 1. Obtener sesión activa al iniciar
    const obtenerSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUsuario(session.user);
          await cargarPerfil(session.user.id);
        }
      } catch (err) {
        console.error('Error obteniendo sesión:', err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerSesion();

    // 2. Escuchar cambios de autenticación en tiempo real
    // INITIAL_SESSION lo maneja obtenerSesion() — se omite aquí para evitar doble cargarPerfil
    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (evento === 'INITIAL_SESSION') return;
      if (session?.user) {
        setUsuario(session.user);
        await cargarPerfil(session.user.id);
      } else {
        setUsuario(null);
        setPerfil(null);
      }
      setCargando(false);
    });

    // 3. Escuchar URLs de retorno OAuth entrantes vía deep link
    const manejarUrlEntrante = async (evento) => {
      const url = evento?.url;
      if (url && (url.includes('access_token') || url.includes('code=') || url.includes('error='))) {
        try {
          console.log('[Auth Google] URL interceptada vía Linking:', url);
          await procesarUrlAuth(url);
        } catch (err) {
          console.error('[Auth Google] Error procesando URL de Linking:', err.message);
        }
      }
    };

    const subscripcionLinking = Linking.addEventListener('url', manejarUrlEntrante);
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('access_token') || url.includes('code=') || url.includes('error='))) {
        manejarUrlEntrante({ url });
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
      subscripcionLinking?.remove();
    };
  }, []);

  // Carga los datos adicionales desde public.profiles
  const cargarPerfil = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setPerfil(data);
      }
    } catch (err) {
      console.warn('No se pudo cargar el perfil detallado:', err.message);
    }
  };

  // Normaliza y traduce los errores más frecuentes de Supabase Auth
  const traducirErrorAuth = (err) => {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) {
      return new Error('El correo electrónico o la contraseña ingresados no coinciden con ninguna cuenta.');
    }
    if (msg.includes('User already registered')) {
      return new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }
    if (msg.includes('Password should be at least 6 characters')) {
      return new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    if (msg.includes('Email not confirmed')) {
      return new Error('Tu correo aún no ha sido confirmado. Por favor revisa tu bandeja de entrada.');
    }
    return new Error(msg || 'Ocurrió un error en la autenticación.');
  };

  // Iniciar sesión con correo y contraseña
  const iniciarSesion = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw traducirErrorAuth(error);
    return data;
  };

  // Registro de usuario con nombre, apellido, username, correo y contraseña
  const registrarUsuario = async ({ nombre, apellido, username, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: nombre.trim(),
          last_name: apellido.trim(),
          username: username.trim().toLowerCase(),
        }
      }
    });
    if (error) throw traducirErrorAuth(error);
    return data;
  };

  // Enviar correo de recuperación de contraseña ("Olvidaste tu contraseña")
  const recuperarContrasena = async (email) => {
    const redirectUrl = obtenerRedirectUri();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${redirectUrl}/reset-password`
    });
    if (error) throw error;
    return data;
  };

  // Procesa tokens o código OAuth recibido desde el navegador o deep link
  // Guard procesandoUrlRef: evita el bucle infinito cuando ambos canales
  // (WebBrowser + Linking) intentan procesar la misma URL simultáneamente.
  const procesarUrlAuth = async (url) => {
    if (!url) return null;

    // Evitar doble procesamiento de la misma URL de callback
    if (procesandoUrlRef.current === url) {
      console.log('[Auth Google] URL ya en proceso, duplicado ignorado.');
      return null;
    }
    procesandoUrlRef.current = url;

    try {
      console.log('[Auth Google] Procesando URL de retorno OAuth...');
      const params = extraerParametrosDeUrl(url);

      if (params.error_description || params.error) {
        throw new Error(params.error_description || params.error || 'Error en la autorización de Google');
      }

      // Flujo con fragmento de URL (Tokens directos)
      if (params.access_token) {
        console.log('[Auth Google] Tokens detectados, estableciendo sesión con Supabase...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        if (sessionError) throw traducirErrorAuth(sessionError);

        if (sessionData?.session?.user) {
          setUsuario(sessionData.session.user);
          await cargarPerfil(sessionData.session.user.id);
        }
        return sessionData;
      }

      // Flujo PKCE (Código de autorización)
      if (params.code) {
        console.log('[Auth Google] Código PKCE detectado, intercambiando por sesión...');
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (sessionError) throw traducirErrorAuth(sessionError);

        if (sessionData?.session?.user) {
          setUsuario(sessionData.session.user);
          await cargarPerfil(sessionData.session.user.id);
        }
        return sessionData;
      }

      console.warn('[Auth Google] La URL no contiene ni access_token ni code:', url);
      return null;
    } catch (err) {
      console.error('[Auth Google] Error en procesarUrlAuth:', err.message);
      throw err;
    } finally {
      // Limpiar el guard después de 5s para permitir futuros logins
      setTimeout(() => {
        if (procesandoUrlRef.current === url) {
          procesandoUrlRef.current = null;
        }
      }, 5000);
    }
  };

  // Determina la URL de redirección exacta según el entorno (Expo Go vs APK Standalone)
  const obtenerRedirectUri = () => {
    // 1. Detectar si estamos en Expo Go obteniendo el host del Metro Bundler
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.manifest?.debuggerHost;

    if (hostUri) {
      return `exp://${hostUri}`;
    }

    // 2. Probar si makeRedirectUri() automático devuelve un esquema exp://
    try {
      const uriAuto = makeRedirectUri();
      if (uriAuto && (uriAuto.startsWith('exp://') || uriAuto.startsWith('http://'))) {
        return uriAuto;
      }
    } catch {
      // Continuar con los siguientes fallbacks
    }

    // 3. Si estamos en modo desarrollo (__DEV__), Expo Go SIEMPRE requiere esquema exp://
    // En Expo Go, un esquema personalizado como encodergoti:// no es registrado por el OS
    if (__DEV__) {
      return 'exp://192.168.1.2:8081';
    }

    // 4. En APK compilado independiente / producción:
    return makeRedirectUri({ scheme: 'encodergoti' });
  };

  // Iniciar sesión con Google OAuth mediante navegador integrado
  const iniciarSesionConGoogle = async () => {
    const redirectUrl = obtenerRedirectUri();
    console.warn('[Auth Google] Redirect URI generada para OAuth:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw traducirErrorAuth(error);
    if (!data?.url) throw new Error('No se pudo obtener la URL de autorización de Google.');

    console.log('[Auth Google] Abriendo navegador con URL de Supabase...');
    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    console.log('[Auth Google] Resultado WebBrowser:', resultado.type);

    if (resultado.type === 'success' && resultado.url) {
      return await procesarUrlAuth(resultado.url);
    }

    // En Android / Expo Go, al redireccionar por deep link, WebBrowser suele reportar 'dismiss'
    // aunque la sesión ya haya sido procesada vía Linking.addEventListener
    if (resultado.type === 'cancel' || resultado.type === 'dismiss') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuario(session.user);
        await cargarPerfil(session.user.id);
        return { session };
      }
      return null;
    }

    return null;
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUsuario(null);
    setPerfil(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        perfil,
        cargando,
        iniciarSesion,
        iniciarSesionConGoogle,
        registrarUsuario,
        recuperarContrasena,
        cerrarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
