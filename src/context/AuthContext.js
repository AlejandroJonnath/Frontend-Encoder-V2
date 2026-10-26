import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

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
    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (session?.user) {
        setUsuario(session.user);
        await cargarPerfil(session.user.id);
      } else {
        setUsuario(null);
        setPerfil(null);
      }
      setCargando(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'pdfoperations://reset-password'
    });
    if (error) throw error;
    return data;
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
