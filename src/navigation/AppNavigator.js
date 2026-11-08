import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useAlerta } from '../context/AlertContext';
import { AuthNavigator } from './AuthNavigator';
import { OperationNavigator } from './OperationNavigator';
import TermsAndPrivacyModal from '../components/TermsAndPrivacyModal';
import { supabase } from '../config/supabase';
import { CONFIGURACION } from '../config/constantes';
import { theme } from '../theme/shadcn';

/**
 * Orquestador principal de navegación y guardián de autenticación.
 * Garantiza que ninguna pantalla de operaciones sea montada sin sesión válida
 * y exige la aceptación obligatoria de Términos y Políticas en el primer inicio (Google o Registro).
 */
export function AppNavigator() {
  const { usuario, cargando, cerrarSesion } = useAuth();
  const { mostrarExito, mostrarErrorOperacion } = useAlerta();

  const [verificandoConsentimiento, setVerificandoConsentimiento] = useState(true);
  const [tieneConsentimiento, setTieneConsentimiento] = useState(true);
  const [procesandoTerminos, setProcesandoTerminos] = useState(false);

  useEffect(() => {
    if (!usuario?.id) {
      setVerificandoConsentimiento(false);
      setTieneConsentimiento(true);
      return;
    }

    const revisarConsentimiento = async () => {
      try {
        setVerificandoConsentimiento(true);
        // Consultar si el usuario ya aceptó previamente los términos en user_consents
        const { data, error } = await supabase
          .from('user_consents')
          .select('id')
          .eq('user_id', usuario.id)
          .maybeSingle();

        if (error) {
          console.warn('[Consentimiento Guard] Aviso consultando user_consents:', error.message);
          setTieneConsentimiento(true);
        } else {
          // Si no existe registro, es primer ingreso (ej. Google OAuth por primera vez)
          setTieneConsentimiento(!!data);
        }
      } catch (err) {
        console.warn('[Consentimiento Guard] Excepción verificando consentimiento:', err.message);
        setTieneConsentimiento(true);
      } finally {
        setVerificandoConsentimiento(false);
      }
    };

    revisarConsentimiento();
  }, [usuario?.id]);

  const manejarAceptarConsentimiento = async () => {
    try {
      setProcesandoTerminos(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        await axios.post(
          `${CONFIGURACION.API_BASE_URL}/auth/consentimiento`,
          { policyVersion: '1.0.0', termsVersion: '1.0.0' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setTieneConsentimiento(true);
      mostrarExito(
        '¡Términos Aceptados!',
        'Bienvenido a EncoderGoti. Tus preferencias de privacidad han sido registradas.'
      );
    } catch (err) {
      console.error('[Consentimiento Guard] Error al registrar aceptación:', err.message);
      mostrarErrorOperacion(
        'Error',
        'No se pudo registrar la aceptación: ' + (err.response?.data?.mensaje || err.message)
      );
    } finally {
      setProcesandoTerminos(false);
    }
  };

  const manejarRechazarConsentimiento = async () => {
    try {
      setProcesandoTerminos(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        try {
          await axios.post(
            `${CONFIGURACION.API_BASE_URL}/auth/rollback-registration`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (apiErr) {
          console.warn('[Consentimiento Guard] Aviso en rollback:', apiErr.message);
        }
      }

      await cerrarSesion();
      setTieneConsentimiento(true);
      mostrarExito(
        'Registro Cancelado',
        'Has rechazado las políticas y términos. Tu cuenta y datos temporales han sido eliminados.'
      );
    } catch (err) {
      await cerrarSesion();
      setTieneConsentimiento(true);
    } finally {
      setProcesandoTerminos(false);
    }
  };

  if (cargando || (usuario && verificandoConsentimiento)) {
    return (
      <View style={estilos.cargandoContenedor}>
        <ActivityIndicator size="large" color={theme.colors.ring} />
      </View>
    );
  }

  // Si no hay usuario autenticado, renderizar exclusivamente el flujo de autenticación
  if (!usuario) {
    return <AuthNavigator />;
  }

  // Si el usuario está autenticado pero aún no acepta términos (primer login con Google o nuevo usuario)
  if (!tieneConsentimiento) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <TermsAndPrivacyModal
          visible={true}
          cargando={procesandoTerminos}
          onAceptar={manejarAceptarConsentimiento}
          onRechazar={manejarRechazarConsentimiento}
        />
      </View>
    );
  }

  // Si el usuario está autenticado y tiene consentimiento, renderizar el flujo de operaciones
  return <OperationNavigator />;
}

const estilos = StyleSheet.create({
  cargandoContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
