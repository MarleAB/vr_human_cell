export interface Question {
  text: string
  options: string[]
  correct: number
  explanation: string
}

export interface CellPart {
  id: string
  name: string
  emoji: string
  color: string
  /** Punto en el suelo al que debe llegar el jugador (checkpoint) */
  checkpoint: [number, number, number]
  /** Punto del orgánulo al que apunta la etiqueta */
  target: [number, number, number]
  /** Posición flotante de la etiqueta */
  labelPos: [number, number, number]
  description: string
  func: string
  fact: string
  question: Question
}

export const CELL_RADIUS = 26
export const WALK_RADIUS = 24.5
export const EYE_HEIGHT = 1.6
export const TRIGGER_DISTANCE = 2.3
export const START_POSITION: [number, number, number] = [0, 0, 17]
/** Orientación inicial: mirando hacia +z (la membrana y el primer checkpoint) */
export const START_YAW = Math.PI

/** Núcleo: centro, radio y apertura (ángulos en grados, convención atan2(z, x)) */
export const NUCLEUS = {
  center: [0, 3.2, -3] as [number, number, number],
  radius: 5,
  floorRadius: 3.84,
  openingStart: 85,
  openingEnd: 185,
}

export const CENTROSOME_POS: [number, number, number] = [12, 1.2, 10]
export const GOLGI_POS: [number, number, number] = [-12, 2.0, 4]
export const GOLGI_YAW = 0.528
export const EXOCYTOSIS_POINT: [number, number, number] = [-11.6, 1.5, 23.2]
export const VESICLE_START: [number, number, number] = [-14.2, 1.7, 5.3]

export const COLLIDERS: { x: number; z: number; r: number }[] = [
  { x: 16, z: -1, r: 2.9 }, // mitocondria principal
  { x: -16, z: -11, r: 2.9 }, // mitocondria decorativa
  { x: 3, z: 9, r: 2.6 }, // mitocondria decorativa
  { x: -12, z: 4, r: 2.4 }, // Golgi
  { x: 12, z: 10, r: 1.0 }, // centrosoma
]

export const CELL_PARTS: CellPart[] = [
  {
    id: 'membrana',
    name: 'Membrana plasmática',
    emoji: '🧱',
    color: '#4fb8ee',
    checkpoint: [0, 0, 22.5],
    target: [0, 2.0, 25.2],
    labelPos: [0, 4.8, 24.5],
    description:
      'Es la frontera de la célula: una capa doble de fosfolípidos (bicapa lipídica) con proteínas incrustadas que separa el interior celular del exterior. Es selectivamente permeable: decide qué sustancias entran y cuáles salen.',
    func: 'Protege la célula, regula el intercambio de sustancias con el exterior y permite la comunicación con otras células.',
    fact: 'Si extendieras las membranas de todas las células de tu cuerpo, cubrirían varios campos de fútbol.',
    question: {
      text: '¿Cuál es la principal función de la membrana plasmática?',
      options: [
        'Producir energía para la célula',
        'Fabricar proteínas',
        'Controlar qué sustancias entran y salen de la célula',
        'Almacenar la información genética',
      ],
      correct: 2,
      explanation:
        'La membrana es selectivamente permeable: regula el paso de sustancias entre el interior y el exterior de la célula.',
    },
  },
  {
    id: 'citoplasma',
    name: 'Citoplasma',
    emoji: '💧',
    color: '#8fd7f7',
    checkpoint: [7, 0, 16],
    target: [7, 2.6, 16],
    labelPos: [7, 4.6, 16],
    description:
      'Es todo el contenido de la célula entre la membrana y el núcleo. Está formado por el citosol (un líquido gelatinoso con ~70 % de agua) en el que flotan los orgánulos, y por el citoesqueleto que le da forma.',
    func: 'Sostiene los orgánulos y es el medio donde ocurren muchas de las reacciones químicas del metabolismo.',
    fact: 'El citoplasma no está quieto: se mueve en corrientes llamadas ciclosis que ayudan a repartir los nutrientes.',
    question: {
      text: '¿Qué es el citosol?',
      options: [
        'La membrana que rodea al núcleo',
        'La parte líquida y gelatinosa del citoplasma donde flotan los orgánulos',
        'El material genético de la célula',
        'Un orgánulo que produce energía',
      ],
      correct: 1,
      explanation: 'El citosol es la fase líquida del citoplasma; en él están suspendidos todos los orgánulos.',
    },
  },
  {
    id: 'centriolos',
    name: 'Centriolos',
    emoji: '🔩',
    color: '#f2c14e',
    checkpoint: [12, 0, 13],
    target: [12, 1.9, 10],
    labelPos: [12, 4.2, 10],
    description:
      'Son dos pequeños cilindros colocados de forma perpendicular (formando una L). Cada uno está hecho de nueve tripletes de microtúbulos. Juntos forman el centrosoma, situado cerca del núcleo.',
    func: 'Organizan los microtúbulos de la célula y forman el huso mitótico que separa los cromosomas durante la división celular.',
    fact: 'Las células vegetales no tienen centriolos… ¡y aun así se dividen sin problema!',
    question: {
      text: '¿En qué proceso participan directamente los centriolos?',
      options: [
        'En la división celular, organizando el huso mitótico',
        'En la digestión de nutrientes',
        'En la producción de ATP',
        'En la síntesis de lípidos',
      ],
      correct: 0,
      explanation:
        'Durante la mitosis los centriolos migran a los polos de la célula y organizan el huso que reparte los cromosomas.',
    },
  },
  {
    id: 'microtubulo',
    name: 'Microtúbulo',
    emoji: '🧵',
    color: '#9fe3d3',
    checkpoint: [17, 0, 7],
    target: [17.1, 2.0, 6.9],
    labelPos: [17.5, 4.6, 5],
    description:
      'Son tubos huecos y rígidos formados por la proteína tubulina. Forman parte del citoesqueleto y se extienden desde el centrosoma por todo el citoplasma, como los rayos de una rueda.',
    func: 'Dan forma y soporte a la célula, sirven como "rieles" por donde se transportan vesículas y orgánulos, y separan los cromosomas en la mitosis.',
    fact: 'Proteínas motoras como la cinesina "caminan" literalmente sobre los microtúbulos cargando vesículas a cuestas.',
    question: {
      text: '¿De qué proteína están formados los microtúbulos?',
      options: ['Actina', 'Hemoglobina', 'Queratina', 'Tubulina'],
      correct: 3,
      explanation: 'La tubulina se une formando protofilamentos que se organizan en un tubo hueco: el microtúbulo.',
    },
  },
  {
    id: 'mitocondria',
    name: 'Mitocondria',
    emoji: '⚡',
    color: '#e0554f',
    checkpoint: [16, 0, 2.2],
    target: [16, 2.2, -1],
    labelPos: [16, 4.8, -1],
    description:
      'Orgánulo alargado con doble membrana. La membrana interna se pliega formando crestas, que aumentan la superficie donde ocurre la respiración celular: la glucosa y el oxígeno se transforman en energía.',
    func: 'Producir ATP, la "moneda energética" que usa la célula para todas sus actividades.',
    fact: 'Las mitocondrias tienen su propio ADN y se heredan casi exclusivamente de la madre.',
    question: {
      text: '¿Por qué se conoce a la mitocondria como la "central energética" de la célula?',
      options: [
        'Porque almacena grasas',
        'Porque produce ATP mediante la respiración celular',
        'Porque fabrica ribosomas',
        'Porque controla la entrada de agua',
      ],
      correct: 1,
      explanation: 'En las crestas mitocondriales se produce la mayor parte del ATP de la célula.',
    },
  },
  {
    id: 'peroxisoma',
    name: 'Peroxisoma',
    emoji: '🫧',
    color: '#6fd6b8',
    checkpoint: [16.5, 0, -5.5],
    target: [18.5, 1.6, -6.5],
    labelPos: [18.8, 4.0, -6.5],
    description:
      'Pequeña vesícula rodeada de membrana que contiene enzimas oxidativas, como la catalasa. Su nombre viene del peróxido de hidrógeno (agua oxigenada) que produce y luego destruye.',
    func: 'Descompone ácidos grasos y neutraliza sustancias tóxicas, como el alcohol y el peróxido de hidrógeno.',
    fact: 'La catalasa es una de las enzimas más rápidas que existen: descompone millones de moléculas de agua oxigenada por segundo.',
    question: {
      text: '¿Qué sustancia tóxica descompone el peroxisoma gracias a la enzima catalasa?',
      options: ['Dióxido de carbono', 'Glucosa', 'Peróxido de hidrógeno (agua oxigenada)', 'Oxígeno'],
      correct: 2,
      explanation: 'La catalasa transforma el peróxido de hidrógeno, que es tóxico, en agua y oxígeno.',
    },
  },
  {
    id: 'rel',
    name: 'Retículo endoplasmático liso',
    emoji: '🌀',
    color: '#f1b545',
    checkpoint: [14, 0, -11.5],
    target: [10.5, 2.4, -8],
    labelPos: [11, 5.4, -9],
    description:
      'Red de túbulos membranosos conectados con el retículo rugoso, pero sin ribosomas en su superficie (por eso se llama "liso").',
    func: 'Sintetiza lípidos (grasas y hormonas esteroideas), almacena calcio y desintoxica sustancias como medicamentos y alcohol.',
    fact: 'Las células del hígado tienen un retículo liso muy desarrollado para desintoxicar la sangre.',
    question: {
      text: '¿Cuál es una función del retículo endoplasmático liso?',
      options: [
        'Fabricar proteínas con ribosomas',
        'Guardar el ADN',
        'Digerir bacterias',
        'Sintetizar lípidos y desintoxicar sustancias',
      ],
      correct: 3,
      explanation: 'Al no tener ribosomas no fabrica proteínas; se especializa en lípidos y desintoxicación.',
    },
  },
  {
    id: 'rer',
    name: 'Retículo endoplasmático rugoso',
    emoji: '📚',
    color: '#e59a3c',
    checkpoint: [-1.7, 0, -12.8],
    target: [-1.5, 2.0, -10.6],
    labelPos: [-1.5, 6.2, -11.5],
    description:
      'Sistema de sacos aplanados (cisternas) conectados con la envoltura nuclear. Su superficie está cubierta de ribosomas, lo que le da su aspecto "rugoso".',
    func: 'Sintetizar, plegar y modificar proteínas que serán enviadas a la membrana, a los lisosomas o fuera de la célula.',
    fact: 'Las células que producen muchas proteínas, como las del páncreas, tienen un retículo rugoso enorme.',
    question: {
      text: '¿Qué le da el aspecto "rugoso" al retículo endoplasmático rugoso?',
      options: [
        'Los ribosomas adheridos a su superficie',
        'Los pliegues de su membrana',
        'Los cristales de calcio',
        'Las gotas de grasa',
      ],
      correct: 0,
      explanation: 'Los ribosomas pegados a sus membranas fabrican proteínas que entran directamente al retículo.',
    },
  },
  {
    id: 'ribosomas',
    name: 'Ribosomas',
    emoji: '🔴',
    color: '#c0405f',
    checkpoint: [-9.1, 0, -7.2],
    target: [-7.6, 1.6, -7.4],
    labelPos: [-9.5, 4.8, -8.5],
    description:
      'Son diminutas "fábricas" formadas por ARN ribosómico y proteínas, con dos subunidades. Pueden estar libres en el citoplasma o adheridos al retículo rugoso. No tienen membrana.',
    func: 'Sintetizar proteínas leyendo las instrucciones del ARN mensajero (proceso llamado traducción).',
    fact: 'Una sola célula puede tener millones de ribosomas trabajando al mismo tiempo.',
    question: {
      text: '¿Cuál es la función de los ribosomas?',
      options: [
        'Producir energía',
        'Almacenar agua',
        'Sintetizar proteínas a partir del ARN mensajero',
        'Transportar oxígeno',
      ],
      correct: 2,
      explanation: 'Los ribosomas unen aminoácidos siguiendo el orden que indica el ARN mensajero.',
    },
  },
  {
    id: 'envoltura',
    name: 'Envoltura nuclear',
    emoji: '🛡️',
    color: '#b64a86',
    checkpoint: [-6.5, 0, -3],
    target: [-2.5, 6.95, -5.15],
    labelPos: [-4.5, 9.8, -6],
    description:
      'Es la doble membrana que rodea al núcleo y separa el material genético del citoplasma. Su membrana externa se continúa con el retículo endoplasmático rugoso.',
    func: 'Proteger el ADN y controlar el intercambio de moléculas entre el núcleo y el citoplasma.',
    fact: 'Durante la división celular la envoltura nuclear se desarma y luego se vuelve a formar alrededor de los núcleos nuevos.',
    question: {
      text: '¿Cuántas membranas forman la envoltura nuclear?',
      options: ['Una', 'Dos', 'Tres', 'Ninguna: el núcleo no tiene membrana'],
      correct: 1,
      explanation: 'La envoltura nuclear es una doble membrana (interna y externa) atravesada por poros.',
    },
  },
  {
    id: 'poro',
    name: 'Poro nuclear',
    emoji: '🕳️',
    color: '#f0a8d0',
    checkpoint: [-3.5, 0, 1.5],
    target: [-4.76, 4.07, -4.27],
    labelPos: [-7.5, 6.0, -1.5],
    description:
      'Son canales formados por proteínas que atraviesan la envoltura nuclear. Un solo núcleo puede tener miles de ellos.',
    func: 'Permiten el paso selectivo de moléculas: el ARN mensajero sale hacia el citoplasma y las proteínas que el núcleo necesita entran.',
    fact: 'Cada poro nuclear está formado por unas 30 proteínas distintas repetidas varias veces: ¡más de 500 en total!',
    question: {
      text: '¿Qué molécula sale del núcleo a través de los poros nucleares para que se fabriquen proteínas?',
      options: ['El ADN', 'La glucosa', 'El ATP', 'El ARN mensajero'],
      correct: 3,
      explanation: 'El ADN nunca sale del núcleo; su copia, el ARN mensajero, viaja por los poros hasta los ribosomas.',
    },
  },
  {
    id: 'cromatina',
    name: 'Cromatina',
    emoji: '🧬',
    color: '#8a2a62',
    checkpoint: [-0.8, 0, -1.6],
    target: [-1.2, 4.6, -3.2],
    labelPos: [3.5, 9.8, -1.0],
    description:
      'Es el ADN enrollado alrededor de proteínas llamadas histonas; se ve como una red de hilos dentro del núcleo. Cuando la célula va a dividirse, se compacta y forma los cromosomas.',
    func: 'Guardar la información genética y controlar qué genes se activan en cada momento.',
    fact: 'Si estiraras el ADN de una sola célula humana, ¡mediría unos 2 metros de largo!',
    question: {
      text: '¿Qué ocurre con la cromatina cuando la célula se va a dividir?',
      options: [
        'Se disuelve en el citoplasma',
        'Se compacta y forma los cromosomas',
        'Sale del núcleo',
        'Se convierte en ribosomas',
      ],
      correct: 1,
      explanation: 'La cromatina se condensa muchísimo para formar cromosomas fáciles de repartir entre las células hijas.',
    },
  },
  {
    id: 'nucleolo',
    name: 'Nucleolo',
    emoji: '🟣',
    color: '#5a1040',
    checkpoint: [1.2, 0, -4.2],
    target: [1.2, 3.8, -3.8],
    labelPos: [6.5, 8.8, -4.5],
    description:
      'Es una región densa y esférica dentro del núcleo, sin membrana propia. Es la parte más visible del núcleo cuando se observa al microscopio.',
    func: 'Fabricar el ARN ribosómico y ensamblar las subunidades de los ribosomas.',
    fact: 'Las células que necesitan producir muchas proteínas pueden tener varios nucleolos.',
    question: {
      text: '¿Qué se fabrica en el nucleolo?',
      options: ['Las subunidades de los ribosomas', 'Lípidos', 'ATP', 'Enzimas digestivas'],
      correct: 0,
      explanation: 'El nucleolo produce el ARN ribosómico y lo ensambla con proteínas para formar los ribosomas.',
    },
  },
  {
    id: 'golgi',
    name: 'Aparato de Golgi',
    emoji: '📦',
    color: '#e07a8a',
    checkpoint: [-9.5, 0, 6],
    target: [-12, 3.0, 4],
    labelPos: [-12, 5.6, 4],
    description:
      'Conjunto de sacos aplanados y apilados (cisternas). Tiene una cara de entrada (cis), que recibe vesículas del retículo, y una cara de salida (trans), de donde se desprenden las vesículas ya listas.',
    func: 'Modificar, clasificar y empaquetar proteínas y lípidos en vesículas para enviarlos a su destino. También forma los lisosomas.',
    fact: 'Funciona como la "oficina de correos" de la célula: etiqueta cada paquete con su dirección de destino.',
    question: {
      text: '¿Cuál es la función principal del aparato de Golgi?',
      options: [
        'Producir energía',
        'Copiar el ADN',
        'Modificar, empaquetar y distribuir proteínas y lípidos',
        'Dar forma a la célula',
      ],
      correct: 2,
      explanation: 'El Golgi recibe moléculas del retículo, las modifica y las envía en vesículas a su destino final.',
    },
  },
  {
    id: 'vesicula',
    name: 'Vesícula secretora',
    emoji: '🎈',
    color: '#f4a6b4',
    checkpoint: [-14.5, 0, 12],
    target: [-13.6, 1.6, 10],
    labelPos: [-16.5, 4.2, 10],
    description:
      'Pequeñas bolsas membranosas que se desprenden del aparato de Golgi cargadas de productos (hormonas, enzimas, neurotransmisores) listos para salir de la célula.',
    func: 'Transportar y almacenar sustancias hasta el momento de liberarlas al exterior.',
    fact: 'Las neuronas guardan neurotransmisores en vesículas y los liberan en milésimas de segundo cuando llega una señal.',
    question: {
      text: '¿De qué orgánulo se desprenden las vesículas secretoras?',
      options: ['Del núcleo', 'Del aparato de Golgi', 'De la mitocondria', 'Del peroxisoma'],
      correct: 1,
      explanation: 'Las vesículas brotan de la cara trans del aparato de Golgi y viajan hacia la membrana plasmática.',
    },
  },
  {
    id: 'lisosoma',
    name: 'Lisosoma',
    emoji: '🍽️',
    color: '#b95fd4',
    checkpoint: [-8.5, 0, 16.5],
    target: [-9, 1.6, 13.5],
    labelPos: [-8, 4.2, 13.5],
    description:
      'Vesícula esférica llena de enzimas digestivas (hidrolasas) que funcionan en un medio ácido. Se forma a partir del aparato de Golgi.',
    func: 'Digerir nutrientes, destruir bacterias y reciclar orgánulos viejos o dañados (autofagia).',
    fact: 'Es el "estómago" de la célula. Si sus enzimas escaparan, ¡podrían digerir la propia célula!',
    question: {
      text: '¿Qué contienen los lisosomas?',
      options: ['ADN', 'Clorofila', 'Agua pura', 'Enzimas digestivas'],
      correct: 3,
      explanation: 'Sus enzimas hidrolíticas rompen moléculas grandes en piezas pequeñas que la célula puede reutilizar.',
    },
  },
  {
    id: 'exocitosis',
    name: 'Exocitosis',
    emoji: '🚀',
    color: '#ffd166',
    checkpoint: [-10, 0, 19.5],
    target: [-11.6, 1.5, 23.2],
    labelPos: [-12.5, 4.6, 22],
    description:
      'Es el proceso por el cual una vesícula se fusiona con la membrana plasmática y libera su contenido al exterior de la célula. ¡Mira cómo las vesículas llegan a la membrana y sueltan su carga!',
    func: 'Permite secretar hormonas, enzimas y otras sustancias, y también renovar la membrana plasmática.',
    fact: 'El proceso inverso, en el que la célula "traga" material del exterior, se llama endocitosis.',
    question: {
      text: '¿Qué ocurre durante la exocitosis?',
      options: [
        'La célula toma material del exterior',
        'El núcleo se divide en dos',
        'Una vesícula se fusiona con la membrana y libera su contenido afuera',
        'La mitocondria produce ATP',
      ],
      correct: 2,
      explanation: 'Exo = hacia afuera. La vesícula se une a la membrana y su contenido sale de la célula.',
    },
  },
]

export const TOTAL_PARTS = CELL_PARTS.length
export const MAX_SCORE = TOTAL_PARTS * 100

export function getPart(id: string): CellPart {
  return CELL_PARTS.find((p) => p.id === id)!
}
