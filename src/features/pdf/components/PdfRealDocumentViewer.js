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
import { leerUriComoBase64 } from '../../../utils/apiUploader';
import { theme } from '../../../theme/shadcn';

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
            ancho: 130,
            alto: 40
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
      left: 20px;
      top: 50px;
      cursor: move;
      touch-action: none;
      z-index: 100;
      user-select: none;
      -webkit-user-select: none;
    }
    .estampa-firma-box {
      width: 120px;
      height: 36px;
      background: #FFFFFF;
      border: 0.5px solid #E4E4E7;
      border-radius: 3px;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 2px 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .estampa-qr-col {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 4px;
      margin-right: 4px;
      border-right: 0.5px solid #E4E4E7;
      height: 30px;
    }
    .estampa-info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }
    .estampa-titulo-mini {
      color: #0284C7;
      font-size: 4.5px;
      font-weight: 600;
      letter-spacing: 0.15px;
      line-height: 1.1;
      margin-bottom: 0.5px;
    }
    .estampa-nombre {
      font-size: 5.6px;
      font-weight: 700;
      color: #09090B;
      line-height: 1.15;
      margin-bottom: 0.5px;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .estampa-ci {
      font-size: 4.8px;
      color: #71717A;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .estampa-nota-box {
      width: 140px;
      height: 52px;
      background: #FEF9C3;
      border: 1px solid #FDE047;
      border-left: 3.5px solid #EAB308;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(234, 179, 8, 0.35);
      overflow: hidden;
    }
    .estampa-header-nota {
      background: #713F12;
      justify-content: flex-start;
      gap: 4px;
      color: #FEF9C3;
      font-size: 7px;
      font-weight: 700;
    }
    .estampa-body-nota {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4px;
    }
    .titulo-estampa {
      font-size: 8.5px;
      font-weight: bold;
      color: #713F12;
      text-align: center;
    }
    .sub-estampa {
      font-size: 6.5px;
      color: #854D0E;
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

    ${tipo === 'firma' ? `
    <div id="estampa-firma" class="estampa-firma-box">
      <div class="estampa-qr-col">
        <svg width="28" height="28" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="37" height="37" rx="2" fill="#ffffff" stroke="#e4e4e7"/>
          <rect x="4" y="4" width="10" height="10" rx="1" stroke="#09090b" stroke-width="2"/>
          <rect x="7" y="7" width="4" height="4" fill="#09090b"/>
          <rect x="24" y="4" width="10" height="10" rx="1" stroke="#09090b" stroke-width="2"/>
          <rect x="27" y="7" width="4" height="4" fill="#09090b"/>
          <rect x="4" y="24" width="10" height="10" rx="1" stroke="#09090b" stroke-width="2"/>
          <rect x="7" y="27" width="4" height="4" fill="#09090b"/>
          <rect x="17" y="5" width="3" height="3" fill="#09090b"/>
          <rect x="17" y="11" width="3" height="3" fill="#09090b"/>
          <rect x="5" y="17" width="3" height="3" fill="#09090b"/>
          <rect x="11" y="17" width="3" height="3" fill="#09090b"/>
          <rect x="17" y="17" width="4" height="4" fill="#0284c7"/>
          <rect x="24" y="17" width="3" height="3" fill="#09090b"/>
          <rect x="30" y="17" width="3" height="3" fill="#09090b"/>
          <rect x="17" y="24" width="3" height="3" fill="#09090b"/>
          <rect x="24" y="24" width="4" height="4" fill="#09090b"/>
          <rect x="30" y="27" width="3" height="3" fill="#09090b"/>
          <rect x="17" y="30" width="3" height="3" fill="#09090b"/>
          <rect x="25" y="31" width="5" height="3" fill="#09090b"/>
        </svg>
      </div>
      <div class="estampa-info-col">
        <div class="estampa-titulo-mini">Firmado electrónicamente</div>
        <div class="estampa-nombre">${etiqueta || 'Titular de Firma'}</div>
        <div class="estampa-ci">CI: 17...</div>
      </div>
    </div>
    ` : `
    <div id="estampa-firma" class="estampa-nota-box">
      <div class="estampa-header estampa-header-nota">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>NOTA ADHESIVA</span>
      </div>
      <div class="estampa-body-nota">
        <div class="titulo-estampa">${etiqueta || 'Nota'}</div>
        <div class="sub-estampa">Arrastra al lugar deseado</div>
      </div>
    </div>
    `}
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
          ancho: 130,
          alto: 40
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
