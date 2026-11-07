import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { CONFIGURACION } from '../config/constantes';
import { supabase } from '../config/supabase';

const INTERVALO_PING_MS = 12 * 60 * 1000; // 12 minutos (Render suspende a los 15 min)

/**
 * Hook para mantener despiertos el Backend en Render y la conexión de Supabase
 * de forma ultra ligera mientras el usuario tiene la app abierta en primer plano.
 */
export function useKeepAlive() {
  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);

  const ejecutarPingSilencioso = async () => {
    // 1. Ping ultra ligero a Render (/salud)
    const urlSalud = CONFIGURACION.URL_API_BACKEND
      ? CONFIGURACION.URL_API_BACKEND.replace(/\/api\/?$/, '/salud')
      : null;

    if (urlSalud && urlSalud.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        await fetch(urlSalud, {
          method: 'GET',
          signal: controller.signal
        }).catch(() => null);
        clearTimeout(timeout);
      } catch (_) {}
    }

    // 2. Ping ultra ligero a Supabase
    try {
      await supabase.auth.getSession().catch(() => null);
    } catch (_) {}
  };

  useEffect(() => {
    // Primer ping al iniciar la app
    ejecutarPingSilencioso();

    // Programar intervalo continuo cada 12 minutos
    timerRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        ejecutarPingSilencioso();
      }
    }, INTERVALO_PING_MS);

    // Escuchar cambios de estado de la aplicación (foreground / background)
    const suscripcion = AppState.addEventListener('change', (proximoEstado) => {
      if (appStateRef.current.match(/inactive|background/) && proximoEstado === 'active') {
        // La app volvió a primer plano: despertar inmediatamente si fue suspendido
        ejecutarPingSilencioso();
      }
      appStateRef.current = proximoEstado;
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      suscripcion.remove();
    };
  }, []);
}

