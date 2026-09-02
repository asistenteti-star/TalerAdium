/* ═══ CONSTRUCTORES DE TEXTO · dimensiones seleccionables ═══ */
const BUILDER_DIMS = [
  { id:'apertura', label:'Nivel de apertura ante nuevas tecnologías',
    opts: [
      { v:'frio', t:'Frío / escéptico', frase:'se muestra escéptico ante propuestas nuevas de la industria y suele cuestionar cualquier evidencia presentada' },
      { v:'neutral', t:'Neutral', frase:'no tiene una postura definida frente a nuevas tecnologías y evalúa cada caso de forma independiente' },
      { v:'receptivo', t:'Receptivo', frase:'está abierto a evaluar nuevas alternativas cuando la evidencia es sólida' },
    ]},
  { id:'presion', label:'Presión que enfrenta actualmente',
    opts: [
      { v:'presupuestal', t:'Presupuestal', frase:'Enfrenta presión para reducir gasto o cumplir un techo presupuestal ajustado' },
      { v:'clinica', t:'Resultados clínicos', frase:'Está bajo presión por mejorar indicadores clínicos o de calidad de atención' },
      { v:'institucional', t:'Política institucional', frase:'Responde a lineamientos internos o políticos que condicionan sus decisiones' },
      { v:'ninguna', t:'Sin presión evidente', frase:'No enfrenta una presión particular identificada en este momento' },
    ]},
  { id:'relacion', label:'Relación previa con Adium / Suprahyal',
    opts: [
      { v:'ninguna', t:'Sin relación previa', frase:'No tiene relación previa con Adium ni conoce el portafolio' },
      { v:'ocasional', t:'Cliente ocasional', frase:'Ha tenido contacto ocasional con Adium pero sin una relación consolidada' },
      { v:'activo', t:'Cliente activo', frase:'Mantiene una relación comercial activa y conoce el portafolio' },
      { v:'competencia', t:'Usa alternativa establecida', frase:'Actualmente trabaja con una alternativa de la competencia ya consolidada en su institución' },
    ]},
  { id:'objecion', label:'Principal objeción esperada',
    opts: [
      { v:'precio', t:'Precio', frase:'Su objeción más probable es el precio frente a alternativas disponibles' },
      { v:'evidencia', t:'Falta de evidencia local', frase:'Su objeción más probable es la falta de evidencia generada en su propio país' },
      { v:'alternativa', t:'Ya tiene alternativa', frase:'Su objeción más probable es que ya cuenta con una alternativa que considera suficiente' },
      { v:'proceso', t:'Proceso burocrático lento', frase:'Su objeción más probable está relacionada con la lentitud de su propio proceso interno de incorporación' },
    ]},
];

const BUILDER2_DIMS = [
  { id:'tipo', label:'Tipo de dato adicional',
    opts:[
      { v:'local', t:'Estudio local propio', frase:'un estudio local generado en el propio mercado' },
      { v:'cartera', t:'Dato de cartera de pacientes', frase:'datos reales de la cartera de pacientes de esta institución' },
      { v:'precio', t:'Comparador de precio de mercado', frase:'una comparación de precio frente a las alternativas disponibles en este mercado' },
      { v:'epi', t:'Dato epidemiológico regional', frase:'un dato epidemiológico específico de la región' },
      { v:'otro', t:'Otro estudio publicado', frase:'un estudio publicado adicional a la evidencia ya verificada' },
    ]},
  { id:'fuente', label:'Fuente del dato',
    opts:[
      { v:'adium', t:'Base de datos institucional Adium', frase:'proveniente de las bases internas de Adium' },
      { v:'publicacion', t:'Publicación científica adicional', frase:'proveniente de una publicación científica adicional' },
      { v:'equipo', t:'Estimación del equipo comercial', frase:'construido como estimación del equipo comercial local' },
      { v:'pagador', t:'Aportado por el propio pagador', frase:'aportado directamente por el pagador en conversaciones previas' },
    ]},
];
