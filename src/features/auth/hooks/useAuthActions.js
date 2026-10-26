import { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAlerta } from '../../../context/AlertContext';

/**
 * Hook centralizado para las acciones de autenticación.
 * Encapsula login, registro y recuperación de contraseña con
 * manejo de errores integrado vía AlertContext.
 */
export function useAuthActions() {
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion, registrarUsuario, recuperarContrasena } = useAuth();
  const {
    mostrarErrorCampos,
    mostrarErrorContrasena,
    mostrarErrorContrasenaDebil,
    mostrarErrorContrasenasNoCoinciden,
    mostrarErrorOperacion,
    mostrarExito,
  } = useAlerta();

  const login = useCallback(async ({ email, password, onOlvide }) => {
    if (!email || !password) {
      mostrarErrorCampos('Por favor ingresa tu correo electrónico y contraseña.');
      return false;
    }
    try {
      setCargando(true);
      await iniciarSesion(email, password);
      return true;
    } catch (err) {
      mostrarErrorContrasena(err.message || 'Verifica tus credenciales de acceso.', onOlvide);
      return false;
    } finally {
      setCargando(false);
    }
  }, [iniciarSesion, mostrarErrorCampos, mostrarErrorContrasena]);

  const registro = useCallback(async ({ nombre, apellido, username, email, password, confirmPassword, onExito }) => {
    if (!nombre || !apellido || !username || !email || !password) {
      mostrarErrorCampos('Por favor completa todos los campos del formulario.');
      return false;
    }
    if (password.length < 6) {
      mostrarErrorContrasenaDebil();
      return false;
    }
    if (password !== confirmPassword) {
      mostrarErrorContrasenasNoCoinciden();
      return false;
    }
    try {
      setCargando(true);
      await registrarUsuario({ nombre, apellido, username, email, password });
      mostrarExito(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Revisa tu bandeja de entrada si se requiere confirmación por correo.',
        onExito
      );
      return true;
    } catch (err) {
      mostrarErrorOperacion('Error al registrar', err.message || 'No se pudo completar el registro.');
      return false;
    } finally {
      setCargando(false);
    }
  }, [registrarUsuario, mostrarErrorCampos, mostrarErrorContrasenaDebil, mostrarErrorContrasenasNoCoinciden, mostrarErrorOperacion, mostrarExito]);

  const recuperar = useCallback(async ({ email, onExito }) => {
    if (!email) {
      mostrarErrorCampos('Ingresa tu correo electrónico para restablecer la clave.');
      return false;
    }
    try {
      setCargando(true);
      await recuperarContrasena(email);
      mostrarExito(
        'Enlace Enviado',
        'Hemos enviado las instrucciones para restablecer tu contraseña. Revisa también tu carpeta de spam.',
        onExito
      );
      return true;
    } catch (err) {
      mostrarErrorOperacion('Error al enviar correo', err.message || 'No se pudo enviar el correo de recuperación.');
      return false;
    } finally {
      setCargando(false);
    }
  }, [recuperarContrasena, mostrarErrorCampos, mostrarErrorOperacion, mostrarExito]);

  return { cargando, login, registro, recuperar };
}
