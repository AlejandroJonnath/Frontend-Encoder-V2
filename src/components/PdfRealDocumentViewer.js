import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { leerUriComoBase64 } from '../utils/apiUploader';
import { theme } from '../theme/shadcn';

/**
 * Visor real del documento PDF (estilo FirmaEC)
 * Renderiza el contenido de las páginas y permite arrastrar
 * la estampa de firma sobre el documento con coordenadas en tiempo real.
 */
export default function PdfRealDocumentViewer({
  archivoPdfUri,
  alCambiarPosicion,
  tipo = 'firma',
  etiqueta = 'FirmaEC',
  pantallaCompleta = false
}) {
  const [base64Pdf, setBase64Pdf] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [coordenadasActuales, setCoordenadasActuales] = useState({ x: 50, y: 50, pagina: 1 });
  const [arrastrandoEstampa, setArrastrandoEstampa] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    async function cargarPdf() {
      try {
        setCargandoPdf(true);
        // Usar lectura universal de React Native (bypasea el sandbox de DocumentPicker en Android)
        const b64 = await leerUriComoBase64(archivoPdfUri);
        const b64Limpio = b64.replace(/(\r\n|\n|\r)/gm, '');
        setBase64Pdf(b64Limpio);
      } catch (err) {
        // En caso de cualquier excepción, el lienzo de precisión se activa limpiamente
        setBase64Pdf(null);
      } finally {
        setCargandoPdf(false);
      }
    }
    if (archivoPdfUri) cargarPdf();
  }, [archivoPdfUri]);

  const cambiarPagina = (delta) => {
    const nueva = paginaActual + delta;
    if (nueva >= 1 && nueva <= totalPaginas) {
      setPaginaActual(nueva);
      webViewRef.current?.injectJavaScript(`if(window.irAPagina){ window.irAPagina(${nueva}); } true;`);
    }
  };

  const enviarPdfAlWebView = () => {
    if (base64Pdf && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.inicializarConBase64) {
          window.inicializarConBase64("${base64Pdf}");
        }
        true;
      `);
    }
  };

  // PanResponder para detectar arrastre sobre el WebView y bloquear el ScrollView padre
  const panResponder = useRef(
    PanResponder.create({
      // Capturar el gesto si el WebView ha notificado que el usuario está arrastrando la estampa
      onStartShouldSetPanResponder: () => arrastrandoEstampa,
      onMoveShouldSetPanResponder: () => arrastrandoEstampa,
      onPanResponderGrant: () => {},
      onPanResponderMove: () => {},
      onPanResponderRelease: () => setArrastrandoEstampa(false),
      onPanResponderTerminate: () => setArrastrandoEstampa(false),
    })
  ).current;

  const manejarMensaje = (evento) => {
    try {
      const datos = JSON.parse(evento.nativeEvent.data);
      if (datos.tipo === 'listoParaDatos') {
        enviarPdfAlWebView();
      } else if (datos.tipo === 'arrastreInicio') {
        // El usuario empezó a arrastrar la estampa: bloquear scroll del padre
        setArrastrandoEstampa(true);
      } else if (datos.tipo === 'arrastreFin') {
        // El usuario soltó la estampa: reactivar scroll del padre
        setArrastrandoEstampa(false);
      } else if (datos.tipo === 'infoDoc') {
        setTotalPaginas(datos.totalPaginas || 1);
      } else if (datos.tipo === 'posicion') {
        setCoordenadasActuales({
          x: datos.x,
          y: datos.y,
          pagina: datos.pagina || paginaActual
        });
        if (alCambiarPosicion) {
          alCambiarPosicion({
            x: datos.x,
            y: datos.y,
            pagina: datos.pagina || paginaActual,
            ancho: datos.ancho || 220,
            alto: datos.alto || 70
          });
        }
      }
    } catch (_) {}
  };

  const htmlVisor = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body {
      background: #0B1120;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 12px 6px;
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #wrapper {
      position: relative;
      display: inline-block;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      border-radius: 8px;
      overflow: hidden;
      background: #FFFFFF;
      min-width: 300px;
      min-height: 420px;
    }
    canvas {
      display: block;
      max-width: 100%;
      height: auto;
      background: #FFFFFF;
    }
    #vista-respaldo {
      display: none;
      width: 320px;
      height: 450px;
      background: #FFFFFF;
      position: relative;
      border: 1px solid #CBD5E1;
      padding: 20px;
    }
    .linea-doc {
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      margin-bottom: 12px;
    }
    .linea-doc.corta { width: 45%; }
    .linea-doc.media { width: 75%; }
    .linea-doc.larga { width: 95%; }

    #estampa-firma {
      position: absolute;
      left: 30px;
      top: 60px;
      width: 150px;
      height: 55px;
      background: rgba(224, 242, 254, 0.92);
      border: 2px dashed #0284C7;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: move;
      touch-action: none;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
      z-index: 100;
    }
    .titulo-estampa {
      font-size: 10px;
      font-weight: bold;
      color: #0369A1;
      text-align: center;
    }
    .sub-estampa {
      font-size: 8px;
      color: #475569;
      margin-top: 2px;
      text-align: center;
    }
    #loader {
      color: #94A3B8;
      font-size: 13px;
      margin-top: 30px;
      text-align: center;
    }
    #coordenadas-badge {
      margin-top: 8px;
      color: #64748B;
      font-size: 11px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="loader">Cargando previsualización del documento...</div>

  <div id="wrapper" style="display:none;">
    <canvas id="pdf-canvas"></canvas>

    <div id="vista-respaldo">
      <div style="font-size:12px; font-weight:bold; color:#0F172A; margin-bottom:12px;">Vista previa del PDF</div>
      <div class="linea-doc corta"></div>
      <div class="linea-doc larga"></div>
      <div class="linea-doc larga"></div>
      <div class="linea-doc media"></div>
      <div style="height: 30px;"></div>
      <div class="linea-doc larga"></div>
      <div class="linea-doc media"></div>
      <div class="linea-doc corta"></div>
    </div>

    <div id="estampa-firma">
      <div class="titulo-estampa">🖋️ ${etiqueta}</div>
      <div class="sub-estampa">Arrastra al lugar de firma</div>
    </div>
  </div>

  <div id="coordenadas-badge"></div>

  <script>
    var pdfDoc = null;
    var paginaActual = 1;
    var escala = 0.85;
    var canvas = document.getElementById('pdf-canvas');
    var ctx = canvas.getContext('2d');
    var estampa = document.getElementById('estampa-firma');
    var wrapper = document.getElementById('wrapper');
    var loader = document.getElementById('loader');
    var vistaRespaldo = document.getElementById('vista-respaldo');
    var badgeCoords = document.getElementById('coordenadas-badge');

    // Notificar a React Native que el WebView está listo
    window.onload = function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'listoParaDatos' }));
      }
    };

    window.inicializarConBase64 = function(b64) {
      try {
        if (typeof pdfjsLib === 'undefined') {
          activarModoRespaldo();
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        var rawData = atob(b64);
        var uint8Array = new Uint8Array(rawData.length);
        for (var i = 0; i < rawData.length; i++) {
          uint8Array[i] = rawData.charCodeAt(i);
        }

        pdfjsLib.getDocument({ data: uint8Array }).promise.then(function(pdf) {
          pdfDoc = pdf;
          loader.style.display = 'none';
          wrapper.style.display = 'block';

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              tipo: 'infoDoc',
              totalPaginas: pdf.numPages
            }));
          }

          renderizarPagina(1);
        }).catch(function(err) {
          activarModoRespaldo();
        });
      } catch (e) {
        activarModoRespaldo();
      }
    };

    function activarModoRespaldo() {
      loader.style.display = 'none';
      wrapper.style.display = 'block';
      canvas.style.display = 'none';
      vistaRespaldo.style.display = 'block';
      notificarPosicion();
    }

    function renderizarPagina(num) {
      if (!pdfDoc) return;
      paginaActual = num;
      pdfDoc.getPage(num).then(function(page) {
        var baseViewport = page.getViewport({ scale: 1.0 });
        var anchoDeseado = Math.min(window.innerWidth - 20, 340);
        escala = anchoDeseado / baseViewport.width;
        var viewportActual = page.getViewport({ scale: escala });

        canvas.height = viewportActual.height;
        canvas.width = viewportActual.width;

        page.render({ canvasContext: ctx, viewport: viewportActual }).promise.then(function() {
          notificarPosicion();
        });
      });
    }

    window.irAPagina = function(num) {
      renderizarPagina(num);
    };

    // Arrastre táctil de la firma sobre el lienzo del PDF
    var arrastrando = false;
    var offsetX = 0, offsetY = 0;

    estampa.addEventListener('touchstart', function(e) {
      arrastrando = true;
      var touch = e.touches[0];
      var rect = estampa.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'arrastreInicio' }));
      }
    }, { passive: false });

    // Permite también tocar directamente en cualquier parte del documento para mover la estampa allí
    wrapper.addEventListener('click', function(e) {
      if (e.target === estampa || estampa.contains(e.target)) return;
      var wrapperRect = wrapper.getBoundingClientRect();
      var clickX = e.clientX - wrapperRect.left - (estampa.clientWidth / 2);
      var clickY = e.clientY - wrapperRect.top - (estampa.clientHeight / 2);
      clickX = Math.max(0, Math.min(clickX, wrapper.clientWidth - estampa.clientWidth));
      clickY = Math.max(0, Math.min(clickY, wrapper.clientHeight - estampa.clientHeight));
      estampa.style.left = clickX + 'px';
      estampa.style.top = clickY + 'px';
      actualizarBadge(clickX, clickY);
      notificarPosicion();
    });

    document.addEventListener('touchmove', function(e) {
      if (!arrastrando) return;
      e.preventDefault();
      e.stopPropagation();
      var touch = e.touches[0];
      var wrapperRect = wrapper.getBoundingClientRect();
      var newX = touch.clientX - wrapperRect.left - offsetX;
      var newY = touch.clientY - wrapperRect.top - offsetY;

      newX = Math.max(0, Math.min(newX, wrapper.clientWidth - estampa.clientWidth));
      newY = Math.max(0, Math.min(newY, wrapper.clientHeight - estampa.clientHeight));

      estampa.style.left = newX + 'px';
      estampa.style.top = newY + 'px';

      actualizarBadge(newX, newY);
    }, { passive: false });

    document.addEventListener('touchend', function() {
      if (arrastrando) {
        arrastrando = false;
        notificarPosicion();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'arrastreFin' }));
        }
      }
    });

    function actualizarBadge(x, y) {
      badgeCoords.innerText = 'Posición: X=' + Math.round(x) + 'px, Y=' + Math.round(y) + 'px';
    }

    function notificarPosicion() {
      var xDom = parseFloat(estampa.style.left || 30);
      var yDom = parseFloat(estampa.style.top || 60);

      var anchoRef = canvas.offsetWidth || wrapper.offsetWidth || 340;
      var altoRef = canvas.offsetHeight || wrapper.offsetHeight || 480;

      var ratioX = 595.28 / (anchoRef || 1);
      var ratioY = 841.89 / (altoRef || 1);

      var pdfX = Math.round(xDom * ratioX);
      var pdfY = Math.round((altoRef - yDom - estampa.clientHeight) * ratioY);

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          tipo: 'posicion',
          x: pdfX,
          y: Math.max(0, pdfY),
          pagina: paginaActual,
          ancho: Math.round(estampa.clientWidth * ratioX),
          alto: Math.round(estampa.clientHeight * ratioY)
        }));
      }
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={[estilos.contenedor, pantallaCompleta && { flex: 1, width: '100%', marginBottom: 0 }]}>
      {/* Barra superior de cambio de páginas */}
      <View style={estilos.barraPaginas}>
        <View style={estilos.badgePagina}>
          <Text style={estilos.textoPaginas}>
            Página {paginaActual} de {totalPaginas}
          </Text>
        </View>

        <View style={estilos.filaBotones}>
          <TouchableOpacity
            style={[estilos.btnPaginacion, paginaActual <= 1 && estilos.btnDeshabilitado]}
            disabled={paginaActual <= 1}
            onPress={() => cambiarPagina(-1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={14} color={theme.colors.foreground} />
            <Text style={estilos.textoBtn}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.btnPaginacion, paginaActual >= totalPaginas && estilos.btnDeshabilitado]}
            disabled={paginaActual >= totalPaginas}
            onPress={() => cambiarPagina(1)}
            activeOpacity={0.7}
          >
            <Text style={estilos.textoBtn}>Siguiente</Text>
            <Feather name="chevron-right" size={14} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={estilos.instruccion}>
        Arrastra la estampa o pulsa sobre la página para fijar la posición exacta:
      </Text>

      {/* Visor interactivo WebView */}
      <View style={[estilos.cajaWebView, pantallaCompleta && { flex: 1, height: '100%' }]} {...panResponder.panHandlers}>
        {cargandoPdf ? (
          <View style={estilos.cargando}>
            <ActivityIndicator size="large" color={theme.colors.foreground} />
            <Text style={estilos.textoCargando}>Cargando documento...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlVisor }}
            onMessage={manejarMensaje}
            onLoadEnd={enviarPdfAlWebView}
            style={estilos.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        )}
      </View>

      {/* Fila de Coordenadas */}
      <View style={estilos.filaCoords}>
        <Text style={estilos.textoCoord}>Pág: {coordenadasActuales.pagina}</Text>
        <Text style={estilos.textoCoord}>X: {coordenadasActuales.x} pt</Text>
        <Text style={estilos.textoCoord}>Y: {coordenadasActuales.y} pt</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  barraPaginas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  badgePagina: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoPaginas: {
    color: theme.colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPaginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    gap: 4,
  },
  btnDeshabilitado: {
    opacity: 0.35,
  },
  textoBtn: {
    color: theme.colors.foreground,
    fontSize: 12,
    fontWeight: '500',
  },
  instruccion: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  cajaWebView: {
    width: '100%',
    height: 460,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 8,
  },
  filaCoords: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoCoord: {
    color: theme.colors.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
  },
});
