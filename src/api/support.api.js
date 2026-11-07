import axios from 'axios';
import { CONFIGURACION } from '../config/constantes';
import { supabase } from '../config/supabase';

/**
 * Obtiene las cabeceras de autorización con el token Bearer actual de Supabase.
 */
async function obtenerCabecerasAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token || ''}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Envía una nueva incidencia en modo reporte al sistema de soporte.
 * @param {Object} datosTicket
 */
export async function crearTicketSoporte(datosTicket) {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.post(
    `${CONFIGURACION.API_BASE_URL}/support/tickets`,
    datosTicket,
    { headers: cabeceras }
  );
  return respuesta.data;
}

/**
 * Consulta la lista de tickets de soporte creados por el usuario autenticado.
 */
export async function obtenerMisTickets() {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.get(
    `${CONFIGURACION.API_BASE_URL}/support/my-tickets`,
    { headers: cabeceras }
  );
  return respuesta.data;
}

/**
 * Solicita una copia de seguridad y exportación completa de los datos del usuario.
 */
export async function exportarDatosUsuario() {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.get(
    `${CONFIGURACION.API_BASE_URL}/user/backup`,
    { headers: cabeceras }
  );
  return respuesta.data;
}

/**
 * Solicita la eliminación definitiva de la cuenta del usuario y sus datos asociados.
 */
export async function eliminarCuentaUsuario() {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.delete(
    `${CONFIGURACION.API_BASE_URL}/user/account`,
    { headers: cabeceras }
  );
  return respuesta.data;
}

/**
 * Consulta estadísticas de uso para el panel de administración.
 */
export async function obtenerEstadisticasAdmin() {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.get(
    `${CONFIGURACION.API_BASE_URL}/admin/estadisticas`,
    { headers: cabeceras }
  );
  return respuesta.data;
}

/**
 * Consulta el monitoreo de salud y caídas del sistema.
 */
export async function obtenerMonitoreoAdmin() {
  const cabeceras = await obtenerCabecerasAuth();
  const respuesta = await axios.get(
    `${CONFIGURACION.API_BASE_URL}/admin/monitoreo`,
    { headers: cabeceras }
  );
  return respuesta.data;
}

