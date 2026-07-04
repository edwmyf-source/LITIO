import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../api/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── 15 PERSONAJES ────────────────────────────────────────────────────────────
const PERSONAJES = [
  { id: 0,  min: 0,    emoji: '🐒', nombre: 'Simio Curioso',        desc: 'Confunde el agua con el café.' },
  { id: 1,  min: 50,   emoji: '🦧', nombre: 'Mono Pensativo',        desc: 'Algo se mueve en ese cerebro.' },
  { id: 2,  min: 120,  emoji: '👶', nombre: 'Bebé Científico',        desc: 'Lo prueba todo. Literalmente.' },
  { id: 3,  min: 220,  emoji: '👦', nombre: 'Niño Curioso',          desc: '¿Por qué el cielo es azul?' },
  { id: 4,  min: 350,  emoji: '🎒', nombre: 'Bachiller Aplicado',    desc: 'Memorizó la tabla periódica. Una vez.' },
  { id: 5,  min: 520,  emoji: '📚', nombre: 'Universitario Primero', desc: 'Conoce la estequiometría. En teoría.' },
  { id: 6,  min: 720,  emoji: '🔬', nombre: 'Practicante de Lab',    desc: 'Ya no rompe pipetas. Casi nunca.' },
  { id: 7,  min: 960,  emoji: '👩‍🔬', nombre: 'Laboratorista',         desc: 'Sabe cuándo la reacción va mal.' },
  { id: 8,  min: 1250, emoji: '🧪', nombre: 'Técnico Químico',        desc: 'Huele el reactivo y ya sabe qué es.' },
  { id: 9,  min: 1600, emoji: '👨‍🏫', nombre: 'Profe Labortosita',     desc: 'Explica lo mismo 40 veces. Con amor.' },
  { id: 10, min: 2000, emoji: '🧫', nombre: 'Investigador',           desc: 'Publica papers que nadie lee. Pero importan.' },
  { id: 11, min: 2500, emoji: '🏆', nombre: 'Químico Senior',         desc: 'Ha visto explosiones no documentadas.' },
  { id: 12, min: 3100, emoji: '🎓', nombre: 'PhD en Química',         desc: 'Cinco años de tesis para llegar aquí.' },
  { id: 13, min: 3800, emoji: '⚗️',  nombre: 'Maestro Alquimista',    desc: 'Convierte el plomo en oro... casi.' },
  { id: 14, min: 4600, emoji: '⚡', nombre: 'Albert Einsteinium',     desc: 'E=mc². Y sabe exactamente por qué.' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getPersonaje(pts) {
  let p = PERSONAJES[0]
  for (const per of PERSONAJES) { if (pts >= per.min) p = per }
  return p
}

// ─── 20 NIVELES TEMÁTICOS ─────────────────────────────────────────────────────
const NIVELES = [
  { id: 1,  tema: 'La cocina del químico',      emoji: '🍳', color: '#16a34a', bg: '#f0fdf4', frase_inicio: '¡Vamos calentando motores!', frase_nivel: '¡Arrancamos!' },
  { id: 2,  tema: 'Tabla periódica básica',     emoji: '📋', color: '#0d9488', bg: '#f0fdfa', frase_inicio: '¿Conoces los elementos?', frase_nivel: '¡Subiste de nivel! 🚀' },
  { id: 3,  tema: 'Estados de la materia',      emoji: '🌡️', color: '#2563eb', bg: '#eff6ff', frase_inicio: '¡Vas bien, sigue así!', frase_nivel: '¡Nivel 3! ¡Se pone bueno!' },
  { id: 4,  tema: 'Mezclas y soluciones',       emoji: '⚗️', color: '#7c3aed', bg: '#f5f3ff', frase_inicio: 'Aquí empieza lo serio...', frase_nivel: '¡Nivel 4! ¡Eso es!' },
  { id: 5,  tema: 'Ácidos y bases',             emoji: '🧪', color: '#dc2626', bg: '#fff1f2', frase_inicio: '¿pH qué? ¡Demuéstralo!', frase_nivel: '¡NIVEL 5! 🔥 ¡Fuego!' },
  { id: 6,  tema: 'Reacciones químicas',        emoji: '💥', color: '#ea580c', bg: '#fff7ed', frase_inicio: 'Las reacciones no mienten', frase_nivel: '¡Nivel 6! ¡Imparable!' },
  { id: 7,  tema: 'Concentraciones',            emoji: '🧫', color: '#0369a1', bg: '#f0f9ff', frase_inicio: '¿Molar o molal? Eso te pregunto', frase_nivel: '¡NIVEL 7! ¡Qué bestia!' },
  { id: 8,  tema: 'Estequiometría',             emoji: '⚖️', color: '#1d4ed8', bg: '#eff6ff', frase_inicio: 'Los números no perdonan...', frase_nivel: '¡Nivel 8! ¡La rompes!' },
  { id: 9,  tema: 'Enlace químico',             emoji: '🔗', color: '#7e22ce', bg: '#faf5ff', frase_inicio: '¿Iónico o covalente? Piénsalo bien', frase_nivel: '¡NIVEL 9! ¡Sos un crack!' },
  { id: 10, tema: 'Química orgánica básica',    emoji: '🌿', color: '#15803d', bg: '#f0fdf4', frase_inicio: '¡Mitad del camino! ¿Aguantas?', frase_nivel: '¡NIVEL 10! ¡Mitad! 🏅' },
  { id: 11, tema: 'Separación de mezclas',      emoji: '🔬', color: '#0f766e', bg: '#f0fdfa', frase_inicio: 'Aquí solo sobreviven los mejores', frase_nivel: '¡Nivel 11! ¡Eres nivel PRO!' },
  { id: 12, tema: 'Termodinámica básica',       emoji: '🌡️', color: '#b91c1c', bg: '#fff1f2', frase_inicio: '¡El calor no es broma!', frase_nivel: '¡NIVEL 12! ¡Legendario!' },
  { id: 13, tema: 'Electroquímica',             emoji: '⚡', color: '#ca8a04', bg: '#fefce8', frase_inicio: '¿Oxidación y reducción? Dale.', frase_nivel: '¡NIVEL 13! ¡Monstruo!' },
  { id: 14, tema: 'Cinética química',           emoji: '⏱️', color: '#4338ca', bg: '#eef2ff', frase_inicio: '¡Velocidad o muerte!', frase_nivel: '¡Nivel 14! ¡Increíble!' },
  { id: 15, tema: 'Análisis químico',           emoji: '📊', color: '#0891b2', bg: '#ecfeff', frase_inicio: '¡Solo los elegidos llegan aquí!', frase_nivel: '¡NIVEL 15! ¡Top 1%!' },
  { id: 16, tema: 'Química analítica avanzada', emoji: '🏆', color: '#be185d', bg: '#fdf2f8', frase_inicio: '¡Si llegas aquí, eres élite!', frase_nivel: '¡NIVEL 16! ¡Genio puro!' },
  { id: 17, tema: 'Fisicoquímica',              emoji: '🌀', color: '#7c3aed', bg: '#f5f3ff', frase_inicio: '¡La física y la química se abrazan!', frase_nivel: '¡NIVEL 17! ¡Eres un monstruo!' },
  { id: 18, tema: 'Química de materiales',      emoji: '🔩', color: '#1e40af', bg: '#eff6ff', frase_inicio: '¡Casi nadie llega aquí, campeón!', frase_nivel: '¡NIVEL 18! ¡Leyenda viva!' },
  { id: 19, tema: 'Bioquímica',                 emoji: '🧬', color: '#065f46', bg: '#ecfdf5', frase_inicio: '¡La química de la vida misma!', frase_nivel: '¡NIVEL 19! ¡Casi Dios!' },
  { id: 20, tema: 'Nivel: Albert Einsteinium',  emoji: '⚡', color: '#b45309', bg: '#fefce8', frase_inicio: '¡NIVEL FINAL! ¡Aquí termina todo!', frase_nivel: '¡NIVEL 20! ¡ERES EL ELEGIDO!' },
]

// ─── BANCO DE PREGUNTAS POR NIVEL ─────────────────────────────────────────────
const PREGUNTAS = {
  1:  [ // La cocina del químico
    { q: '¿Qué es una reacción química?', ops: ['Un cambio físico reversible', 'Una transformación que produce nuevas sustancias', 'Disolver sal en agua'], r: 1 },
    { q: 'Al mezclar vinagre y bicarbonato...', ops: ['No pasa nada', 'Se produce una reacción química con gas', 'Se forma agua pura'], r: 1 },
    { q: '¿Cuál es la fórmula del agua?', ops: ['HO', 'H₂O', 'H₃O'], r: 1 },
    { q: 'El hielo al derretirse es un cambio...', ops: ['Químico', 'Físico', 'Nuclear'], r: 1 },
    { q: 'El fuego es un ejemplo de...', ops: ['Cambio físico', 'Reacción química (combustión)', 'Mezcla homogénea'], r: 1 },
    { q: '¿Qué es la materia?', ops: ['Todo lo que tiene masa y ocupa espacio', 'Solo los líquidos y sólidos', 'La energía del universo'], r: 0 },
  ],
  2:  [ // Tabla periódica básica
    { q: '¿Cuál es el símbolo del oro?', ops: ['Go', 'Au', 'Or'], r: 1 },
    { q: '¿Cuál es el símbolo del sodio?', ops: ['So', 'Sd', 'Na'], r: 2 },
    { q: '¿Cuál es el gas más abundante en la atmósfera?', ops: ['Oxígeno', 'Nitrógeno', 'CO₂'], r: 1 },
    { q: '¿Cuántos elementos tiene la tabla periódica?', ops: ['98', '118', '137'], r: 1 },
    { q: 'El hierro tiene símbolo:', ops: ['Hr', 'Fe', 'Ir'], r: 1 },
    { q: 'Los metales alcalinos están en el grupo:', ops: ['1', '7', '18'], r: 0 },
  ],
  3:  [ // Estados de la materia
    { q: 'El paso de líquido a gas se llama:', ops: ['Fusión', 'Vaporización', 'Sublimación'], r: 1 },
    { q: 'El paso de sólido a líquido se llama:', ops: ['Fusión', 'Solidificación', 'Condensación'], r: 0 },
    { q: '¿Cuántos estados clásicos de la materia existen?', ops: ['2', '3', '4'], r: 1 },
    { q: 'La sublimación ocurre cuando un sólido pasa a:', ops: ['Líquido', 'Gas directamente', 'Plasma'], r: 1 },
    { q: 'En un gas, las moléculas están:', ops: ['Muy juntas y ordenadas', 'Separadas y en movimiento libre', 'Unidas pero en movimiento'], r: 1 },
    { q: 'El punto de ebullición del agua es:', ops: ['80°C', '100°C', '120°C'], r: 1 },
  ],
  4:  [ // Mezclas y soluciones
    { q: '¿Qué es una solución?', ops: ['Una mezcla heterogénea', 'Una mezcla homogénea de soluto y solvente', 'Un compuesto puro'], r: 1 },
    { q: 'El soluto es:', ops: ['El componente en mayor cantidad', 'La sustancia que se disuelve', 'El solvente concentrado'], r: 1 },
    { q: 'Una mezcla heterogénea se puede separar a simple vista:', ops: ['Nunca', 'Siempre', 'A veces'], r: 1 },
    { q: 'La filtración sirve para separar:', ops: ['Dos líquidos miscibles', 'Un sólido de un líquido', 'Dos gases'], r: 1 },
    { q: '¿Agua con sal es una mezcla...?', ops: ['Heterogénea', 'Homogénea', 'Compuesto puro'], r: 1 },
    { q: 'Una emulsión es:', ops: ['Mezcla de dos gases', 'Dispersión de un líquido en otro', 'Solución sólida'], r: 1 },
  ],
  5:  [ // Ácidos y bases
    { q: 'Una solución ácida tiene pH:', ops: ['Mayor a 7', 'Igual a 7', 'Menor a 7'], r: 2 },
    { q: 'El agua pura tiene pH:', ops: ['5', '7', '9'], r: 1 },
    { q: '¿Qué indica el pH?', ops: ['Presión hidrostática', 'Potencial de hidrógeno (acidez/basicidad)', 'Peso del hidrógeno'], r: 1 },
    { q: 'El HCl es un ácido:', ops: ['Débil', 'Fuerte', 'Neutro'], r: 1 },
    { q: 'Al mezclar ácido y base se produce:', ops: ['Solo agua', 'Una sal y agua (neutralización)', 'Un ácido más fuerte'], r: 1 },
    { q: 'Una base en solución acuosa produce:', ops: ['H⁺', 'OH⁻', 'Cl⁻'], r: 1 },
  ],
  6:  [ // Reacciones químicas
    { q: 'En una reacción de combustión siempre participa:', ops: ['Agua', 'Oxígeno', 'Nitrógeno'], r: 1 },
    { q: 'Una reacción exotérmica:', ops: ['Absorbe calor', 'Libera calor', 'No cambia temperatura'], r: 1 },
    { q: 'La Ley de Conservación de la Masa dice:', ops: ['La masa aumenta al reaccionar', 'La masa total se conserva', 'La masa desaparece'], r: 1 },
    { q: 'Un catalizador:', ops: ['Se consume en la reacción', 'Acelera la reacción sin consumirse', 'Eleva la temperatura final'], r: 1 },
    { q: 'Una reacción endotérmica:', ops: ['Libera calor', 'Absorbe calor del entorno', 'No requiere energía'], r: 1 },
    { q: 'El reactivo limitante es:', ops: ['El que sobra', 'El que se agota primero', 'El producto principal'], r: 1 },
  ],
  7:  [ // Concentraciones
    { q: 'La molaridad se mide en:', ops: ['g/L', 'mol/L', 'mg/mL'], r: 1 },
    { q: '1 M de NaCl significa:', ops: ['1g de NaCl por litro', '1 mol de NaCl por litro', '1% de NaCl en peso'], r: 1 },
    { q: 'La concentración ppm equivale a:', ops: ['Partes por millón', 'Presión por masa', 'Partes por mililitro'], r: 0 },
    { q: 'Una dilución reduce:', ops: ['El volumen de la solución', 'La concentración del soluto', 'La masa del soluto'], r: 1 },
    { q: 'En C₁V₁ = C₂V₂, esto representa:', ops: ['Ley de gases', 'Principio de dilución', 'Equilibrio ácido-base'], r: 1 },
    { q: 'El porcentaje p/p mide:', ops: ['Masa de soluto por 100 mL de solución', 'Masa de soluto por 100 g de solución', 'Volumen de soluto por 100 g'], r: 1 },
  ],
  8:  [ // Estequiometría
    { q: 'El número de Avogadro es:', ops: ['6.02 × 10²³', '3.14 × 10¹⁵', '1.67 × 10⁻²⁷'], r: 0 },
    { q: 'Un mol de cualquier sustancia contiene:', ops: ['6.02 × 10²³ partículas', '1000 átomos', '1 g de masa'], r: 0 },
    { q: 'La masa molar es:', ops: ['Masa de 1 átomo en gramos', 'Masa en gramos de 1 mol de sustancia', 'Número de moles por litro'], r: 1 },
    { q: 'El rendimiento de una reacción mide:', ops: ['Velocidad de reacción', 'Fracción del producto teórico obtenido realmente', 'Temperatura máxima'], r: 1 },
    { q: 'Para balancear una ecuación se conserva:', ops: ['Solo la masa', 'Masa y carga', 'Solo el número de moléculas'], r: 1 },
    { q: 'El exceso en una reacción es:', ops: ['El reactivo que se agota', 'El reactivo que sobra después', 'El producto secundario'], r: 1 },
  ],
  9:  [ // Enlace químico
    { q: 'El enlace iónico ocurre por:', ops: ['Compartición de electrones', 'Transferencia de electrones', 'Fuerzas de Van der Waals'], r: 1 },
    { q: 'El enlace covalente ocurre por:', ops: ['Transferencia de electrones', 'Compartición de electrones', 'Atracción electrostática pura'], r: 1 },
    { q: 'El NaCl es un ejemplo de enlace:', ops: ['Covalente polar', 'Iónico', 'Metálico'], r: 1 },
    { q: 'Las fuerzas de Van der Waals son:', ops: ['Interacciones fuertes entre iones', 'Interacciones débiles entre moléculas neutras', 'Enlaces covalentes dobles'], r: 1 },
    { q: 'El puente de hidrógeno se forma entre:', ops: ['Cualquier molécula polar', 'H unido a N, O o F con otro átomo electronegativo', 'Dos metales'], r: 1 },
    { q: 'La electronegatividad mide:', ops: ['La masa del electrón', 'Atracción de un átomo por electrones en un enlace', 'Número de protones'], r: 1 },
  ],
  10: [ // Química orgánica básica
    { q: 'Los compuestos orgánicos están basados en:', ops: ['Nitrógeno', 'Carbono', 'Oxígeno'], r: 1 },
    { q: 'El grupo funcional -OH es característico de:', ops: ['Cetonas', 'Alcoholes', 'Éteres'], r: 1 },
    { q: 'El metano (CH₄) es un:', ops: ['Alcohol', 'Alcano', 'Alqueno'], r: 1 },
    { q: 'Un alqueno tiene:', ops: ['Solo enlaces simples C-C', 'Al menos un doble enlace C=C', 'Solo triples enlaces'], r: 1 },
    { q: 'La saponificación produce:', ops: ['Ésteres', 'Jabón (sal de ácido graso) y glicerol', 'Ácidos fuertes'], r: 1 },
    { q: 'El sufijo -ol en nomenclatura IUPAC indica:', ops: ['Aldehído', 'Alcohol', 'Ácido carboxílico'], r: 1 },
  ],
  11: [ // Separación de mezclas
    { q: 'La destilación separa por diferencia de:', ops: ['Densidad', 'Punto de ebullición', 'Solubilidad'], r: 1 },
    { q: 'La cromatografía separa por diferencia de:', ops: ['Tamaño molecular', 'Afinidad por fase estacionaria vs. móvil', 'Punto de fusión'], r: 1 },
    { q: 'La filtración separa:', ops: ['Dos líquidos', 'Un sólido de un líquido', 'Dos gases'], r: 1 },
    { q: 'La cristalización aprovecha diferencias de:', ops: ['Densidad', 'Solubilidad con la temperatura', 'Punto de ebullición'], r: 1 },
    { q: 'La centrifugación separa por diferencia de:', ops: ['Punto de fusión', 'Densidad bajo fuerza centrífuga', 'Solubilidad'], r: 1 },
    { q: 'La extracción líquido-líquido se basa en:', ops: ['Diferencia de ebullición', 'Diferente solubilidad en dos solventes inmiscibles', 'Diferencia de masa'], r: 1 },
  ],
  12: [ // Termodinámica básica
    { q: 'La entalpía (ΔH) mide:', ops: ['Velocidad de reacción', 'Calor intercambiado a presión constante', 'Concentración del producto'], r: 1 },
    { q: 'ΔH negativo indica una reacción:', ops: ['Endotérmica', 'Exotérmica', 'En equilibrio'], r: 1 },
    { q: 'La entropía (S) mide:', ops: ['Energía total del sistema', 'Desorden o aleatoriedad del sistema', 'Temperatura de reacción'], r: 1 },
    { q: 'La energía de Gibbs (ΔG) negativa indica:', ops: ['Reacción no espontánea', 'Reacción espontánea', 'Equilibrio perfecto'], r: 1 },
    { q: 'La primera ley de la termodinámica dice:', ops: ['El calor siempre fluye al frío', 'La energía no se crea ni destruye', 'La entropía siempre aumenta'], r: 1 },
    { q: 'La temperatura afecta la velocidad de reacción porque:', ops: ['Cambia el pH', 'Aumenta la energía cinética de las moléculas', 'Reduce la concentración'], r: 1 },
  ],
  13: [ // Electroquímica
    { q: 'La oxidación implica:', ops: ['Ganancia de electrones', 'Pérdida de electrones', 'Ganancia de protones'], r: 1 },
    { q: 'La reducción implica:', ops: ['Pérdida de electrones', 'Ganancia de electrones', 'Pérdida de masa'], r: 1 },
    { q: 'En una celda galvánica, el ánodo es donde ocurre:', ops: ['Reducción', 'Oxidación', 'Neutralización'], r: 1 },
    { q: 'La corrosión del hierro es un proceso de:', ops: ['Reducción pura', 'Oxidación (oxidación del Fe)', 'Neutralización'], r: 1 },
    { q: 'La electrólisis usa energía eléctrica para:', ops: ['Generar calor', 'Provocar reacciones no espontáneas', 'Medir pH'], r: 1 },
    { q: 'El potencial de reducción estándar mide:', ops: ['Velocidad de transferencia de electrones', 'Tendencia de una especie a ganar electrones', 'Concentración de iones'], r: 1 },
  ],
  14: [ // Cinética química
    { q: 'La cinética química estudia:', ops: ['Energía de las reacciones', 'Velocidad y mecanismo de las reacciones', 'Equilibrio termodinámico'], r: 1 },
    { q: 'La energía de activación es:', ops: ['Calor liberado en la reacción', 'Energía mínima para que ocurra la reacción', 'Temperatura final'], r: 1 },
    { q: 'Un inhibidor:', ops: ['Acelera la reacción', 'Disminuye la velocidad de reacción', 'No cambia la velocidad'], r: 1 },
    { q: 'La constante de velocidad k depende principalmente de:', ops: ['Concentración del reactivo', 'Temperatura', 'Presión del sistema'], r: 1 },
    { q: 'Una reacción de orden cero:', ops: ['Depende mucho de la concentración', 'No depende de la concentración', 'Solo ocurre con catalizadores'], r: 1 },
    { q: 'El tiempo de vida media en cinética es:', ops: ['Tiempo total de la reacción', 'Tiempo en que la concentración se reduce a la mitad', 'Periodo de inducción'], r: 1 },
  ],
  15: [ // Análisis químico
    { q: 'La titulación determina:', ops: ['El pH de una solución', 'La concentración usando una solución de concentración conocida', 'La masa del soluto'], r: 1 },
    { q: 'El punto de equivalencia en una titulación es cuando:', ops: ['El indicador cambia de color', 'Los moles de ácido y base se han neutralizado', 'La solución llega a pH 7 siempre'], r: 1 },
    { q: 'La ley de Beer-Lambert relaciona:', ops: ['pH y temperatura', 'Absorbancia y concentración de una solución', 'Presión y volumen'], r: 1 },
    { q: 'La espectroscopia UV-Vis mide:', ops: ['Masa molecular', 'Absorbancia de luz en el espectro UV y visible', 'Punto de ebullición'], r: 1 },
    { q: 'Un indicador ácido-base:', ops: ['Neutraliza la solución', 'Cambia de color según el pH', 'Mide la temperatura'], r: 1 },
    { q: 'La absorción atómica (AAS) se usa para:', ops: ['Separar mezclas', 'Cuantificar metales en solución', 'Medir viscosidad'], r: 1 },
  ],
  16: [ // Química analítica avanzada
    { q: 'La cromatografía HPLC separa bajo:', ops: ['Temperatura elevada', 'Alta presión con fase estacionaria', 'Campo eléctrico'], r: 1 },
    { q: 'La espectrometría de masas separa por:', ops: ['Solubilidad', 'Relación masa/carga (m/z)', 'Punto de ebullición'], r: 1 },
    { q: 'La electroforesis separa por:', ops: ['Diferencia de densidad', 'Tamaño y carga bajo campo eléctrico', 'Afinidad a solventes'], r: 1 },
    { q: 'El coeficiente de partición Kd mide:', ops: ['Velocidad de difusión', 'Distribución de un soluto entre dos fases', 'Viscosidad del solvente'], r: 1 },
    { q: 'La espectroscopía IR identifica:', ops: ['Masa molecular', 'Grupos funcionales por absorción infrarroja', 'Número de isótopos'], r: 1 },
    { q: 'La GC (cromatografía de gases) analiza:', ops: ['Solo compuestos iónicos', 'Compuestos volátiles', 'Proteínas y ADN'], r: 1 },
  ],
  17: [ // Fisicoquímica
    { q: 'La constante de equilibrio Keq expresa:', ops: ['Velocidad de la reacción', 'Relación entre concentraciones de productos y reactivos en equilibrio', 'Temperatura de equilibrio'], r: 1 },
    { q: 'El principio de Le Chatelier dice que:', ops: ['El equilibrio es permanente', 'Un sistema en equilibrio se opone a perturbaciones', 'Los gases siempre se expanden'], r: 1 },
    { q: 'La tensión superficial se debe a:', ops: ['Diferencia de temperatura', 'Fuerzas de cohesión entre moléculas superficiales', 'Presión atmosférica'], r: 1 },
    { q: 'La osmosis es el paso de:', ops: ['Soluto por membrana semipermeable', 'Solvente de zona diluida a concentrada por membrana semipermeable', 'Gas a través de membrana'], r: 1 },
    { q: 'La viscosidad mide:', ops: ['Densidad del líquido', 'Resistencia a fluir', 'Tensión superficial'], r: 1 },
    { q: 'El potencial químico determina:', ops: ['Temperatura de fusión', 'Dirección de flujo espontáneo de masa entre fases', 'Velocidad de difusión'], r: 1 },
  ],
  18: [ // Química de materiales
    { q: 'Los polímeros son:', ops: ['Moléculas pequeñas y simples', 'Cadenas largas de unidades repetitivas (monómeros)', 'Sales inorgánicas'], r: 1 },
    { q: 'Un material amorfo carece de:', ops: ['Masa definida', 'Estructura cristalina ordenada', 'Enlace químico'], r: 1 },
    { q: 'La dureza de un material en la escala Mohs mide:', ops: ['Resistencia a la temperatura', 'Resistencia al rayado', 'Conductividad eléctrica'], r: 1 },
    { q: 'Los nanomateriales tienen propiedades distintas por:', ops: ['Ser más pesados', 'Su tamaño extremadamente pequeño (1-100 nm)', 'Contener más electrones'], r: 1 },
    { q: 'La corrosión galvánica ocurre entre:', ops: ['Dos metales iguales', 'Dos metales distintos en contacto con electrolito', 'Metales y plásticos'], r: 1 },
    { q: 'Un semiconductor tiene conductividad:', ops: ['Igual al cobre', 'Intermedia entre conductor y aislante', 'Nula siempre'], r: 1 },
  ],
  19: [ // Bioquímica
    { q: 'Las proteínas son polímeros de:', ops: ['Glucosa', 'Aminoácidos', 'Ácidos grasos'], r: 1 },
    { q: 'La desnaturalización de una proteína implica:', ops: ['Síntesis de nuevas proteínas', 'Pérdida de estructura tridimensional sin romper secuencia', 'Digestión enzimática'], r: 1 },
    { q: 'El ATP es:', ops: ['Un aminoácido esencial', 'La moneda energética de la célula', 'Un lípido estructural'], r: 1 },
    { q: 'Las enzimas son catalizadores:', ops: ['Inorgánicos', 'Biológicos (generalmente proteínas)', 'Metálicos'], r: 1 },
    { q: 'El ADN se compone de:', ops: ['Aminoácidos y lípidos', 'Nucleótidos con desoxirribosa', 'Glucosa y fósforo'], r: 1 },
    { q: 'La glucólisis produce principalmente:', ops: ['Oxígeno', 'ATP y piruvato a partir de glucosa', 'Proteínas estructurales'], r: 1 },
  ],
  20: [ // Albert Einsteinium
    { q: 'El potencial zeta mide:', ops: ['pH de una suspensión', 'Carga eléctrica superficial de partículas coloidales', 'Viscosidad del solvente'], r: 1 },
    { q: 'La quiralidad en química se refiere a:', ops: ['Molécula con doble enlace', 'Molécula no superponible a su imagen especular', 'Tipo de reacción de sustitución'], r: 1 },
    { q: 'La constante de acidez Ka mide:', ops: ['pH de un ácido fuerte', 'Grado de disociación de un ácido débil en agua', 'Temperatura de neutralización'], r: 1 },
    { q: 'La RMN (resonancia magnética nuclear) identifica:', ops: ['Masa molecular exacta', 'Entorno químico de núcleos atómicos', 'Punto de ebullición'], r: 1 },
    { q: 'La ecuación de Arrhenius k = A·e^(-Ea/RT) relaciona:', ops: ['Concentración y velocidad', 'Constante de velocidad y temperatura', 'Equilibrio y presión'], r: 1 },
    { q: 'El coeficiente de actividad γ corrige:', ops: ['Diferencias de temperatura', 'Desviaciones del comportamiento ideal en soluciones reales', 'Errores de medición'], r: 1 },
  ],
}

// ─── FRASES DE MOTIVACIÓN / BURLA ─────────────────────────────────────────────
const FRASES_CORRECTA = ['¡Así se hace! 🔥', '¡Exacto! 💪', '¡Crack! ✅', '¡Brillante! ⚡', '¡Perfecto! 🎯', '¡Eso mismo! 🧪']
const FRASES_MAL = ['¡Uy, no! 😬', '¡Fallaste! ❌', '¡Repasa eso! 📚', '¡Casi! 😅', '¡No era esa! 🤔', '¡Ups! 💀']
const FRASES_NIVEL = (n) => NIVELES[n - 1]?.frase_nivel || '¡Subiste de nivel!'
const FRASES_RACHA = ['🔥 x2', '🔥🔥 x3', '⚡ x4', '🌪️ x5', '💥 COMBO!']



// ─── PANTALLA INICIO ──────────────────────────────────────────────────────────
function PantallaInicio({ onStart }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-8 gap-5">
      <div className="text-7xl animate-bounce">🧪</div>
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: '#1e3a5f' }}>¿Cuánto sabes de química?</h1>
        <p className="text-sm" style={{ color: '#6b9fd4' }}>20 niveles temáticos · 30 segundos cada uno · ¡3 correctas seguidas para subir!</p>
      </div>
      <div className="w-full rounded-2xl p-4 text-left" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>¿Cómo funciona?</p>
        {[
          ['⏱️', '30 segundos por nivel — si se acaba, fin del juego'],
          ['✅', '3 respuestas correctas seguidas = siguiente nivel'],
          ['❌', 'Si fallas, el contador de correctas se reinicia a 0'],
          ['⚡', 'Más rápido respondes = más puntos'],
          ['🔥', 'Racha perfecta = multiplicador de puntos'],
        ].map(([ico, txt]) => (
          <div key={txt} className="flex items-start gap-2 mb-1.5">
            <span>{ico}</span><p className="text-xs" style={{ color: '#6b9fd4' }}>{txt}</p>
          </div>
        ))}
      </div>
      <div className="w-full rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid #bfdbfe' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>Evolución según puntos:</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {PERSONAJES.map(p => (
            <div key={p.id} className="flex flex-col items-center" title={`${p.nombre} (${p.min} pts)`}>
              <span className="text-lg">{p.emoji}</span>
              <span className="text-[7px]" style={{ color: '#93c5fd' }}>{p.min}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onStart} className="w-full py-4 rounded-2xl text-white font-black text-lg active:scale-95 transition-all"
        style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
        ¡Empezar! 🚀
      </button>
    </div>
  )
}

// ─── JUEGO PRINCIPAL ──────────────────────────────────────────────────────────
function JuegoPrincipal({ onGameOver }) {
  const TIEMPO_MAX = 30
  const [nivelIdx, setNivelIdx] = useState(0)          // 0-19
  const [tiempo, setTiempo] = useState(TIEMPO_MAX)
  const [correctasNivel, setCorrectasNivel] = useState(0) // correctas seguidas en nivel actual
  const [preguntasNivel, setPreguntasNivel] = useState(() => shuffle(PREGUNTAS[1]))
  const [pregIdx, setPregIdx] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [feedback, setFeedback] = useState(null)       // {ok, frase}
  const [flashNivel, setFlashNivel] = useState(null)    // frase flash al subir nivel
  const [puntos, setPuntos] = useState(0)
  const [racha, setRacha] = useState(0)
  const [statsNiveles, setStatsNiveles] = useState([])  // historial
  const tiempoRef = useRef(TIEMPO_MAX)
  const bloqueado = useRef(false)
  const gameOverRef = useRef(false)

  const nivelDef = NIVELES[nivelIdx]
  const pregunta = preguntasNivel[pregIdx % preguntasNivel.length]

  // Cronómetro
  useEffect(() => {
    if (gameOverRef.current) return
    const t = setInterval(() => {
      tiempoRef.current -= 1
      setTiempo(tiempoRef.current)
      if (tiempoRef.current <= 0 && !gameOverRef.current) {
        gameOverRef.current = true
        clearInterval(t)
        onGameOver({ puntos, racha, nivelMax: nivelIdx + 1, statsNiveles })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [nivelIdx])

  const subirNivel = useCallback((ptsActuales, rachaActual, statsActuales) => {
    const siguienteIdx = nivelIdx + 1
    if (siguienteIdx >= NIVELES.length) {
      gameOverRef.current = true
      onGameOver({ puntos: ptsActuales, racha: rachaActual, nivelMax: NIVELES.length, statsNiveles: statsActuales, ganador: true })
      return
    }
    const frase = FRASES_NIVEL(siguienteIdx + 1)
    setFlashNivel(frase)
    setTimeout(() => setFlashNivel(null), 1800)
    tiempoRef.current = TIEMPO_MAX
    setTiempo(TIEMPO_MAX)
    setNivelIdx(siguienteIdx)
    setCorrectasNivel(0)
    setPreguntasNivel(shuffle(PREGUNTAS[NIVELES[siguienteIdx].id]))
    setPregIdx(0)
  }, [nivelIdx, onGameOver])

  const responder = useCallback((opIdx) => {
    if (bloqueado.current || gameOverRef.current) return
    bloqueado.current = true
    const ok = opIdx === pregunta.r
    const tiempoRespuesta = TIEMPO_MAX - tiempoRef.current
    const bonusVelocidad = ok ? Math.max(1, Math.round((TIEMPO_MAX - tiempoRespuesta) / 3)) : 0
    const nuevaRacha = ok ? racha + 1 : 0
    const multiplicador = ok ? Math.max(1, Math.floor(nuevaRacha / 3) + 1) : 1
    const ptsGanados = ok ? (10 + bonusVelocidad) * multiplicador : 0
    const nuevosPuntos = puntos + ptsGanados
    const nuevoCorrectas = ok ? correctasNivel + 1 : 0
    const frase = ok ? FRASES_CORRECTA[Math.floor(Math.random() * FRASES_CORRECTA.length)] : FRASES_MAL[Math.floor(Math.random() * FRASES_MAL.length)]

    setSeleccion(opIdx)
    setFeedback({ ok, frase, pts: ptsGanados, multiplicador })
    setPuntos(nuevosPuntos)
    setRacha(nuevaRacha)
    setCorrectasNivel(nuevoCorrectas)

    setTimeout(() => {
      setSeleccion(null)
      setFeedback(null)
      setPregIdx(i => i + 1)
      bloqueado.current = false

      if (nuevoCorrectas >= 3) {
        const nuevasStats = [...statsNiveles, { nivel: nivelIdx + 1, tema: nivelDef.tema }]
        setStatsNiveles(nuevasStats)
        subirNivel(nuevosPuntos, nuevaRacha, nuevasStats)
      }
    }, ok ? 500 : 700)
  }, [pregunta, racha, puntos, correctasNivel, nivelIdx, nivelDef, statsNiveles, subirNivel])

  const pctTiempo = (tiempo / TIEMPO_MAX) * 100
  const colorTiempo = tiempo > 15 ? nivelDef.color : tiempo > 8 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col gap-3 px-3 py-4 relative">

      {/* Flash al subir nivel */}
      {flashNivel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.92)', backdropFilter: 'blur(4px)' }}>
          <div className="text-center">
            <div className="text-5xl mb-2">🚀</div>
            <p className="text-white font-black text-xl px-4">{flashNivel}</p>
            <p className="text-blue-200 text-sm mt-1">{NIVELES[nivelIdx]?.tema}</p>
          </div>
        </div>
      )}

      {/* Header: nivel + puntos + racha */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nivelDef.emoji}</span>
          <div>
            <p className="text-[10px] font-bold leading-none" style={{ color: '#93c5fd' }}>NIVEL {nivelIdx + 1}/20</p>
            <p className="text-xs font-bold leading-tight" style={{ color: '#1e3a5f' }}>{nivelDef.tema}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black tabular-nums leading-none" style={{ color: '#1d4ed8' }}>{puntos}</p>
          {racha >= 2 && <p className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>{FRASES_RACHA[Math.min(racha - 2, 4)]}</p>}
        </div>
      </div>

      {/* Barra de tiempo */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-black tabular-nums w-6" style={{ color: colorTiempo }}>{tiempo}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pctTiempo}%`, background: colorTiempo }} />
          </div>
        </div>
        {/* Progreso correctas en nivel */}
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-8 h-1.5 rounded-full transition-all" style={{ background: i < correctasNivel ? nivelDef.color : '#dbeafe' }} />
          ))}
        </div>
        <p className="text-center text-[10px] mt-0.5" style={{ color: '#93c5fd' }}>{correctasNivel}/3 para subir de nivel</p>
      </div>

      {/* Pregunta */}
      <div className="rounded-2xl p-4 min-h-[80px] flex items-center justify-center"
        style={{ background: `${nivelDef.bg}`, border: `1.5px solid ${nivelDef.color}40`, backdropFilter: 'blur(8px)' }}>
        <p className="text-[15px] font-semibold leading-snug text-center" style={{ color: '#1e3a5f' }}>{pregunta.q}</p>
      </div>

      {/* 3 Opciones */}
      <div className="flex flex-col gap-2">
        {pregunta.ops.map((op, i) => {
          let bg = 'rgba(255,255,255,0.85)', border = '#bfdbfe', color = '#1e3a5f', fontW = '500'
          if (seleccion !== null) {
            if (i === pregunta.r) { bg = '#f0fdf4'; border = '#4ade80'; color = '#15803d'; fontW = '700' }
            else if (i === seleccion) { bg = '#fff1f2'; border = '#fca5a5'; color = '#dc2626' }
            else { bg = 'rgba(255,255,255,0.4)'; color = '#9ca3af' }
          }
          return (
            <button key={i} onClick={() => responder(i)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98]"
              style={{ background: bg, border: `1.5px solid ${border}`, color, fontWeight: fontW, backdropFilter: 'blur(6px)' }}>
              <span className="font-black mr-2 text-xs" style={{ color: '#93c5fd' }}>{['A', 'B', 'C'][i]}</span>
              {op}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center py-1">
          <p className="text-sm font-black" style={{ color: feedback.ok ? '#16a34a' : '#dc2626' }}>{feedback.frase}</p>
          {feedback.ok && feedback.pts > 0 && (
            <p className="text-xs font-bold" style={{ color: '#2563eb' }}>+{feedback.pts} pts{feedback.multiplicador > 1 ? ` ×${feedback.multiplicador}` : ''}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PANTALLA GAME OVER / RESULTADO ──────────────────────────────────────────
function PantallaFinal({ stats, onReiniciar }) {
  const { puntos, racha, nivelMax, statsNiveles, ganador } = stats
  const per = getPersonaje(puntos)
  const [frameIdx, setFrameIdx] = useState(0)
  const frames = PERSONAJES.filter(p => p.min <= puntos)

  useEffect(() => {
    if (frameIdx < frames.length - 1) {
      const t = setTimeout(() => setFrameIdx(i => i + 1), 280)
      return () => clearTimeout(t)
    }
  }, [frameIdx, frames.length])

  return (
    <div className="flex flex-col items-center text-center px-4 py-6 gap-4">
      {/* Animación evolución */}
      <div>
        <div className="text-7xl mb-1" style={{ filter: 'drop-shadow(0 4px 16px rgba(37,99,235,0.25))' }}>
          {frames[frameIdx]?.emoji || per.emoji}
        </div>
        <div className="flex justify-center gap-0.5 mb-2">
          {frames.map((f, i) => (
            <span key={f.id} className="text-sm transition-all" style={{ opacity: i <= frameIdx ? 1 : 0.2 }}>{f.emoji}</span>
          ))}
        </div>
      </div>

      {ganador ? (
        <div><p className="text-xs font-bold mb-0.5" style={{ color: '#f59e0b' }}>🏆 ¡COMPLETASTE LOS 20 NIVELES! 🏆</p></div>
      ) : (
        <div><p className="text-xs font-bold mb-0.5" style={{ color: '#ef4444' }}>⏰ SE ACABÓ EL TIEMPO EN NIVEL {nivelMax}</p></div>
      )}

      <div>
        <h2 className="text-xl font-black" style={{ color: '#1e3a5f' }}>{per.nombre}</h2>
        <p className="text-sm italic" style={{ color: '#6b9fd4' }}>"{per.desc}"</p>
      </div>

      {/* Stats */}
      <div className="w-full rounded-2xl p-4 space-y-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div className="flex justify-between"><span className="text-sm" style={{ color: '#6b9fd4' }}>Puntos totales</span><span className="text-lg font-black" style={{ color: '#1d4ed8' }}>{puntos}</span></div>
        <div className="flex justify-between"><span className="text-sm" style={{ color: '#6b9fd4' }}>Nivel máximo</span><span className="text-sm font-bold" style={{ color: '#1d4ed8' }}>{nivelMax}/20 — {NIVELES[nivelMax-1]?.tema}</span></div>
        <div className="flex justify-between"><span className="text-sm" style={{ color: '#6b9fd4' }}>Racha máxima</span><span className="text-sm font-bold" style={{ color: '#f59e0b' }}>🔥 {racha} seguidas</span></div>
        {statsNiveles.length > 0 && (
          <div className="pt-1 border-t border-blue-100">
            <p className="text-xs font-bold mb-1" style={{ color: '#6b9fd4' }}>Niveles superados:</p>
            <div className="flex flex-wrap gap-1">
              {statsNiveles.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  {NIVELES[s.nivel - 1]?.emoji} Nv.{s.nivel}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Escala personajes */}
      <div className="w-full rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid #bfdbfe' }}>
        <div className="grid grid-cols-5 gap-1">
          {PERSONAJES.map(p => (
            <div key={p.id} className="flex flex-col items-center p-1 rounded-lg"
              style={{ background: puntos >= p.min ? 'rgba(37,99,235,0.1)' : 'transparent', border: per.id === p.id ? '1.5px solid #2563eb' : '1.5px solid transparent' }}>
              <span className="text-xl" style={{ opacity: puntos >= p.min ? 1 : 0.2 }}>{p.emoji}</span>
              <span className="text-[7px] leading-tight text-center" style={{ color: puntos >= p.min ? '#1d4ed8' : '#93c5fd' }}>{p.nombre.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReiniciar} className="w-full py-3 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
        style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
        🔄 Jugar de nuevo
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function QuimicaGamePage() {
  const { session } = useAuth()
  const [pantalla, setPantalla] = useState('inicio')
  const [statsFinales, setStatsFinales] = useState(null)

  async function guardarResultado(pts, per) {
    if (!session?.user?.id) return
    try {
      const { data: current } = await supabase
        .from('profiles')
        .select('quimica_pts')
        .eq('id', session.user.id)
        .single()
      // Solo guardar si supera el récord anterior
      if (!current || pts > (current.quimica_pts || 0)) {
        await supabase.from('profiles').update({
          quimica_pts: pts,
          quimica_personaje: per.emoji,
          quimica_nombre: per.nombre,
        }).eq('id', session.user.id)
      }
    } catch (e) { console.error('Error guardando resultado:', e) }
  }

  function iniciar() { setPantalla('juego') }
  function gameOver(stats) {
    setStatsFinales(stats)
    setPantalla('final')
    const per = getPersonaje(stats.puntos)
    guardarResultado(stats.puntos, per)
  }
  function reiniciar() { setPantalla('juego') }

  return (
    <div className="max-w-lg mx-auto" style={{ paddingBottom: 100 }}>
      <div className="rounded-2xl overflow-hidden shadow-sm mx-3 mt-3" style={{ background: '#ffffff', border: '0.5px solid #e8eaef' }}>
        {pantalla === 'inicio' && <PantallaInicio onStart={iniciar} />}
        {pantalla === 'juego' && <JuegoPrincipal key={Date.now()} onGameOver={gameOver} />}
        {pantalla === 'final' && statsFinales && <PantallaFinal stats={statsFinales} onReiniciar={reiniciar} />}
      </div>
    </div>
  )
}
