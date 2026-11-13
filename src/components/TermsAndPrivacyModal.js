import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { theme } from '../theme/shadcn';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Separator } from './ui/Separator';
import { Badge } from './ui/Badge';

/**
 * Modal obligatorio de visualización y aceptación de Políticas de Privacidad y Términos de Uso.
 * Si el usuario acepta, se confirma su registro.
 * Si el usuario rechaza, se ejecuta el rollback eliminando la cuenta recién creada y redirigiendo al login.
 */
export default function TermsAndPrivacyModal({
  visible,
  onAceptar,
  onRechazar,
  cargando = false,
  soloLectura = false,
  onCerrar
}) {
  const [procesandoRechazo, setProcesandoRechazo] = useState(false);

  const manejarRechazo = () => {
    Alert.alert(
      '¿Seguro que deseas rechazar?',
      'Si no aceptas las políticas de privacidad y términos de uso, tu cuenta y datos de registro serán eliminados inmediatamente y volverás a la pantalla de inicio de sesión.',
      [
        { text: 'Volver a revisar', style: 'cancel' },
        {
          text: 'Sí, cancelar y borrar cuenta',
          style: 'destructive',
          onPress: async () => {
            setProcesandoRechazo(true);
            try {
              await onRechazar();
            } finally {
              setProcesandoRechazo(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={soloLectura ? onCerrar : undefined}
    >
      <View style={estilos.overlay}>
        <Card style={estilos.contenedorModal}>
          <CardHeader>
            <View style={estilos.cabeceraFila}>
              <Badge variant="outline" label="Versión 1.0.0 Oficial" />
              <Badge variant="default" label="Obligatorio" />
            </View>
            <CardTitle style={estilos.tituloModal}>
              Políticas de Privacidad y Términos de Uso
            </CardTitle>
            <CardDescription>
              Por favor lee atentamente las condiciones de servicio y protección de datos de EncoderGoti antes de continuar.
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent style={estilos.contenidoScroll}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={estilos.scrollContainer}
            >
              {/* SECCIÓN 1: POLÍTICAS DE PRIVACIDAD */}
              <Text style={estilos.seccionTitulo}>1. POLÍTICAS DE PRIVACIDAD</Text>
              <Text style={estilos.parrafo}>
                En <Text style={estilos.textoNegrita}>EncoderGoti</Text>, valoramos y protegemos la privacidad de tu información. A continuación detallamos cómo se tratan tus datos y documentos:
              </Text>

              <Text style={estilos.subtitulo}>1.1 Tratamiento Efímero de Archivos</Text>
              <Text style={estilos.parrafo}>
                Los documentos que subes para comprimir, firmar, convertir o procesar con Inteligencia Artificial residen únicamente de forma temporal en la memoria y en el almacenamiento volátil del servidor durante el tiempo técnico que dura la operación. Finalizado el proceso, los archivos son purgados de manera forzosa mediante bloques de limpieza y por un recolector automático de basura cada 30 minutos.
              </Text>

              <Text style={estilos.subtitulo}>1.2 Destrucción Estricta de Certificados (.p12 / .pfx)</Text>
              <Text style={estilos.parrafo}>
                Para la firma electrónica digital, requerimos temporalmente tu archivo contenedor PKCS#12 (.p12 o .pfx) y su contraseña para extraer la clave pública y privada. <Text style={estilos.textoAlerta}>EncoderGoti NUNCA guarda contraseñas ni almacena certificados en bases de datos</Text>. El archivo del certificado se destruye inmediatamente después de estampar la firma criptográfica en el PDF.
              </Text>

              <Text style={estilos.subtitulo}>1.3 Procesamiento de Inteligencia Artificial (Groq LPU)</Text>
              <Text style={estilos.parrafo}>
                Cuando utilizas las funciones de resumen o traducción inteligente, únicamente transmitimos el texto plano extraído del PDF hacia los servidores de inferencia de ultra-baja latencia de Groq Cloud LPU (modelo LLaMA 3.3 70B). Tus datos no son utilizados para reentrenar modelos comerciales de terceros.
              </Text>

              <Text style={estilos.subtitulo}>1.4 Bóveda Opcional en la Nube (Storage Privado)</Text>
              <Text style={estilos.parrafo}>
                Si decides sincronizar o respaldar tus documentos procesados en la nube, estos se alojan en un bucket privado protegido por políticas de seguridad a nivel de fila (Row Level Security), de tal manera que sólo tu usuario autenticado tiene permisos de lectura y descarga.
              </Text>

              <Separator style={estilos.separadorInterno} />

              {/* SECCIÓN 2: TÉRMINOS DE USO Y RESPONSABILIDAD */}
              <Text style={estilos.seccionTitulo}>2. TÉRMINOS Y CONDICIONES DE USO</Text>

              <Text style={estilos.subtitulo}>2.1 Qué Puedes Hacer y Cuándo</Text>
              <Text style={estilos.parrafo}>
                Puedes utilizar la aplicación en cualquier momento para:
                {'\n'}• Firmar digitalmente documentos PDF mediante el estándar PAdES con código QR de verificación oficial (compatible con FirmaEC).
                {'\n'}• Comprimir archivos PDF pesados optimizando flujos de imágenes y tipografías.
                {'\n'}• Convertir documentos de Word, Excel, imágenes y archivos de texto plano a formato PDF.
                {'\n'}• Generar resúmenes ejecutivos y traducciones técnicas mediante Inteligencia Artificial.
              </Text>

              <Text style={estilos.subtitulo}>2.2 Hasta Dónde Llega Nuestra Responsabilidad</Text>
              <Text style={estilos.parrafo}>
                • <Text style={estilos.textoNegrita}>Validez del Contenido Firmado:</Text> EncoderGoti proporciona la infraestructura tecnológica para aplicar el estándar PAdES conforme a la normativa ecuatoriana de comercio electrónico y firmas electrónicas. Sin embargo, la veracidad del contenido del documento, la legitimidad de las facultades de representación y la vigencia del certificado emitido por las entidades de certificación autorizadas recaen con exclusividad sobre el titular de la cuenta.
                {'\n\n'}• <Text style={estilos.textoNegrita}>Custodia de Claves:</Text> Eres el único custodio de tu certificado y contraseña. Si olvidas la contraseña de tu archivo .p12, deberás contactar a tu entidad emisora; nosotros no tenemos posibilidad técnica de recuperarla.
                {'\n\n'}• <Text style={estilos.textoNegrita}>Disponibilidad del Servicio:</Text> Nos esforzamos por mantener una disponibilidad continua, pero no nos responsabilizamos por interrupciones atribuibles a fallos de conexión del operador móvil del usuario, problemas de red externos o archivos de origen corrompidos antes de su carga.
              </Text>

              <Text style={estilos.subtitulo}>2.3 Aceptación o Rechazo del Registro</Text>
              <Text style={estilos.parrafo}>
                La aceptación de estas políticas es obligatoria para acceder a las funcionalidades del sistema. Si decides no aceptar, tu registro será cancelado inmediatamente y se eliminará cualquier dato de usuario temporal de nuestros registros.
              </Text>
            </ScrollView>
          </CardContent>

          <Separator />

          <CardFooter style={estilos.footerAcciones}>
            {soloLectura ? (
              <Button
                variant="default"
                onPress={onCerrar}
                style={estilos.botonAncho}
              >
                Entendido, Volver
              </Button>
            ) : (
              <View style={estilos.filaBotones}>
                <Button
                  variant="outline"
                  onPress={manejarRechazo}
                  disabled={cargando || procesandoRechazo}
                  style={estilos.botonSecundario}
                >
                  {procesandoRechazo ? 'Cancelando...' : 'Rechazar'}
                </Button>
                <Button
                  variant="default"
                  onPress={onAceptar}
                  disabled={cargando || procesandoRechazo}
                  style={estilos.botonPrincipal}
                >
                  {cargando ? 'Aceptando...' : 'Acepto Políticas y Términos'}
                </Button>
              </View>
            )}
          </CardFooter>
        </Card>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  contenedorModal: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
  },
  cabeceraFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  contenidoScroll: {
    maxHeight: 380,
    paddingVertical: theme.spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ring,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginTop: theme.spacing.sm,
    marginBottom: 2,
  },
  parrafo: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  textoNegrita: {
    color: theme.colors.foreground,
    fontWeight: '700',
  },
  textoAlerta: {
    color: theme.colors.destructive,
    fontWeight: '600',
  },
  separadorInterno: {
    marginVertical: theme.spacing.md,
  },
  footerAcciones: {
    paddingTop: theme.spacing.sm,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  botonSecundario: {
    flex: 1,
    borderColor: theme.colors.destructive,
  },
  botonPrincipal: {
    flex: 2,
  },
  botonAncho: {
    width: '100%',
  },
});

