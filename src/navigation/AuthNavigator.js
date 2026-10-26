import React, { useState } from 'react';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';

/**
 * Navegador del flujo de autenticación (Login, Registro y Recuperación).
 * Importa directamente desde la ubicación canónica en features/auth/screens/.
 */
export function AuthNavigator() {
  const [ruta, setRuta] = useState('login'); // 'login' | 'registro' | 'olvidaste'

  if (ruta === 'registro') {
    return <RegisterScreen onIrALogin={() => setRuta('login')} />;
  }

  if (ruta === 'olvidaste') {
    return <ForgotPasswordScreen onVolverALogin={() => setRuta('login')} />;
  }

  return (
    <LoginScreen
      onIrARegistro={() => setRuta('registro')}
      onIrAOlvidasteContrasena={() => setRuta('olvidaste')}
    />
  );
}
