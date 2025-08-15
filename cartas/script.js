// Variables globales para controlar el estado del juego
let puntuacion = 0;          // Puntuación del jugador
let aciertos = 0;            // Número de aciertos
let fallos = 0;              // Número de fallos
let cartasRestantes = 52;    // Cuántas cartas quedan por sacar
let deck_id = "";            // ID del mazo que nos da la API
let cartaActual = null;      // Última carta mostrada
let juegoTerminado = false;  // Controla si el juego sigue en marcha
let chart = null;            // Referencia al gráfico de estadísticas

// Función para mostrar u ocultar las instrucciones
function toggleInstrucciones() {
  const divInst = document.getElementById("instrucciones");
  const btnInst = document.getElementById("btn-instrucciones");

  if (divInst.style.display === "block") {
    // Si ya están visibles → las ocultamos
    divInst.style.display = "none";
    btnInst.textContent = "Mostrar instrucciones";
  } else {
    // Si están ocultas → las mostramos
    divInst.style.display = "block";
    btnInst.textContent = "Ocultar instrucciones";
  }
}

// Inicializa el juego desde cero
async function iniciarJuego() {
  ocultarElementosParaInicio(); // Prepara la interfaz
  resetVariables();              // Reinicia valores

  try {
    // Crea un mazo nuevo y mezclado desde la API
    const res = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
    const data = await res.json();
    deck_id = data.deck_id; // Guardamos el ID del mazo para futuras peticiones

    // Saca la primera carta para iniciar
    await sacarCarta();
    actualizarPuntuacion();
    actualizarCartasRestantes();
  } catch (error) {
    alert("Error al iniciar el juego");
  }
}

// Actualiza el contador de cartas restantes en pantalla
function actualizarCartasRestantes() {
  const contador = document.getElementById("contador-cartas");
  contador.textContent = cartasRestantes;
}

// Muestra/oculta elementos para que empiece el juego
function ocultarElementosParaInicio() {
  document.getElementById("iniciar").style.display = "none";
  document.getElementById("jugadas").style.display = "flex";
  document.getElementById("mensaje").style.display = "none";
  document.getElementById("estadisticas").style.display = "none";
  document.getElementById("puntuacion").style.display = "block";
  document.getElementById("carta-actual").style.display = "block";
  document.getElementById("terminar").style.display = "inline-block";
  document.getElementById("recomenzar").style.display = "none";
  document.getElementById("btn-instrucciones").style.display = "inline-block";
  clearMensajeJugada(); // Limpia cualquier mensaje previo
}

// Resetea todas las variables del juego
function resetVariables() {
  puntuacion = 0;
  aciertos = 0;
  fallos = 0;
  cartasRestantes = 52;
  cartaActual = null;
  juegoTerminado = false;
}

// Pide una carta nueva a la API y la muestra
async function sacarCarta() {
  if (cartasRestantes === 0) {
    // Si ya no quedan cartas, termina el juego
    juegoTerminado = true;
    mostrarMensajeFinal("No quedan cartas. Juego terminado.");
    return;
  }

  const res = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`);
  const data = await res.json();

  if (data.success && data.cards.length > 0) {
    cartaActual = data.cards[0];
    cartasRestantes = data.remaining;
    actualizarCartasRestantes();
    mostrarCarta(cartaActual); // Muestra carta inicial sin mensaje
  } else {
    juegoTerminado = true;
    mostrarMensajeFinal("Error al sacar carta. Juego terminado.");
  }
}

// Muestra una carta en pantalla (sin mensajes ni puntuación)
function mostrarCarta(carta) {
  const imgCarta = document.getElementById("cardImage");
  imgCarta.src = carta.image;
  imgCarta.alt = `${carta.value} de ${carta.suit}`;
}

// Muestra una carta pero esperando a que cargue la imagen
// para mostrar mensaje y actualizar puntuación
function mostrarCartaConMensaje(carta, mensaje, tipo, actualizarPuntos = false) {
  const imgCarta = document.getElementById("cardImage");

  // Espera a que la imagen termine de cargar
  imgCarta.onload = () => {
    mostrarMensajeJugada(mensaje, tipo);
    if (actualizarPuntos) {
      actualizarPuntuacion();
    }
  };

  // Si hay error cargando imagen → igual mostramos mensaje
  imgCarta.onerror = () => {
    mostrarMensajeJugada(mensaje, tipo);
    if (actualizarPuntos) {
      actualizarPuntuacion();
    }
  };

  imgCarta.src = carta.image;
  imgCarta.alt = `${carta.value} de ${carta.suit}`;
}

// Convierte el valor textual de la carta a un número para comparar
function valorCarta(carta) {
  switch (carta.value) {
    case "ACE": return 14;
    case "KING": return 13;
    case "QUEEN": return 12;
    case "JACK": return 11;
    default: return parseInt(carta.value);
  }
}

// Maneja una jugada cuando el jugador elige "mayor" o "menor"
async function jugar(esMayor) {
  if (juegoTerminado) return;

  // Pide una nueva carta
  const res = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`);
  const data = await res.json();
  if (!data.success || data.cards.length === 0) {
    juegoTerminado = true;
    mostrarMensajeFinal("No quedan cartas. Juego terminado.");
    return;
  }

  const nuevaCarta = data.cards[0];
  cartasRestantes = data.remaining;
  actualizarCartasRestantes();

  // Comparar valores de la carta actual y la nueva
  const valorActual = valorCarta(cartaActual);
  const valorNuevo = valorCarta(nuevaCarta);

  let mensaje = "";
  let tipo = "";
  clearMensajeJugada();

  if (valorNuevo === valorActual) {
    mensaje = "Empate! La carta es igual.";
    tipo = "empate";
  } else {
    const acerto = esMayor ? valorNuevo > valorActual : valorNuevo < valorActual;
    if (acerto) {
      aciertos++;
      puntuacion++;
      mensaje = "¡Acertaste!";
      tipo = "acierto";
    } else {
      fallos++;
      mensaje = "Fallaste";
      tipo = "fallo";
    }
  }

  // Guardar como carta actual y mostrar mensaje/puntuación
  cartaActual = nuevaCarta;
  mostrarCartaConMensaje(cartaActual, mensaje, tipo, true);

  // Si ya no quedan cartas → finalizar juego
  if (cartasRestantes === 0) {
    juegoTerminado = true;
    mostrarMensajeFinal("Se acabaron las cartas. Juego terminado.");
    mostrarBotonesFinal();
  }
}

// Muestra el mensaje de jugada en pantalla
function mostrarMensajeJugada(texto, tipo) {
  const div = document.getElementById("mensaje-jugada");
  div.textContent = texto;
  div.className = `mensaje-jugada ${tipo}`;
}

// Limpia el mensaje de jugada
function clearMensajeJugada() {
  const div = document.getElementById("mensaje-jugada");
  div.textContent = "";
  div.className = "mensaje-jugada";
}

// Actualiza la puntuación en pantalla
function actualizarPuntuacion() {
  const score = document.getElementById("score");
  score.textContent = puntuacion;
}

// Muestra mensaje final del juego
function mostrarMensajeFinal(texto) {
  const mensaje = document.getElementById("mensaje");
  mensaje.style.display = "block";
  mensaje.querySelector("h2").textContent = texto;
  mensaje.focus(); // Para accesibilidad
}

// Muestra botones finales cuando termina el juego
function mostrarBotonesFinal() {
  document.getElementById("jugadas").style.display = "none";
  document.getElementById("terminar").style.display = "none";
  document.getElementById("recomenzar").style.display = "inline-block";
  document.getElementById("btn-ver-estadisticas").style.display = "inline-block";
  btnVerEstadisticas.focus();
}

// Oculta estadísticas
function ocultarEstadisticas() {
  document.getElementById("estadisticas").style.display = "none";
}

// Muestra estadísticas en un gráfico de pastel
function mostrarEstadisticas() {
  const contEstadisticas = document.getElementById("estadisticas");
  contEstadisticas.style.display = "block";

  if (chart) chart.destroy(); // Evita gráficos duplicados

  const ctx = document.getElementById("grafico").getContext("2d");
  contEstadisticas.scrollIntoView({ behavior: "smooth" });

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Aciertos", "Fallos"],
      datasets: [{
        label: "Estadísticas de aciertos y fallos",
        data: [aciertos, fallos],
        backgroundColor: ["#4caf50", "#f44336"],
        borderColor: "#222",
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f0f0f0",
            font: { size: 14 },
          },
        },
      },
    },
  });
}

// Termina el juego manualmente
function terminarJuego() {
  juegoTerminado = true;
  mostrarMensajeFinal("Juego terminado");
  mostrarBotonesFinal();
}

// Reinicia todo y comienza un juego nuevo
function reiniciarJuego() {
  ocultarEstadisticas();
  document.getElementById("mensaje").style.display = "none";
  document.getElementById("btn-ver-estadisticas").style.display = "none";
  document.getElementById("recomenzar").style.display = "none";
  document.getElementById("jugadas").style.display = "flex";
  document.getElementById("terminar").style.display = "inline-block";
  resetVariables();
  iniciarJuego();
}

// Configura eventos cuando carga la página
window.onload = () => {
  document.getElementById("iniciar").onclick = iniciarJuego;
  document.getElementById("btn-mayor").onclick = () => jugar(true);
  document.getElementById("btn-menor").onclick = () => jugar(false);
  document.getElementById("terminar").onclick = terminarJuego;
  document.getElementById("btn-ver-estadisticas").onclick = mostrarEstadisticas;
  document.getElementById("recomenzar").onclick = reiniciarJuego;

  // Estado inicial ocultando elementos
  document.getElementById("jugadas").style.display = "none";
  document.getElementById("mensaje").style.display = "none";
  document.getElementById("estadisticas").style.display = "none";
  document.getElementById("btn-ver-estadisticas").style.display = "none";
  document.getElementById("terminar").style.display = "none";
  document.getElementById("recomenzar").style.display = "none";
};
