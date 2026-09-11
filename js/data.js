/**
 * Organelle reference data — content shown in the info panel, legend
 * and in-VR billboards. `color` (hex) is the identity color used in 3D,
 * `viewDistance` is the suggested camera distance when focusing.
 */
export const ORGANELLES = {
  membrane: {
    name: 'Cell Membrane',
    latin: 'plasma membrane',
    color: 0x35c3f3,
    viewDistance: 12,
    short: 'Phospholipid bilayer controlling what enters and exits the cell.',
    description:
      'The cell\u2019s outer boundary: a flexible phospholipid bilayer studded with proteins. ' +
      'It is selectively permeable — letting nutrients in and waste out — and carries receptors ' +
      'that let the cell sense and respond to its environment.',
    fact: 'The bilayer is only about 7 nm thick — roughly 1/10,000 the width of a human hair.',
  },
  nucleus: {
    name: 'Nucleus',
    latin: 'control center',
    color: 0x9b8cff,
    viewDistance: 5.2,
    short: 'Stores DNA and coordinates growth, metabolism and reproduction.',
    description:
      'The command center of the cell. It stores the genome — about 2 meters of DNA packed into ' +
      'chromatin — inside a double membrane called the nuclear envelope, whose pores regulate ' +
      'traffic of RNA and proteins in and out.',
    fact: 'Your DNA is copied with an error rate of only ~1 mistake per billion base pairs.',
  },
  nucleolus: {
    name: 'Nucleolus',
    latin: 'ribosome factory',
    color: 0xff6b9d,
    viewDistance: 3.4,
    short: 'Dense region inside the nucleus where ribosomes begin assembly.',
    description:
      'A dense, membrane-less structure nested inside the nucleus. Ribosomal RNA is transcribed ' +
      'here and combined with proteins to build the subunits of ribosomes, which are then ' +
      'exported through the nuclear pores.',
    fact: 'Cells that mass-produce protein — like antibody-secreting cells — have enormous nucleoli.',
  },
  mitochondrion: {
    name: 'Mitochondrion',
    latin: 'powerhouse of the cell',
    color: 0xff9f43,
    viewDistance: 3.6,
    short: 'Converts nutrients into ATP, the cell\u2019s energy currency.',
    description:
      'The powerhouse of the cell. Through cellular respiration it converts glucose and oxygen ' +
      'into ATP. Its inner membrane is folded into cristae to maximize the surface area where ' +
      'ATP is synthesized.',
    fact: 'Mitochondria have their own DNA — strong evidence they descend from ancient bacteria.',
  },
  rer: {
    name: 'Rough Endoplasmic Reticulum',
    latin: 'rough ER',
    color: 0x5f8dff,
    viewDistance: 4.6,
    short: 'Ribosome-studded membranes that fold and process new proteins.',
    description:
      'A network of flattened membrane sacs continuous with the nuclear envelope. It looks "rough" ' +
      'because it is studded with ribosomes: secreted and membrane proteins are threaded into the ' +
      'ER as they are made, then folded and quality-checked here.',
    fact: 'In protein-secreting cells the rough ER can make up half of all membrane in the cell.',
  },
  ser: {
    name: 'Smooth Endoplasmic Reticulum',
    latin: 'smooth ER',
    color: 0x2fd3c6,
    viewDistance: 4.2,
    short: 'Makes lipids, detoxifies chemicals and stores calcium.',
    description:
      'A tubular, ribosome-free extension of the ER. It synthesizes lipids and steroids, ' +
      'detoxifies drugs and poisons (especially in liver cells), and stores calcium ions used ' +
      'as cellular signals.',
    fact: 'Muscle cells use a specialized smooth ER — the sarcoplasmic reticulum — to trigger contraction.',
  },
  golgi: {
    name: 'Golgi Apparatus',
    latin: 'post office of the cell',
    color: 0xe9458b,
    viewDistance: 4.2,
    short: 'Modifies, sorts and ships proteins in vesicles.',
    description:
      'A stack of flattened membrane discs that receives proteins from the rough ER, modifies ' +
      'them (for example adding sugars), then sorts and packages them into vesicles addressed ' +
      'to their final destination — inside or outside the cell.',
    fact: 'Named after Camillo Golgi, who visualized it in 1897 using a silver staining method.',
  },
  ribosome: {
    name: 'Ribosome',
    latin: 'protein assembly line',
    color: 0xffd166,
    viewDistance: 3.0,
    short: 'Tiny machines that read mRNA and build proteins.',
    description:
      'Molecular machines made of RNA and protein. Free ribosomes float in the cytosol while ' +
      'bound ones coat the rough ER; both read messenger RNA and link amino acids together, ' +
      'building every protein the cell needs.',
    fact: 'A single mammalian cell contains roughly 10 million ribosomes.',
  },
  lysosome: {
    name: 'Lysosome',
    latin: 'recycling center',
    color: 0xef476f,
    viewDistance: 3.0,
    short: 'Enzyme-filled sacs that digest waste and worn-out organelles.',
    description:
      'Membrane sacs filled with powerful digestive enzymes. They break down engulfed material, ' +
      'worn-out organelles and invading microbes, recycling the raw ingredients for reuse.',
    fact: 'Their enzymes work best at pH ~4.8 — acid kept safely locked away from the cytosol.',
  },
  peroxisome: {
    name: 'Peroxisome',
    latin: 'detox unit',
    color: 0x06d6a0,
    viewDistance: 3.0,
    short: 'Neutralizes hydrogen peroxide and breaks down fatty acids.',
    description:
      'Small detoxifying organelles that break down very-long-chain fatty acids and neutralize ' +
      'toxic hydrogen peroxide produced by metabolism, converting it into water and oxygen.',
    fact: 'They are packed with catalase, one of the fastest enzymes known — millions of reactions per second.',
  },
  centrosome: {
    name: 'Centrosome & Centrioles',
    latin: 'microtubule organizer',
    color: 0xa3d635,
    viewDistance: 3.4,
    short: 'Organizes microtubules and the spindle during cell division.',
    description:
      'The cell\u2019s main microtubule-organizing center, usually found near the nucleus. It contains ' +
      'a pair of barrel-shaped centrioles sitting at right angles to each other. Before division ' +
      'it duplicates and builds the spindle that separates chromosomes.',
    fact: 'Each centriole is a cylinder of nine microtubule triplets — the famous "9\u00d73 + 0" pattern.',
  },
  cytoskeleton: {
    name: 'Cytoskeleton',
    latin: 'cell scaffolding',
    color: 0xdfe7f5,
    viewDistance: 7,
    short: 'Protein filaments giving the cell shape and internal transport tracks.',
    description:
      'A dynamic network of protein filaments — microtubules, actin filaments and intermediate ' +
      'filaments — that gives the cell its shape, anchors organelles, and serves as railway ' +
      'tracks along which motor proteins haul cargo.',
    fact: 'Motor proteins like kinesin "walk" along microtubules carrying vesicles at ~1 \u00b5m per second.',
  },
  vesicle: {
    name: 'Transport Vesicle',
    latin: 'cargo container',
    color: 0xf5f3ff,
    viewDistance: 3.4,
    short: 'Small membrane sacs that ferry cargo between organelles.',
    description:
      'Small spheres of membrane that bud off the ER and Golgi, carrying proteins and lipids to ' +
      'their destinations. When a vesicle reaches its target, its membrane fuses and releases ' +
      'the cargo — this is also how cells secrete hormones and neurotransmitters.',
    fact: 'Vesicles dock with their targets using SNARE proteins that zip together like a molecular fastener.',
  },
};

/** Order used by the guided tour. */
export const TOUR_ORDER = [
  'membrane',
  'nucleus',
  'nucleolus',
  'rer',
  'ribosome',
  'ser',
  'golgi',
  'vesicle',
  'mitochondrion',
  'lysosome',
  'peroxisome',
  'centrosome',
  'cytoskeleton',
];
