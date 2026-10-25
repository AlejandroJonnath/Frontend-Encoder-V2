import React, { createContext, useContext, useState, useCallback } from 'react';
import { ErrorModal } from '../components/ui/ErrorModal';

const AlertContext = createContext({});

export function AlertProvider({ children }) {
  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: 'error',
    titulo: '',
    mensaje: '',
    textoBoton: 'Entendido',
    onConfirmar: null,
    textoBotonSecundario: null,
    onBotonSecundario: null,
  });

  const cerrarAlerta = useCallback(() => {
    setAlerta(prev => ({ ...prev, visible: false }));
  }, []);

  const mostrarAlerta = useCallback((config) => {
    setAlerta({
      visible: true,
      tipo: config.tipo || 'error',
      titulo: config.titulo || 'Atención',
      mensaje: config.mensaje || '',
      textoBoton: config.textoBoton || 'Entendido',
      onConfirmar: () => {
        cerrarAlerta();
        if (config.onConfirmar) config.onConfirmar();
      },
      textoBotonSecundario: config.textoBotonSecundario || null,
      onBotonSecundario: config.onBotonSecundario
        ? () => {
            cerrarAlerta();
            config.onBotonSecundario();
          }
        : null,
    });
  }, [cerrarAlerta]);

  // Presets para errores comunes con arquitectura y diseño idéntico:

  /** Error cuando faltan campos por rellenar */
  const mostrarErrorCampos = useCallback((mensaje = 'Por favor completa todos los campos requeridos para continuar.') => {
    mostrarAlerta({
      tipo: 'campos',
      titulo: 'Campos Incompletos',
      mensaje,
      textoBoton: 'Completar campos',
    });
  }, [mostrarAlerta]);

  /** Error de contraseña incorrecta o credenciales */
  const mostrarErrorContrasena = useCallback((mensaje = 'La contraseña o el correo electrónico no coinciden con nuestros registros.', onRecuperar) => {
    mostrarAlerta({
      tipo: 'contrasena',
      titulo: 'Contraseña Incorrecta',
      mensaje,
      textoBoton: 'Intentar de nuevo',
      textoBotonSecundario: onRecuperar ? '¿Olvidaste tu contraseña?' : null,
      onBotonSecundario: onRecuperar,
    });
  }, [mostrarAlerta]);

  /** Error de contraseñas que no coinciden en registro */
  const mostrarErrorContrasenasNoCoinciden = useCallback(() => {
    mostrarAlerta({
      tipo: 'contrasena',
      titulo: 'Las contraseñas no coinciden',
      mensaje: 'Asegúrate de que ambas contraseñas escritas sean exactamente idénticas.',
      textoBoton: 'Verificar',
    });
  }, [mostrarAlerta]);

  /** Error de contraseña débil */
  const mostrarErrorContrasenaDebil = useCallback(() => {
    mostrarAlerta({
      tipo: 'contrasena',
      titulo: 'Contraseña Muy Corta',
      mensaje: 'Por razones de seguridad, tu contraseña debe tener al menos 6 caracteres.',
      textoBoton: 'Ajustar contraseña',
    });
  }, [mostrarAlerta]);

  /** Error de archivo no seleccionado */
  const mostrarErrorFaltaArchivo = useCallback((tipoArchivo = 'PDF') => {
    mostrarAlerta({
      tipo: 'archivo',
      titulo: `Falta el archivo ${tipoArchivo}`,
      mensaje: `Selecciona un archivo ${tipoArchivo} válido de tu dispositivo para comenzar la operación.`,
      textoBoton: 'Seleccionar archivo',
    });
  }, [mostrarAlerta]);

  /** Error de formato de archivo incompatible */
  const mostrarErrorFormatoInvalido = useCallback((extensionesValidas = '.pdf') => {
    mostrarAlerta({
      tipo: 'archivo',
      titulo: 'Formato no soportado',
      mensaje: `El archivo seleccionado no tiene el formato correcto. Esta herramienta requiere exclusivamente archivos ${extensionesValidas}.`,
      textoBoton: 'Elegir otro archivo',
    });
  }, [mostrarAlerta]);

  /** Error de servidor o procesamiento */
  const mostrarErrorOperacion = useCallback((titulo = 'Error en Operación', mensaje = 'Ocurrió un problema inesperado al procesar el archivo.') => {
    mostrarAlerta({
      tipo: 'error',
      titulo,
      mensaje,
      textoBoton: 'Entendido',
    });
  }, [mostrarAlerta]);

  /** Modal de éxito */
  const mostrarExito = useCallback((titulo, mensaje, onAceptar) => {
    mostrarAlerta({
      tipo: 'exito',
      titulo,
      mensaje,
      textoBoton: 'Continuar',
      onConfirmar: onAceptar,
    });
  }, [mostrarAlerta]);

  return (
    <AlertContext.Provider
      value={{
        alerta,
        mostrarAlerta,
        cerrarAlerta,
        mostrarErrorCampos,
        mostrarErrorContrasena,
        mostrarErrorContrasenasNoCoinciden,
        mostrarErrorContrasenaDebil,
        mostrarErrorFaltaArchivo,
        mostrarErrorFormatoInvalido,
        mostrarErrorOperacion,
        mostrarExito,
      }}
    >
      {children}
      <ErrorModal
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        textoBoton={alerta.textoBoton}
        onCerrar={cerrarAlerta}
        onConfirmar={alerta.onConfirmar}
        textoBotonSecundario={alerta.textoBotonSecundario}
        onBotonSecundario={alerta.onBotonSecundario}
      />
    </AlertContext.Provider>
  );
}

export function useAlerta() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerta debe ser usado dentro de un AlertProvider');
  }
  return context;
}
