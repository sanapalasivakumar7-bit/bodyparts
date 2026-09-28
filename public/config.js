export const ANATOMY_MODEL_URL = '/models/anatomy/human-anatomy.glb';

export const SYSTEMS = {
  ALL: { id: 'all', name: 'Complete Body', color: '#00f0ff' },
  SKELETAL: { id: 'skeletal', name: 'Skeletal System', color: '#ded8c9' },
  MUSCULAR: { id: 'muscular', name: 'Muscular System', color: '#e05353' },
  CIRCULATORY: { id: 'circulatory', name: 'Circulatory System', color: '#ff2d55' },
  RESPIRATORY: { id: 'respiratory', name: 'Respiratory System', color: '#5ac8fa' },
  NERVOUS: { id: 'nervous', name: 'Nervous System', color: '#ffcc00' },
  DIGESTIVE: { id: 'digestive', name: 'Digestive System', color: '#ff9500' },
  URINARY: { id: 'urinary', name: 'Urinary System', color: '#af52de' }
};

export const ANATOMY_DATA = {
  brain: {
    id: 'brain',
    name: 'Brain & Encephalon',
    system: 'Nervous',
    systemId: 'nervous',
    latin: 'Cerebrum & Encephalon',
    stats: {
      mass: '~1,400 grams',
      neurons: '86 Billion',
      energyConsumption: '20% of total body energy',
      bloodFlow: '750 mL/min'
    },
    function: 'Master processing unit of the central nervous system, commanding cognition, sensory interpretation, voluntary motor commands, memory, emotional processing, and vegetative autonomic homeostatic reflexes.',
    description: 'Divided into two cerebral hemispheres joined by the corpus callosum. The outer cortex features dense gyri and sulci maximizing surface area. Deep structures include the thalamus, hypothalamus, basal ganglia, and cerebellum, atop the brainstem which regulates cardiorespiratory rhythms.',
    cameraPosition: [0, 1.62, 0.75],
    cameraTarget: [0, 1.62, 0],
    scaleHighlight: 1.05
  },
  skull: {
    id: 'skull',
    name: 'Cranium & Facial Skeleton',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Cranium',
    stats: {
      bones: '22 cranial & facial bones',
      sutures: 'Coronal, Sagittal, Lambdoid',
      protectiveIndex: 'High rigid tensile strength'
    },
    function: 'Encloses and protects the delicate neural parenchyma of the brain and provides structural anchorage for masticatory and facial expression muscles.',
    description: 'Formed by 8 cranial bones (frontal, parietal, temporal, occipital, sphenoid, ethmoid) fused via fibrous sutures, and 14 facial splanchnocranium bones including the movable mandible.',
    cameraPosition: [0, 1.62, 0.85],
    cameraTarget: [0, 1.62, 0]
  },
  heart: {
    id: 'heart',
    name: 'Heart & Cardia',
    system: 'Circulatory',
    systemId: 'circulatory',
    latin: 'Cor',
    stats: {
      restingRate: '60–100 BPM',
      cardiacOutput: '5 Liters/min',
      weight: '250–350 grams',
      beatsPerDay: '~100,000 beats'
    },
    function: 'Rhythmic muscular pump driving blood through the pulmonary circuit for oxygenation and systemic circuit for peripheral nutrient delivery.',
    description: 'Composed of specialized autorhythmic striated myocardium enveloped in fibroserous pericardium. Houses four chambers (right/left atria and ventricles) regulated by unidirectional atrioventricular and semilunar valves.',
    cameraPosition: [-0.03, 1.23, 0.65],
    cameraTarget: [-0.03, 1.23, 0]
  },
  left_lung: {
    id: 'left_lung',
    name: 'Left Lung',
    system: 'Respiratory',
    systemId: 'respiratory',
    latin: 'Pulmo Sinister',
    stats: {
      lobes: '2 (Superior & Inferior)',
      alveoli: '~150 Million',
      vitalCapacity: '~2.2 Liters'
    },
    function: 'Facilitates hematosis by passive diffusion of oxygen into pulmonary capillaries and extraction of carbon dioxide waste into expired air.',
    description: 'Slightly smaller than the right lung to accommodate the cardiac notch and pericardium. Divided by an oblique fissure into superior and inferior lobes, receiving the left main bronchus.',
    cameraPosition: [-0.25, 1.22, 0.70],
    cameraTarget: [-0.10, 1.22, 0]
  },
  right_lung: {
    id: 'right_lung',
    name: 'Right Lung',
    system: 'Respiratory',
    systemId: 'respiratory',
    latin: 'Pulmo Dexter',
    stats: {
      lobes: '3 (Superior, Middle, Inferior)',
      alveoli: '~180 Million',
      vitalCapacity: '~2.6 Liters'
    },
    function: 'Conducts pulmonary gas exchange with large capillary alveolar surface area spanning approximately 70 square meters.',
    description: 'Broader and shorter than the left lung due to the underlying hepatic dome. Divided by horizontal and oblique fissures into three distinct lobes fed by secondary lobar bronchi.',
    cameraPosition: [0.25, 1.22, 0.70],
    cameraTarget: [0.10, 1.22, 0]
  },
  lung: {
    id: 'lung',
    name: 'Pulmonary Lungs',
    system: 'Respiratory',
    systemId: 'respiratory',
    latin: 'Pulmones',
    stats: {
      totalCapacity: '~6 Liters',
      breathingRate: '12–20 breaths/min',
      surfaceArea: '~70 m²'
    },
    function: 'Continuous vital gas exchange, filtering airborne particulates, and contributing to systemic acid-base carbonic buffer homeostasis.',
    description: 'Elastic spongy thoracic organs expanding synchronously via negative pleural intra-thoracic pressure driven by diaphragm contraction and external intercostal elevation.',
    cameraPosition: [0, 1.22, 0.75],
    cameraTarget: [0, 1.22, 0]
  },
  liver: {
    id: 'liver',
    name: 'Liver & Hepatic Complex',
    system: 'Digestive',
    systemId: 'digestive',
    latin: 'Hepar',
    stats: {
      weight: '1.5 kg',
      functionsCount: '500+ vital metabolic roles',
      bloodSupply: 'Dual (Hepatic artery + Portal vein)',
      bileOutput: '800–1,000 mL/day'
    },
    function: 'Synthesizes clotting factors and albumin, metabolizes macronutrients, filters xenobiotics and drugs, stores glycogen, and secretes bile salts for lipid emulsification.',
    description: 'The largest internal metabolic gland situated in the right hypochondriac and epigastric regions beneath the diaphragm. Possesses unique physiological regenerative capacity and complex microvascular sinusoidal lobules.',
    cameraPosition: [0.18, 1.08, 0.65],
    cameraTarget: [0.06, 1.08, 0]
  },
  stomach: {
    id: 'stomach',
    name: 'Stomach & Gastric Reservoir',
    system: 'Digestive',
    systemId: 'digestive',
    latin: 'Gaster / Ventriculus',
    stats: {
      capacity: '1.5–2 Liters',
      pH: '1.5–2.0 (Hydrochloric acid)',
      transitTime: '2–4 hours'
    },
    function: 'Mechanical churning and chemical enzymatic denaturation of ingested boluses via hydrochloric acid and pepsinogen into acidic liquid chyme.',
    description: 'J-shaped muscular organ featuring cardia, fundus, body, and pyloric antrum. Three muscularis externa layers (longitudinal, circular, and oblique) facilitate vigorous peristaltic grinding.',
    cameraPosition: [-0.18, 1.05, 0.65],
    cameraTarget: [-0.04, 1.05, 0]
  },
  left_kidney: {
    id: 'left_kidney',
    name: 'Left Kidney',
    system: 'Urinary',
    systemId: 'urinary',
    latin: 'Ren Sinister',
    stats: {
      nephrons: '~1 Million',
      filtrationRate: '125 mL/min (GFR)',
      weight: '150 grams'
    },
    function: 'Ultrafilters circulating blood plasma to eliminate nitrogenous metabolic toxins (urea, creatinine) while conserving electrolytes and water.',
    description: 'Bean-shaped retroperitoneal organ located between vertebrae T12 and L3. Possesses outer renal cortex, medullary pyramids, and calyces funneling into the renal pelvis and ureter.',
    cameraPosition: [-0.20, 1.05, -0.60],
    cameraTarget: [-0.06, 1.05, 0]
  },
  right_kidney: {
    id: 'right_kidney',
    name: 'Right Kidney',
    system: 'Urinary',
    systemId: 'urinary',
    latin: 'Ren Dexter',
    stats: {
      nephrons: '~1 Million',
      bloodFiltration: '180 Liters filtered/day',
      urineVolume: '1–2 Liters/day'
    },
    function: 'Regulates extracellular fluid osmolality, blood volume, systemic blood pressure via renin-angiotensin cascade, and secretes erythropoietin.',
    description: 'Positioned slightly inferior relative to the left kidney due to the space occupied by the right hepatic lobe. Encapsulated by dense fibrous renal fascia and perirenal adipose padding.',
    cameraPosition: [0.20, 1.03, -0.60],
    cameraTarget: [0.06, 1.03, 0]
  },
  kidney: {
    id: 'kidney',
    name: 'Kidneys & Renal System',
    system: 'Urinary',
    systemId: 'urinary',
    latin: 'Renes',
    stats: {
      cardiacOutputReceived: '20–25%',
      nephronCount: '2 Million combined',
      dailyFiltration: '180 Liters'
    },
    function: 'Maintains fluid electrolyte balance, acid-base homeostasis, endocrine regulation, and urinary excretory clearance.',
    description: 'Paired bean-shaped organs processing approximately 1,200 mL of arterial blood per minute through high-pressure glomeruli and convoluted tubular reabsorption networks.',
    cameraPosition: [0, 1.04, -0.65],
    cameraTarget: [0, 1.04, 0]
  },
  intestines: {
    id: 'intestines',
    name: 'Small & Large Intestines',
    system: 'Digestive',
    systemId: 'digestive',
    latin: 'Intestinum Tenue et Crassum',
    stats: {
      totalLength: '~7.5 meters',
      absorptiveArea: '~250 m²',
      microbiomeCount: '38 Trillion bacteria'
    },
    function: 'Final enzymatic digestion, high-efficiency nutrient absorption across mucosal enterocytes, and water reabsorption in the colon with feces compaction.',
    description: 'Begins at the pylorus with the duodenum, followed by the extensively looped jejunum and ileum with microvilli brush borders. Transitions at the ileocecal valve into the cecum, ascending, transverse, descending, and sigmoid colon.',
    cameraPosition: [0, 0.90, 0.75],
    cameraTarget: [0, 0.88, 0]
  },
  ribcage: {
    id: 'ribcage',
    name: 'Thoracic Ribcage & Sternum',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Cavea Thoracis',
    stats: {
      ribPairs: '12 (7 True, 3 False, 2 Floating)',
      sternalParts: 'Manubrium, Body, Xiphoid',
      flexibility: 'Elastic costal cartilages'
    },
    function: 'Guards mediastinal organs, resists negative atmospheric collapse during inhalation, and supports the shoulder girdles.',
    description: 'Formed by 12 pairs of curved ribs articulating posteriorly with thoracic vertebrae T1-T12, and anteriorly with the central sternum via hyaline costal cartilages.',
    cameraPosition: [0, 1.25, 0.85],
    cameraTarget: [0, 1.25, 0]
  },
  cervical_spine: {
    id: 'cervical_spine',
    name: 'Cervical Spine (C1-C7)',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Vertebrae Cervicales',
    stats: {
      vertebrae: '7 (Atlas C1, Axis C2, C3-C7)',
      foramina: 'Transverse foramina for vertebral arteries',
      mobility: 'Highest spinal range of motion'
    },
    function: 'Carries skull weight, permits multi-axial head nodding and rotation, and safeguards the upper cervical spinal cord.',
    description: 'Characterized by bifid spinous processes, oval vertebral bodies, and unique pivot articulation between the atlas ring and the odontoid process (dens) of the axis.',
    cameraPosition: [0, 1.45, 0.65],
    cameraTarget: [0, 1.45, 0]
  },
  thoracic_spine: {
    id: 'thoracic_spine',
    name: 'Thoracic Spine (T1-T12)',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Vertebrae Thoracicae',
    stats: {
      vertebrae: '12 articulating segments',
      costalFacets: 'Demifacets for rib head attachment',
      curvature: 'Normal physiological kyphosis'
    },
    function: 'Provides anchoring rigidity for the posterior ribcage and guards the thoracic spinal cord and sympathetic trunk.',
    description: 'Heart-shaped vertebral bodies featuring downward pointing spinous processes and costal facets for costovertebral joint formation.',
    cameraPosition: [0, 1.25, -0.75],
    cameraTarget: [0, 1.25, 0]
  },
  lumbar_spine: {
    id: 'lumbar_spine',
    name: 'Lumbar Spine & Sacrum',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Vertebrae Lumbales & Os Sacrum',
    stats: {
      vertebrae: '5 Lumbar (L1-L5) + Sacrum + Coccyx',
      loadCapacity: 'Several hundred kilograms axial pressure',
      discs: 'Thick fibrocartilaginous intervertebral discs'
    },
    function: 'Bears the entire upper torso body weight and facilitates trunk flexion, extension, and lateral bending.',
    description: 'Massive kidney-shaped vertebral bodies with thick laminae and sturdy quadrangular spinous processes, anchoring into the wedge-shaped triangular sacrum.',
    cameraPosition: [0, 0.95, -0.75],
    cameraTarget: [0, 0.95, 0]
  },
  pelvis: {
    id: 'pelvis',
    name: 'Pelvic Girdle',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Pelvis',
    stats: {
      bones: 'Ilium, Ischium, Pubis, Sacrum',
      joints: 'Sacroiliac & Pubic Symphysis',
      function: 'Locomotor kinetic link'
    },
    function: 'Transfers body weight from the axial spine to the lower limbs and supports visceral abdominal and pelvic reproductive/urinary organs.',
    description: 'Basin-shaped ring of fused bones articulating laterally at deep acetabular cups with the femoral heads.',
    cameraPosition: [0, 0.80, 0.85],
    cameraTarget: [0, 0.80, 0]
  },
  left_arm: {
    id: 'left_arm',
    name: 'Left Upper Extremity',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Membrum Superius Sinistrum',
    stats: {
      totalBones: '32 per arm/shoulder',
      joints: 'Glenohumeral, Elbow, Radioulnar, Wrist'
    },
    function: 'Multi-directional reaching, lifting, grasp dexterity, and tactile exploration.',
    description: 'Encompasses clavicle, scapula, humerus, radius, ulna, 8 carpal bones, 5 metacarpals, and 14 phalanges.',
    cameraPosition: [-0.40, 1.15, 0.70],
    cameraTarget: [-0.25, 1.15, 0]
  },
  right_arm: {
    id: 'right_arm',
    name: 'Right Upper Extremity',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Membrum Superius Dextrum',
    stats: {
      totalBones: '32 per arm/shoulder',
      joints: 'Glenohumeral, Elbow, Radioulnar, Wrist'
    },
    function: 'Multi-directional reaching, lifting, grasp dexterity, and tactile exploration.',
    description: 'Encompasses clavicle, scapula, humerus, radius, ulna, 8 carpal bones, 5 metacarpals, and 14 phalanges.',
    cameraPosition: [0.40, 1.15, 0.70],
    cameraTarget: [0.25, 1.15, 0]
  },
  left_leg: {
    id: 'left_leg',
    name: 'Left Lower Extremity',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Membrum Inferius Sinistrum',
    stats: {
      femurLength: '~48 cm (Longest bone)',
      arches: 'Medial, Lateral, Transverse foot arches'
    },
    function: 'Locomotion, upright posture, dynamic shock absorption during running, jumping, and walking.',
    description: 'Comprises femur, patella, tibia, fibula, 7 tarsals (calcaneus, talus, etc.), 5 metatarsals, and 14 phalanges.',
    cameraPosition: [-0.25, 0.45, 0.85],
    cameraTarget: [-0.12, 0.45, 0]
  },
  right_leg: {
    id: 'right_leg',
    name: 'Right Lower Extremity',
    system: 'Skeletal',
    systemId: 'skeletal',
    latin: 'Membrum Inferius Dextrum',
    stats: {
      femurLength: '~48 cm (Longest bone)',
      arches: 'Medial, Lateral, Transverse foot arches'
    },
    function: 'Locomotion, upright posture, dynamic shock absorption during running, jumping, and walking.',
    description: 'Comprises femur, patella, tibia, fibula, 7 tarsals (calcaneus, talus, etc.), 5 metatarsals, and 14 phalanges.',
    cameraPosition: [0.25, 0.45, 0.85],
    cameraTarget: [0.12, 0.45, 0]
  },
  muscles: {
    id: 'muscles',
    name: 'Muscular System',
    system: 'Muscular',
    systemId: 'muscular',
    latin: 'Systema Musculare',
    stats: {
      musclesCount: '650+ skeletal muscles',
      bodyMassRatio: '~40% of total adult body mass',
      contractionMechanism: 'Actin-Myosin cross-bridge sliding'
    },
    function: 'Generates contractile force to move skeletal levers, maintains isometric upright posture, stabilizes joint capsules, and generates core thermogenesis.',
    description: 'Comprises skeletal, cardiac, and smooth muscle types. Skeletal muscles are organized in motor units governed by alpha motor neurons firing acetylcholine at neuromuscular junctions.',
    cameraPosition: [0, 1.10, 0.95],
    cameraTarget: [0, 1.00, 0]
  },
  skin: {
    id: 'skin',
    name: 'Integumentary System & Epidermis',
    system: 'Integumentary',
    systemId: 'all',
    latin: 'Integumentum Commune',
    stats: {
      surfaceArea: '1.5–2.0 m²',
      thickness: '0.5 mm to 4.0 mm',
      receptors: 'Over 11 million sensory receptors'
    },
    function: 'Primary defensive barrier against pathogens, ultraviolet radiation, toxic chemicals, moisture loss, and key regulator of core thermoregulation via perspiratory sweating.',
    description: 'Tri-layered integument comprising stratified squamous keratinized epidermis, vascular connective dermis with Meissner/Pacinian corpuscles, and subcutaneous adipose hypodermis.',
    cameraPosition: [0, 0.95, 1.85],
    cameraTarget: [0, 0.86, 0]
  }
};

export const QUIZ_QUESTIONS = [
  {
    question: "Which organ generates rhythmic contractile pressure to pump oxygenated blood throughout the circulatory system?",
    targetKey: 'heart',
    targetMesh: 'Heart',
    hint: "Located in the thoracic cavity slightly to the left of the midline.",
    explanation: "Correct! The heart beats over 100,000 times each day, generating pressure to propel 5 liters of blood per minute throughout systemic and pulmonary circulation."
  },
  {
    question: "Which organ contains approximately 86 billion neurons and acts as the master control center for cognition and consciousness?",
    targetKey: 'brain',
    targetMesh: 'Brain',
    hint: "Enclosed within the protective bony cranial vault of the skull.",
    explanation: "Correct! The brain consumes approximately 20% of the body's total metabolic energy and coordinates all voluntary movement, sensory synthesis, and cognition."
  },
  {
    question: "Identify the primary organ responsible for hematosis — exchanging oxygen from inhaled air with carbon dioxide from pulmonary blood.",
    targetKey: 'lung',
    targetMesh: 'Left_Lung',
    alternativeMeshes: ['Left_Lung', 'Right_Lung'],
    hint: "Flanks the heart inside the protective thoracic ribcage.",
    explanation: "Correct! The lungs house over 300 million tiny alveoli spanning a massive 70 square meter surface area for rapid gas diffusion."
  },
  {
    question: "Which organ is the largest internal gland, performing over 500 chemical processes including bile secretion and detoxification?",
    targetKey: 'liver',
    targetMesh: 'Liver',
    hint: "Located in the right upper abdominal quadrant right under the diaphragm.",
    explanation: "Correct! The liver filters approximately 1.5 liters of blood per minute via the portal vein and hepatic artery, converting ammonia to urea and producing bile."
  },
  {
    question: "Which bean-shaped retroperitoneal organ filters approximately 180 liters of blood plasma daily to eliminate metabolic wastes into urine?",
    targetKey: 'kidney',
    targetMesh: 'Left_Kidney',
    alternativeMeshes: ['Left_Kidney', 'Right_Kidney'],
    hint: "Situated in the posterior abdomen on either side of the lumbar spine.",
    explanation: "Correct! Each kidney contains approximately 1 million microscopic nephrons that fine-tune blood pressure, electrolytes, and osmotic water balance."
  },
  {
    question: "Which skeletal structure protects the heart and lungs while expanding rhythmically during respiratory ventilation?",
    targetKey: 'ribcage',
    targetMesh: 'Ribcage',
    hint: "Composed of 12 pairs of curved ribs and the central breastbone.",
    explanation: "Correct! The ribcage consists of 12 pairs of ribs, costal cartilages, and the sternum, pivoting slightly during diaphragmatic and intercostal contractions."
  },
  {
    question: "Which J-shaped muscular pouch secretes hydrochloric acid (pH 1.5) to churn food boluses into liquid chyme?",
    targetKey: 'stomach',
    targetMesh: 'Stomach',
    hint: "Located in the upper left quadrant of the abdomen directly connected to the esophagus.",
    explanation: "Correct! The stomach features three smooth muscle layers executing powerful peristaltic contractions to mechanically and enzymatically digest proteins."
  }
];

export const JOURNEYS_DATA = {
  food: {
    id: 'food',
    name: 'Food Digestion Voyage',
    system: 'Digestive',
    description: 'Travel with an ingested nutritional bolus from the oral cavity down the esophagus, through acid churning in the stomach, and along 7 meters of nutrient-absorbing intestines.',
    milestones: [
      { name: 'Oral Cavity (Mouth)', pos: [0, 1.54, 0.09], cam: [0, 1.54, 0.35], desc: 'Mechanical mastication and salivary amylase breakdown' },
      { name: 'Esophagus', pos: [0, 1.35, 0.03], cam: [0, 1.35, 0.40], desc: 'Peristaltic muscular transport through the mediastinum' },
      { name: 'Stomach Fundus & Antrum', pos: [-0.04, 1.05, 0.05], cam: [-0.04, 1.05, 0.45], desc: 'Vigorous acid churning and gastric pepsinogen denaturation' },
      { name: 'Duodenum & Small Intestine', pos: [-0.01, 0.95, 0.04], cam: [-0.01, 0.95, 0.45], desc: 'Bile emulsification and 90% nutrient absorption across microvilli' },
      { name: 'Large Intestine (Colon)', pos: [0.03, 0.85, 0.05], cam: [0.03, 0.85, 0.45], desc: 'Electrolyte reabsorption, water extraction, and compaction' }
    ]
  },
  air: {
    id: 'air',
    name: 'Air & Respiratory Voyage',
    system: 'Respiratory',
    description: 'Follow oxygen molecules inhaled through nasal passages, down the fibrocartilaginous trachea, through bronchial arborization, into microscopic alveoli.',
    milestones: [
      { name: 'Nasal Cavity & Pharynx', pos: [0, 1.56, 0.09], cam: [0, 1.56, 0.35], desc: 'Air warming, humidification, and mucosal filtration' },
      { name: 'Larynx & Trachea', pos: [0, 1.38, 0.04], cam: [0, 1.38, 0.38], desc: 'C-shaped hyaline cartilage rings maintaining patent airway' },
      { name: 'Carina & Main Bronchi', pos: [0, 1.28, 0.02], cam: [0, 1.28, 0.40], desc: 'Bifurcation into right and left pulmonary bronchial trees' },
      { name: 'Lobar & Terminal Bronchioles', pos: [-0.08, 1.20, 0.02], cam: [-0.08, 1.20, 0.40], desc: 'Smooth muscle airway regulation' },
      { name: 'Alveoli & Capillary Bed', pos: [-0.14, 1.18, 0.03], cam: [-0.14, 1.18, 0.40], desc: 'Passive gas diffusion: O₂ into erythrocytes, CO₂ into expired air' }
    ]
  },
  blood: {
    id: 'blood',
    name: 'Blood Circulation Circuit',
    system: 'Circulatory',
    description: 'Trace an erythrocyte from myocardial contraction through the systemic arterial tree, capillary microcirculation, and return through the venous network.',
    milestones: [
      { name: 'Left Ventricle Contraction', pos: [-0.03, 1.22, 0.03], cam: [-0.03, 1.22, 0.38], desc: 'Systolic ejection pressure pushing oxygenated blood' },
      { name: 'Aortic Arch', pos: [-0.01, 1.28, 0.02], cam: [-0.01, 1.28, 0.38], desc: 'Primary arterial trunk distributing to cerebral & systemic branches' },
      { name: 'Systemic Capillary Networks', pos: [0, 0.95, 0.05], cam: [0, 0.95, 0.45], desc: 'Exchange of O₂, glucose, hormones for cellular metabolic wastes' },
      { name: 'Inferior & Superior Vena Cava', pos: [0.03, 1.18, -0.01], cam: [0.03, 1.18, 0.40], desc: 'Venous return of deoxygenated blood to right atrium' },
      { name: 'Pulmonary Arterial Oxygenation', pos: [-0.01, 1.24, 0.04], cam: [-0.01, 1.24, 0.38], desc: 'Right ventricle pumps to lungs for CO₂ discharge and O₂ reload' }
    ]
  }
};
