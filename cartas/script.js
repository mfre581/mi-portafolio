let puntuacion = 0;
let aciertos = 0;
let fallos = 0;
let cartasRestantes = 52;
let deck_id = "";
let cartaActual = null;
let juegoTerminado = false;
let chart = null;

// Mostrar/ocultar instrucciones
function toggleInstrucciones() {
  const divInst = document.getElementById("instrucciones");
  const btnInst = document.getElementById("btn-instrucciones");
  if (divInst.style.display === "block") {
    divInst.style.display = "none";
    btnInst.textContent = "Mostrar instrucciones";
  } else {
    divInst.style.display = "block";
    btnInst.textContent = "Ocultar instrucciones";
  }
}

// Inicializar el juego: obtener deck y mostrar carta inicial
async function iniciarJuego() {
  ocultarElementosParaInicio();
  resetVariables();

  try {
    const res = await fetch(
      "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
    );
    const data = await res.json();
    deck_id = data.deck_id;

    await sacarCarta();
    actualizarPuntuacion();
    actualizarCartasRestantes();
  } catch (error) {
    alert("Error al iniciar el juego");
  }
}

function actualizarCartasRestantes() {
  const contador = document.getElementById("contador-cartas");
  contador.textContent = cartasRestantes;
}

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
  // Quitar mensaje jugada
  clearMensajeJugada();
}

function resetVariables() {
  puntuacion = 0;
  aciertos = 0;
  fallos = 0;
  cartasRestantes = 52;
  cartaActual = null;
  juegoTerminado = false;
}

// Función para sacar una carta y mostrarla
async function sacarCarta() {
  if (cartasRestantes === 0) {
    juegoTerminado = true;
    mostrarMensajeFinal("No quedan cartas. Juego terminado.");
    return;
  }

  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`
  );
  const data = await res.json();
  if (data.success && data.cards.length > 0) {
    cartaActual = data.cards[0];
    cartasRestantes = data.remaining;
    actualizarCartasRestantes();
    mostrarCarta(cartaActual);
  } else {
    juegoTerminado = true;
    mostrarMensajeFinal("Error al sacar carta. Juego terminado.");
  }
}

// Muestra la carta en pantalla
function mostrarCarta(carta) {
  const imgCarta = document.getElementById("cardImage");
  imgCarta.src = carta.image;
  imgCarta.alt = `${carta.value} de ${carta.suit}`;
}

function mostrarCartaConMensaje(
  carta,
  mensaje,
  tipo,
  actualizarPuntos = false
) {
  const imgCarta = document.getElementById("cardImage");

  imgCarta.onload = () => {
    mostrarMensajeJugada(mensaje, tipo);

    if (actualizarPuntos) {
      actualizarPuntuacion();
    }
  };

  imgCarta.onerror = () => {
    mostrarMensajeJugada(mensaje, tipo);

    if (actualizarPuntos) {
      actualizarPuntuacion();
    }
  };

  imgCarta.src = carta.image;
  imgCarta.alt = `${carta.value} de ${carta.suit}`;
}

// Convierte valor de carta a número para comparar
function valorCarta(carta) {
  switch (carta.value) {
    case "ACE":
      return 14;
    case "KING":
      return 13;
    case "QUEEN":
      return 12;
    case "JACK":
      return 11;
    default:
      return parseInt(carta.value);
  }
}

// Maneja la jugada cuando se elige mayor o menor
async function jugar(esMayor) {
  if (juegoTerminado) return;

  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`
  );
  const data = await res.json();
  if (!data.success || data.cards.length === 0) {
    juegoTerminado = true;
    mostrarMensajeFinal("No quedan cartas. Juego terminado.");
    return;
  }

  const nuevaCarta = data.cards[0];
  cartasRestantes = data.remaining;
  actualizarCartasRestantes();
  const valorActual = valorCarta(cartaActual);
  const valorNuevo = valorCarta(nuevaCarta);

  let mensaje = "";
  clearMensajeJugada();

  if (valorNuevo === valorActual) {
    mensaje = "Empate! La carta es igual.";
    tipo = "empate";
  } else {
    const acerto = esMayor
      ? valorNuevo > valorActual
      : valorNuevo < valorActual;
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

  cartaActual = nuevaCarta;
  mostrarCartaConMensaje(cartaActual, mensaje, tipo, true); // true = actualiza puntuación

  if (cartasRestantes === 0) {
    juegoTerminado = true;
    mostrarMensajeFinal("Se acabaron las cartas. Juego terminado.");
    mostrarBotonesFinal();
  }
}

function mostrarMensajeJugada(texto, tipo) {
  const div = document.getElementById("mensaje-jugada");
  div.textContent = texto;
  div.className = `mensaje-jugada ${tipo}`;
}

function clearMensajeJugada() {
  const div = document.getElementById("mensaje-jugada");
  div.textContent = "";
  div.className = "mensaje-jugada";
}

function actualizarPuntuacion() {
  const score = document.getElementById("score");
  score.textContent = puntuacion;
}

function mostrarMensajeFinal(texto) {
  const mensaje = document.getElementById("mensaje");
  mensaje.style.display = "block";
  mensaje.querySelector("h2").textContent = texto;
  // Mover foco al contenedor del mensaje
  mensaje.focus();
}

function mostrarBotonesFinal() {
  document.getElementById("jugadas").style.display = "none";
  document.getElementById("terminar").style.display = "none";
  document.getElementById("recomenzar").style.display = "inline-block";
  document.getElementById("btn-ver-estadisticas").style.display =
    "inline-block";
  // Enfocar el botón "Ver Estadísticas"
  btnVerEstadisticas.focus();
}

function ocultarEstadisticas() {
  document.getElementById("estadisticas").style.display = "none";
}

function mostrarEstadisticas() {
  const contEstadisticas = document.getElementById("estadisticas");
  contEstadisticas.style.display = "block";

  if (chart) {
    chart.destroy();
  }

  const ctx = document.getElementById("grafico").getContext("2d");

  contEstadisticas.style.display = "block";

  // Scroll suave hacia el gráfico
  contEstadisticas.scrollIntoView({ behavior: "smooth" });

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Aciertos", "Fallos"],
      datasets: [
        {
          label: "Estadísticas de aciertos y fallos",
          data: [aciertos, fallos],
          backgroundColor: ["#4caf50", "#f44336"],
          borderColor: "#222",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f0f0f0",
            font: {
              size: 14,
            },
          },
        },
      },
    },
  });
}

function terminarJuego() {
  juegoTerminado = true;
  mostrarMensajeFinal("Juego terminado");
  mostrarBotonesFinal();
}

// Al pulsar reiniciar, reseteamos variables y empezamos el juego directo
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

// EVENTOS al cargar la página y botones

window.onload = () => {
  document.getElementById("iniciar").onclick = iniciarJuego;
  document.getElementById("btn-mayor").onclick = () => jugar(true);
  document.getElementById("btn-menor").onclick = () => jugar(false);
  document.getElementById("terminar").onclick = terminarJuego;
  document.getElementById("btn-ver-estadisticas").onclick = mostrarEstadisticas;
  document.getElementById("recomenzar").onclick = reiniciarJuego;

  // Inicial oculto
  document.getElementById("jugadas").style.display = "none";
  document.getElementById("mensaje").style.display = "none";
  document.getElementById("estadisticas").style.display = "none";
  document.getElementById("btn-ver-estadisticas").style.display = "none";
  document.getElementById("terminar").style.display = "none";
  document.getElementById("recomenzar").style.display = "none";
};
