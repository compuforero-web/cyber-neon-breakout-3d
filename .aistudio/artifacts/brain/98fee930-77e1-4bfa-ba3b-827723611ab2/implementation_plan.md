# Cyber-Neon Breakout — Arcade 3D de Acción y Reflejos

Un videojuego arcade tridimensional de alta velocidad y precisión construido con Three.js y WebGL, donde el jugador controla una plataforma magnética deslizante para rebotar esferas de plasma, destruir matrices de bloques cuánticos, enfrentar jefes mecánicos en los niveles 5 y 10, recolectar potenciadores dinámicos y competir en la clasificación Top 10 global, con soporte tanto para juego directo en la vista interactiva como para descarga en un único archivo `.html` 100 % autocontenido.

## Revisión del Usuario y Decisiones Confirmadas

> [!IMPORTANT]
> Estas decisiones clave han sido alineadas a partir de tus respuestas y definen la experiencia central del juego:

- **Entrega e Interacción Dual**: El juego se ejecuta de forma nativa e interactiva a pantalla completa en la vista previa web e incluye un botón de acción directa (**"Descargar HTML5 Autocontenido"**) que genera y descarga un único archivo `.html` independiente con todo el motor 3D, estilos, físicas y audio integrados listo para abrir en cualquier navegador sin conexión.
- **Jefes Mecánicos en Niveles 5 y 10**: Los niveles 1 a 4 y 6 a 9 presentan matrices progresivas de bloques cuánticos, blindajes multi-impacto y drones patrulleros móviles. Los niveles **5 (Crucero Guardián)** y **10 (Núcleo Overlord)** desencadenan batallas contra jefes tridimensionales compuestos por múltiples piezas, equipados con escudos rotatorios y ataques de proyectiles de energía que el jugador debe esquivar o contrarrestar.
- **Sistema de 2 Ayudas Estratégicas con Penalización (-15 %)**: Durante cada partida el jugador dispone de un máximo de **2 asistencias tácticas** (elegibles entre *Pulso Destructor de Fila Inferior* o *Escudo de Emergencia Inferior*). Cada uso aplica una reducción justa del **15 % sobre el puntaje acumulado** para equilibrar la tabla competitiva Top 10.

---

## 1. Visión General y Concepto Central

- **Qué Hace**: Transforma el clásico concepto de *Breakout / Arkanoid* en una arena espacial 3D de estética Cyberpunk/Neón con cámara en perspectiva isométrica inclinada, materiales físicos PBR con reflejos de estudio, explosiones de partículas con física gravitatoria, audio ASMR/Arcade sintetizado en tiempo real y progresión a través de 10 niveles de intensidad creciente.
- **Público Objetivo**: Jugadores de arcade de acción rápida que buscan controles de respuesta inmediata (mouse, teclado o pantalla táctil), retroalimentación audiovisual satisfactoria y rejugabilidad competitiva mediante calificación por estrellas (1 a 3 estrellas por nivel) y tabla de récords.
- **Valor Principal**: Cero dependencias de archivos externos (texturas, modelos 3D y efectos de sonido 100 % procedurales) junto con portabilidad total gracias al empaquetado de archivo único descargable.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos de Usuario Clave
1. **Pantalla de Inicio y Registro de Piloto**: Al abrir el juego, un modal superpuesto sobre la arena 3D animada en segundo plano solicita el nombre del jugador (obligatorio para iniciar la partida), muestra las reglas rápidas de bonificación/ayudas y permite consultar el Top 10 o descargar el archivo HTML5 único.
2. **Bucle de Juego Activo (Niveles 1–10)**:
   - El jugador desliza la plataforma en el eje horizontal usando el mouse, las teclas `A`/`D` o `Flechas`, o arrastrando el dedo en pantallas táctiles.
   - Al destruir bloques especiales caen cápsulas 3D giratorias de **Power-Ups**:
     - **Multi-Ball (Cian)**: Divide la esfera de plasma en 3 esferas activas simultáneas.
     - **Láseres Frontales (Magenta)**: Equipa dos cañones en la plataforma que disparan ráfagas automáticas hacia los bloques y jefes.
     - **Escudo Inferior (Verde Esmeralda)**: Despliega una barrera energética en la base que evita perder la esfera durante 12 segundos.
     - **Campo de Ralentización (Ámbar)**: Reduce la velocidad de las esferas y proyectiles enemigos un 45 % durante 10 segundos para maniobras de alta precisión.
3. **Transición de Nivel y Evaluación de Estrellas**: Al limpiar un nivel (o derrotar al jefe en los niveles 5 y 10), se muestra el resumen de puntos, vidas restantes y la calificación obtenida (**1 a 3 estrellas**) antes de ensamblar la matriz del siguiente nivel.
4. **Fin de Partida / Victoria y Tabla Top 10**: Cuando se completan los 10 niveles o se agotan las vidas, el sistema calcula el puntaje final (aplicando el ajuste del -15 % por cada ayuda empleada), evalúa si ingresa al **Top 10 en `localStorage`** (desplazando automáticamente al registro menor para conservar exactamente los 10 mejores) y presenta la tabla de clasificación.

### Identidad Visual y Tema
- **Dirección Estética**: Arena espacial Cyberpunk de alto contraste con iluminación volumétrica de tres puntos, reflejos metálicos PBR (`RoomEnvironment`) y neblina exponencial profunda.
- **Paleta de Colores**:
  - **Lienzo Dominante (60 %)**: Obsidiana espacial profunda (`#070913`) y rejilla de horizonte en azul medianoche (`#0F172A`).
  - **Superficies Estructurales (30 %)**: Paneles de interfaz en pizarra translúcida oscura (`rgba(15, 23, 42, 0.88)`) con bordes sutiles de 1px (`rgba(148, 163, 184, 0.18)`) y tipografía blanca nítida (`#F8FAFC`).
  - **Acentos de Alto Impacto (10 %)**: Cian eléctrico (`#06B6D4`) para la esfera y plataforma principal, magenta neón (`#EC4899`) para bloques blindados y láseres, ámbar (`#F59E0B`) para jefes y alertas críticas, y verde esmeralda (`#10B981`) para escudos.
- **Tipografía y Jerarquía**:
  - *Display / Títulos y Marcadores*: `Orbitron` / `Chakra Petch` con peso geométrico firme para encabezados de nivel y anuncios de jefes.
  - *Cuerpo e Instrucciones*: `Plus Jakarta Sans` para controles, descripciones y modales.
  - *Datos y Puntajes*: Numerales tabulares (`tabular-nums` en fuente monoespaciada `JetBrains Mono`) para el marcador en vivo, multiplicadores y la tabla Top 10.
- **Disposición del HUD (Cero Oclusión del Viewport 3D)**:
  - **Barra Superior Compacta**: Muestra el nombre del piloto, nivel actual (`Nivel X / 10`), estrellas acumuladas, vidas restantes y puntaje en tiempo real con numerales tabulares.
  - **Dock Inferior Colapsable**: Agrupa los botones de las **2 Ayudas Estratégicas** (Destruir Fila / Escudo de Emergencia), el botón de consulta de la **Tabla Top 10**, el control de silencio de audio, el selector de cámara (Perspectiva Dinámica vs. Isométrica Ortográfica) y el botón de **Descargar HTML5 Único**, con opción de ocultar/mostrar el dock para vista limpia.

---

## 3. Decisiones de Producto y Equilibrio Técnico

- **Modelos 3D Compuestos (`THREE.Group`) en Lugar de Primitivas Simples**:
  - *Enfoque Elegido*: La plataforma del jugador, las naves enemigas flotantes y los jefes de los niveles 5 y 10 se construyen mediante grupos jerárquicos de múltiples piezas (núcleo energético, alerones biselados, cañones láser, anillos de escudo rotatorios y propulsores emisivos) con variaciones de rugosidad y metalicidad.
  - *Por Qué*: Garantiza una estética arcade AAA con siluetas reconocibles y reflejos de luz dinámicos sin depender de archivos `.glb` externos que romperían la portabilidad de un solo archivo.
- **Motor de Audio Sintético Puro (Web Audio API)**:
  - *Enfoque Elegido*: Sintetizador polifónico procedural con osciladores (`sine`, `triangle`, `sawtooth`, `square`), filtros paso-bajo y envolventes ADSR para generar rebotes metálicos, acordes armónicos progresivos en rachas de combos, disparos láser, alarmas de jefe y fanfarrias.
  - *Por Qué*: Elimina latencias de red, evita errores 404 de archivos `.mp3` y produce retroalimentación sonora ASMR limpia y reactiva a la física del impacto.
- **Generador de Archivo HTML5 Único Integrado**:
  - *Enfoque Elegido*: La aplicación web ejecuta el juego completo al instante y empaqueta su código fuente autónomo en un generador de descarga directa (`cyber-neon-breakout.html`).
  - *Por Qué*: Permite jugar inmediatamente dentro de la plataforma y, con un solo clic, obtener el archivo HTML5 independiente solicitado.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama de Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INTERFAZ HUD & GESTOR DE ESTADOS                    │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │ Registro Piloto  │  │ Barra HUD Superior  │  │ Dock Táctico Inf.  │  │
│  │ (Inicio/Reglas)  │  │ (Puntos/Vidas/Nvl)  │  │ (2 Ayudas / Top10) │  │
│  └────────┬─────────┘  └──────────┬──────────┘  └─────────┬──────────┘  │
└───────────┼───────────────────────┼───────────────────────┼─────────────┘
            │                       ▼                       │
┌───────────┴───────────────────────────────────────────────┴─────────────┐
│                 MOTOR DE JUEGO 3D (THREE.JS + WEBGL)                    │
│                                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │ Físicas y Colisiones │───▶│ Gestor de 10 Niveles │                   │
│  │ - Ángulo en paleta   │    │ - Bloques Cuánticos  │                   │
│  │ - Sub-stepping       │    │ - Drones Móviles     │                   │
│  │ - Escudos / Láseres  │    │ - Jefes (Nvl 5 y 10) │                   │
│  └──────────┬───────────┘    └──────────┬───────────┘                   │
│             ▼                           ▼                               │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │ Sistema Partículas   │    │ Sintetizador Audio   │                   │
│  │ (Pool Instanciado)   │    │ (Web Audio API ADSR) │                   │
│  └──────────────────────┘    └──────────────────────┘                   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             PERSISTENCIA LOCAL & EXPORTADOR AUTOCONTENIDO               │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ Base de Datos localStorage      │  │ Empaquetador Single-File     │  │
│  │ Top 10 Récords (Orden Estricto) │  │ Descarga .HTML Autocontenido │  │
│  └─────────────────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos y Estados
- **Estado de Partida (`GameState`)**:
  - `phase`: `'START_MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY'`
  - `playerName`: Cadena validada (obligatoria antes de iniciar).
  - `level`: Entero `1..10`, con configuración de velocidad base, matriz de bloques (`standard`, `armored`, `explosive`, `moving_drone`) y entidad de jefe en niveles `5` y `10`.
  - `score`, `lives` (inicial: 3), `combo`, `starsPerLevel` (arreglo de 1 a 3 estrellas ganadas por cada nivel superado).
  - `assistsRemaining`: Entero `0..2` y `assistsUsed`: Entero `0..2` (cada uso aplica un multiplicador de `0.85` al puntaje actual y ejecuta el efecto elegido).
  - `activePowerUps`: Temporizadores independientes para `multiBall`, `laserPods`, `bottomShield` y `slowMoField`.
- **Persistencia Top 10 (`LeaderboardEntry`)**:
  - Almacenado bajo la clave `cyber_neon_breakout_top10_v1` en `localStorage`.
  - Estructura: `{ id, playerName, score, maxLevel, totalStars, assistsUsed, date }`.
  - Al finalizar una partida, el nuevo registro se inserta si la lista tiene menos de 10 elementos o si su `score` supera al menor puntaje registrado; posteriormente se ordena de forma descendente (`b.score - a.score`) y se recorta a exactamente 10 posiciones (`slice(0, 10)`).

### Mapeo de Componentes Interactivos y Eventos
- **Control Deslizante Híbrido (Mouse / Touch / Teclado)**: Mapea la coordenada horizontal del puntero o toque al plano 3D de la arena con amortiguación exponencial (`THREE.MathUtils.damp`) e inclina ligeramente la plataforma según la velocidad lateral.
- **Física de Rebote Direccional**: El impacto de la esfera sobre la plataforma calcula la desviación normalizada respecto al centro (`-1` a `+1`) para ajustar el vector de salida en el plano `XZ`, permitiendo apuntar con precisión hacia los puntos débiles de los jefes o bloques lejanos.
- **Batallas de Jefes (Niveles 5 y 10)**:
  - **Nivel 5 — Crucero Guardián**: Nave blindada con barra de integridad propia, escoltada por 2 escudos orbitales giratorios que rebotan la esfera y cañón central que dispara pulsos de plasma hacia la plataforma cada 3.5 segundos.
  - **Nivel 10 — Núcleo Overlord**: Fortaleza cuántica de múltiples anillos concéntricos, 4 escudos rotatorios, generación periódica de drones defensivos y ráfagas dobles de proyectiles energéticos.
