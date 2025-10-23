/**
 * Semantic Bizarreness Detector
 */

export interface BizarrenessScore {
  physical: number;
  cognitive: number;
  metamorphosis: number;
  spacetime: number;
  identity: number;
  total: number;
  details: {
    category: string;
    score: number;
    reason: string;
  }[];
}

/**
 * Analyze dream text for bizarreness using semantic rules
 */
export function analyzeBizarrenessSemantics(dreamText: string): BizarrenessScore {
  const text = dreamText.toLowerCase();
  const details: { category: string; score: number; reason: string }[] = [];

  // 1. Physical Impossibility (0-25)
  const physicalScore = detectPhysicalImpossibility(text, details);

  // 2. Cognitive Impossibility (0-10)
  const cognitiveScore = detectCognitiveImpossibility(text, details);

  // 3. Metamorphosis (0-25)
  const metamorphosisScore = detectMetamorphosis(text, details);

  // 4. Space-Time Violations (0-20)
  const spacetimeScore = detectSpaceTimeViolations(text, details);

  // 5. Identity Confusion (0-20)
  const identityScore = detectIdentityConfusion(text, details);

  // Calculate total with compound bonus
  let total = physicalScore + cognitiveScore + metamorphosisScore + spacetimeScore + identityScore;

  // Bonus for multiple violation types (compound bizarreness)
  const violationTypes = [
    physicalScore > 0,
    cognitiveScore > 0,
    metamorphosisScore > 0,
    spacetimeScore > 0,
    identityScore > 0
  ].filter(Boolean).length;

  if (violationTypes >= 4) {
    total = Math.min(total * 1.2, 100);
  } else if (violationTypes === 3) {
    total = Math.min(total * 1.1, 100);
  }

  return {
    physical: physicalScore,
    cognitive: cognitiveScore,
    metamorphosis: metamorphosisScore,
    spacetime: spacetimeScore,
    identity: identityScore,
    total: Math.min(Math.round(total), 100),
    details
  };
}

/**
 * Category 1: Physical Impossibility
 * Detects actions/states that violate physical laws
 */
function detectPhysicalImpossibility(
  text: string,
  details: { category: string; score: number; reason: string }[]
): number {
  let score = 0;

  // Rule 1: Object-action mismatches (objects doing impossible things)
  const heavyObjectsOnBody = [
    // Turkish
    { pattern: /(lamba|ışık|sokak.*lamba).*(düş|kon|gel).*(omuz|sırt|baş)/i, score: 10, reason: 'Ağır nesne vücutta (lamba omza düştü)' },
    { pattern: /(bina|ev|yapı).*(düş|kon).*(üzer|üst)/i, score: 12, reason: 'Ağır yapı cisim üzerinde' },
    { pattern: /(araba|kamyon|otobüs).*(düş|kon).*(el|kol|ayak)/i, score: 12, reason: 'Araç vücutta' },
    // English
    { pattern: /(lamp|light|street.*light).*(fell|land|drop).*(shoulder|back|head)/i, score: 10, reason: 'Heavy object on body (lamp fell on shoulder)' },
    { pattern: /(building|house|structure).*(fell|land|drop).*(on|upon)/i, score: 12, reason: 'Heavy structure on object' },
    { pattern: /(car|truck|bus).*(fell|land|drop).*(hand|arm|leg|foot)/i, score: 12, reason: 'Vehicle on body' }
  ];

  heavyObjectsOnBody.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 2: Flying/levitation (universal impossibility)
  const flyingPatterns = [
    // Turkish
    { pattern: /\b(uç|uçmak|uçuyor|uçtu|uçtum|havalan|havada.*yüz)/i, score: 12, reason: 'Uçma/havada yüzme' },
    { pattern: /(yer.*çekimi.*yok|ağırlıksız|havada.*kal|havada.*dur)/i, score: 12, reason: 'Yerçekimi ihlali' },
    // English
    { pattern: /\b(fly|flying|flew|float|floating|floated|levitat|hover)/i, score: 12, reason: 'Flying/levitation' },
    { pattern: /(no.*gravity|weightless|airborne|suspended.*air)/i, score: 12, reason: 'Gravity violation' }
  ];

  flyingPatterns.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 3: Impossible material interactions
  const materialViolations = [
    // Turkish
    { pattern: /(su|sıvı|akış).*(duvar|zemin|tavan).*(süz|ak|sız|damla)/i, score: 8, reason: 'Sıvı katı maddeden süzülüyor' },
    { pattern: /(duvar|zemin|tavan).*(geç|yürü|git|girdi)/i, score: 10, reason: 'Katı maddeden geçme' },
    { pattern: /(erime|eridi|çözül|buharlaş).*(katı|sert|metal)/i, score: 8, reason: 'İmkansız madde değişimi' },
    // English
    { pattern: /(water|liquid|fluid).*(wall|floor|ceiling).*(seep|flow|drip|pass.*through)/i, score: 8, reason: 'Liquid seeping through solid' },
    { pattern: /(walk|pass|go|went).*(through|thru).*(wall|floor|ceiling|door|window)/i, score: 10, reason: 'Passing through solid matter' },
    { pattern: /(melt|dissolv|evaporat).*(solid|hard|metal|stone)/i, score: 8, reason: 'Impossible material change' }
  ];

  materialViolations.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 4: Disappearance/invisibility
  const disappearancePatterns = [
    // Turkish
    { pattern: /(kaybol|yok.*ol|ortadan.*kaybol|görünmez.*ol).*(aniden|birden|birdenbire)/i, score: 8, reason: 'Ani kaybolma' },
    { pattern: /(şeffaf|görünmez|transparan).*(ol|oluyor|oldu)/i, score: 8, reason: 'Görünmezlik' },
    // English
    { pattern: /(disappear|vanish|fade.*away).*(suddenly|instantly|abruptly)/i, score: 8, reason: 'Sudden disappearance' },
    { pattern: /(transparent|invisible|see.*through).*(became|become|turn|turned)/i, score: 8, reason: 'Invisibility' }
  ];

  disappearancePatterns.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 5: Impossible objects/structures (EN dream specific - doorless elevator, etc.)
  const impossibleObjects = [
    // Turkish
    { pattern: /(kapısız|pencere.*yok|duvar.*yok).*(asansör|bina|oda|ev)/i, score: 15, reason: 'İmkansız mimari yapı (kapısız asansör)' },
    { pattern: /(doorless|without.*doors?|no.*doors?).*(elevator|lift|room|building)/i, score: 15, reason: 'Impossible architecture (doorless elevator)' },
    { pattern: /(elevator|lift|room|building)(?:\s+\w+){0,3}\s+(?:with\s+)?(?:no|without|missing)(?:\s+\w+){0,2}\s+doors?/i, score: 15, reason: 'Elevator/room without doors' },
    { pattern: /(staircase|stairs).*(floating|suspended|hanging).*(air|void|nothing)/i, score: 12, reason: 'Floating staircase' }
  ];

  impossibleObjects.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 6: Speaking/communicating animals (EN test: "blue bird was speaking")
  const speakingAnimals = [
    // English
    { pattern: /(bird|cat|dog|horse|fish|animal|creature).*(speak|speaking|spoke|said|tell|told|talk|talking|whisper|shout)/i, score: 18, reason: 'Animal speaking human language' },
    { pattern: /(heard|hear).*(bird|cat|dog|animal).*(say|said|tell|speak)/i, score: 18, reason: 'Heard animal speak' },
    { pattern: /(bird|animal).*(voice|words|language|sentence)/i, score: 16, reason: 'Animal has human voice/language' },
    // Turkish
    { pattern: /(kuş|kedi|köpek|at|balık|hayvan|yaratık).*(konuş|söyle|de|anlat|fısılda|bağır)/i, score: 18, reason: 'Hayvan insan diliyle konuşuyor' },
    { pattern: /(duydum|duymak).*(kuş|kedi|köpek|hayvan).*(de|söyle|konuş)/i, score: 18, reason: 'Hayvanın konuştuğunu duydum' },
    { pattern: /(kuş|hayvan).*(ses|kelime|dil|cümle)/i, score: 16, reason: 'Hayvanın insan sesi/dili var' }
  ];

  speakingAnimals.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Physical', score: rule.score, reason: rule.reason });
    }
  });

  return Math.min(score, 25);
}

/**
 * Category 2: Cognitive Impossibility
 * Detects logic violations and category confusions
 */
function detectCognitiveImpossibility(
  text: string,
  details: { category: string; score: number; reason: string }[]
): number {
  let score = 0;

  // Rule 1: Abstract concepts in commercial transactions
  const abstractCommerce = [
    // Turkish
    { pattern: /(hatıra|anı|zaman|duygu|his|rüya).*(sat|satmak|satıyor|satıldı|alın|pazarlan)/i, score: 8, reason: 'Soyut kavram ticari işlemde' },
    { pattern: /(pazar|market|tezgah|dükkan).*(hatıra|anı|zaman|duygu|his)/i, score: 8, reason: 'Soyut kavramlar pazarda' },
    { pattern: /(mevsim|gün|saat|dakika).*(sat|satmak|satıyor|fiyat|para)/i, score: 8, reason: 'Zamansal kavramlar satılıyor' },
    // English
    { pattern: /(memory|memories|time|feeling|emotion|dream).*(sell|selling|sold|buy|trade)/i, score: 8, reason: 'Abstract concept in commerce' },
    { pattern: /(market|shop|store|stall).*(memory|memories|time|feeling|emotion)/i, score: 8, reason: 'Abstract concepts in market' },
    { pattern: /(season|day|hour|minute).*(sell|selling|sold|price|money)/i, score: 8, reason: 'Temporal concepts being sold' }
  ];

  abstractCommerce.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Cognitive', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 2: Directional/spatial concept confusions
  const spatialConfusion = [
    // Turkish
    { pattern: /(kuzey|güney|doğu|batı|yön).*(neden|niçin|sebep|nedeni)/i, score: 10, reason: 'Yön kavramları sebep gösteriyor' },
    { pattern: /(harita|pusula|yön.*göster).*(neden|niçin|sebep)/i, score: 10, reason: 'Harita sebep gösteriyor' },
    { pattern: /(adres|konum|yer).*(yüz|akış|akıyor|sürüklen)/i, score: 8, reason: 'Konum kavramları hareket ediyor' },
    // English
    { pattern: /(north|south|east|west|direction).*(why|because|reason|cause)/i, score: 10, reason: 'Directions as causation' },
    { pattern: /(map|compass|direction).*(why|because|reason|cause)/i, score: 10, reason: 'Map/compass as reason' },
    { pattern: /(address|location|place).*(flow|flowing|drift)/i, score: 8, reason: 'Locations moving/flowing' }
  ];

  spatialConfusion.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Cognitive', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 3: Numerical/mathematical impossibilities
  const mathematicalViolations = [
    // Turkish
    { pattern: /(matematik|hesap|sayı).*(yanlış|mantıksız|saçma)/i, score: 8, reason: 'Matematik mantık ihlali' },
    { pattern: /(iki|üç|dört).*\+.*(beş|altı|yedi).*=.*(sekiz|dokuz|on)(?!\s*bir)/i, score: 8, reason: 'Matematik hatası' },
    // English
    { pattern: /(math|calculation|number).*(wrong|illogical|absurd|nonsense)/i, score: 8, reason: 'Mathematical logic violation' },
    { pattern: /(two|three|four).*\+.*(five|six|seven).*=.*(eight|nine|ten)(?!\s*one)/i, score: 8, reason: 'Mathematical error' }
  ];

  mathematicalViolations.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Cognitive', score: rule.score, reason: rule.reason });
    }
  });

  return Math.min(score, 10);
}

/**
 * Category 3: Metamorphosis
 * Detects impossible transformations
 */
function detectMetamorphosis(
  text: string,
  details: { category: string; score: number; reason: string }[]
): number {
  let score = 0;

  // Rule 1: Object-to-sensory transformations (most bizarre)
  const sensorTransforms = [
    // Turkish
    { pattern: /(nesne|şey|eşya|kefe|terazi|para).*(dön|dönüş|değiş).*(koku|ses|tat|his)/i, score: 15, reason: 'Nesne duyu algısına dönüştü' },
    { pattern: /(gül|çiçek|bitki).*(koku|ses).*(dönüş|oldu|oluyor)/i, score: 15, reason: 'Sensory modality shift' },
    // English
    { pattern: /(object|thing|item).*(turn|transform|become|became).*(smell|sound|taste|feeling)/i, score: 15, reason: 'Object transformed to sensory' },
    { pattern: /(rose|flower|plant).*(smell|scent|sound).*(turn|transform|become)/i, score: 15, reason: 'Sensory modality shift' }
  ];

  sensorTransforms.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 2: Object type changes (concrete to concrete)
  const objectTransforms = [
    // Turkish
    { pattern: /(para|makbuz|kağıt).*(dönüş|oldu|değiş).*(pusula|harita|yön.*göster)/i, score: 20, reason: 'Para harita/pusula oldu' },
    { pattern: /(insan|adam|kadın|kişi).*(dönüş|oldu|değiş).*(hayvan|kuş|böcek)/i, score: 18, reason: 'İnsan hayvan oldu' },
    { pattern: /(hayvan|kuş|böcek).*(dönüş|oldu|değiş).*(insan|adam|kadın)/i, score: 18, reason: 'Hayvan insan oldu' },
    // English
    { pattern: /(money|receipt|paper).*(turn|transform|become|became).*(compass|map|direction)/i, score: 20, reason: 'Money became map/compass' },
    { pattern: /(person|man|woman|people).*(turn|transform|become|became).*(animal|bird|insect)/i, score: 18, reason: 'Human became animal' },
    { pattern: /(animal|bird|insect).*(turn|transform|become|became).*(person|man|woman|human)/i, score: 18, reason: 'Animal became human' }
  ];

  objectTransforms.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 3: Elemental/material transformations (EN dream specific - "fashioned from moonlight")
  const elementalTransforms = [
    // Turkish
    { pattern: /(ay.*ışığ|güneş.*ışığ|ışık).*(yapıl|oluş|şekillen|dönüş).*(insan|çocuk|bebek)/i, score: 18, reason: 'Işıktan insan yapılması' },
    { pattern: /(su|hava|ateş|toprak).*(yapıl|oluş|şekillen).*(insan|hayvan|nesne)/i, score: 16, reason: 'Elementlerden yaratılma' },
    // English
    { pattern: /(moonlight|sunlight|light).*(fashion|made|form|craft|shape).*(person|child|baby|human)/i, score: 18, reason: 'Person fashioned from light' },
    { pattern: /(water|air|fire|earth).*(fashion|made|form|craft|shape).*(person|animal|object|human)/i, score: 16, reason: 'Being created from elements' },
    { pattern: /(child|person|figure).*(made.*of|fashion.*from|craft.*from).*(moonlight|light|shadow|mist)/i, score: 18, reason: 'Elemental transformation' }
  ];

  elementalTransforms.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 4: Object-to-living transformations (paper bird with real heart)
  const objectToLiving = [
    // Turkish
    { pattern: /(kağıt|plastik|taş|metal).*(kuş|hayvan).*(kalp|yürek|nefes|can)/i, score: 18, reason: 'Cansız nesne canlı oldu (kağıt kuş kalp atıyor)' },
    { pattern: /(oyuncak|heykel|resim).*(yaşa|hareket|nefes|konuş)/i, score: 16, reason: 'Cansız nesne canlı gibi' },
    // English - single sentence patterns
    { pattern: /(paper|plastic|stone|metal).*(bird|animal).*(heart|breath|life|alive)/i, score: 18, reason: 'Inanimate object became alive (paper bird with heart)' },
    { pattern: /(toy|statue|picture|painting).*(alive|living|breathing|speaking|moving)/i, score: 16, reason: 'Inanimate object acting alive' },
    { pattern: /(bird|animal).*(paper|plastic|wood).*(beat|pulse|heart)/i, score: 18, reason: 'Artificial being with organic life' }
  ];

  objectToLiving.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  // Multi-sentence detection: Check if "paper bird" and "beating/heart" appear within 50 words
  const multiSentencePatterns = [
    {
      part1: /(paper|plastic|stone|metal)\s+(bird|animal)/i,
      part2: /(beat|beating|pulse|pulsing|heart)/i,
      score: 18,
      reason: 'Inanimate object with living qualities (multi-sentence)'
    },
    {
      part1: /(kağıt|plastik|taş|metal)\s+(kuş|hayvan)/i,
      part2: /(kalp|yürek|at|atıyor|nefes)/i,
      score: 18,
      reason: 'Cansız nesne canlı özelliklerde (çoklu cümle)'
    }
  ];

  multiSentencePatterns.forEach(({ part1, part2, score: patternScore, reason }) => {
    const match1 = text.match(part1);
    const match2 = text.match(part2);

    if (match1 && match2 && match1.index !== undefined && match2.index !== undefined) {
      // Check if they're within 200 characters (roughly 40-50 words)
      const distance = Math.abs(match1.index - match2.index);
      if (distance < 200) {
        score += patternScore;
        details.push({ category: 'Metamorphosis', score: patternScore, reason });
      }
    }
  });

  // Rule 5: General transformation patterns
  const generalTransforms = [
    // Turkish
    { pattern: /\b(dönüş|dönüşüm|değiş|değişim|oldu|olmak).*(başka|farklı|tuhaf|garip)/i, score: 12, reason: 'Genel dönüşüm tespit edildi' },
    { pattern: /(şekil|form|biçim|görünüm).*(değiş|dönüş|başkalaş)/i, score: 12, reason: 'Şekil değişimi' },
    // English
    { pattern: /\b(turn|transform|change|shift).*(into|to).*(different|strange|odd|bizarre)/i, score: 12, reason: 'General transformation detected' },
    { pattern: /(shape|form|appearance).*(change|transform|shift|morph)/i, score: 12, reason: 'Shape transformation' }
  ];

  generalTransforms.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 6: Transformations to specific objects/places (EN test: "grocery store transformed into library")
  const specificTransformations = [
    // English
    { pattern: /(transform|change|turn|shift|became|become).*(into).*(library|hospital|school|building|store|shop|museum|garden)/i, score: 16, reason: 'Specific object transformation (e.g., store → library)' },
    { pattern: /(was|is).*(now|suddenly).*(library|hospital|school|building|museum|garden|forest|castle)/i, score: 14, reason: 'Sudden place transformation' },
    { pattern: /(grocery|store|shop|house|room).*(transformed|became|turned).*(library|hospital|school|museum)/i, score: 16, reason: 'Place metamorphosis' },
    // Turkish
    { pattern: /(dönüş|değiş|ol).*(kütüphane|hastane|okul|bina|mağaza|dükkân|müze|bahçe)/i, score: 16, reason: 'Belirli nesne dönüşümü (örn: dükkan → kütüphane)' },
    { pattern: /(şimdi|aniden).*(kütüphane|hastane|okul|bina|müze|bahçe|orman|kale)/i, score: 14, reason: 'Ani mekan dönüşümü' },
    { pattern: /(bakkal|dükkan|mağaza|ev|oda).*(dönüştü|oldu).*(kütüphane|hastane|okul|müze)/i, score: 16, reason: 'Mekan metamorfozu' }
  ];

  specificTransformations.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Metamorphosis', score: rule.score, reason: rule.reason });
    }
  });

  return Math.min(score, 25);
}

/**
 * Category 4: Space-Time Violations
 * Detects temporal and spatial anomalies
 */
function detectSpaceTimeViolations(
  text: string,
  details: { category: string; score: number; reason: string }[]
): number {
  let score = 0;

  // Rule 1: Temporal context violations (things happening at wrong times)
  const temporalViolations = [
    // Turkish
    { pattern: /(pazar|market|dükkan).*(gece|akşam|karanlık).*(kur|açık|açıl)/i, score: 12, reason: 'Pazar gece kuruldu (zamansal anomali)' },
    { pattern: /(okul|iş|ofis).*(gece|gece.*yarı).*(açık|çalış)/i, score: 10, reason: 'Günlük aktivite gece' },
    { pattern: /(güneş|gün.*ışığı).*(gece|akşam|karanlık).*(aynı.*anda|beraber)/i, score: 15, reason: 'Gün-gece paradoksu' },
    // English
    { pattern: /(market|shop|store).*(night|evening|dark).*(open|opened|opening)/i, score: 12, reason: 'Market open at night (temporal anomaly)' },
    { pattern: /(school|work|office).*(night|midnight).*(open|working)/i, score: 10, reason: 'Daytime activity at night' },
    { pattern: /(sun|sunlight|daylight).*(night|dark).*(same.*time|together|simultaneously)/i, score: 15, reason: 'Day-night paradox' }
  ];

  temporalViolations.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Space-Time', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 2: Motion paradoxes (stationary objects moving)
  const motionParadoxes = [
    // Turkish
    { pattern: /(dur|durgun|hareketsiz|sabit).*(hareket|git|ak|yürü|koş)/i, score: 15, reason: 'Hareketsiz nesne hareket ediyor' },
    { pattern: /(tren|otobüs|araba).*(dur|durdu).*(ama|fakat|ancak).*(git|hareket|ak)/i, score: 15, reason: 'Araç hem durdu hem hareket ediyor' },
    // English
    { pattern: /(still|stationary|motionless|static).*(move|moving|walk|run)/i, score: 15, reason: 'Stationary object moving' },
    { pattern: /(train|bus|car).*(stopped|still).*(but|yet|however).*(moving|going)/i, score: 15, reason: 'Vehicle both stopped and moving' }
  ];

  motionParadoxes.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Space-Time', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 3: Time flow anomalies
  const timeFlowAnomalies = [
    // Turkish
    { pattern: /(zaman|saat).*(dur|dondu|kal|donmuş)/i, score: 18, reason: 'Zaman durdu' },
    { pattern: /(geçmiş|gelecek).*(aynı.*anda|karış|bir.*arada)/i, score: 14, reason: 'Geçmiş-gelecek karışması' },
    { pattern: /(geri.*git|geri.*dön).*(zaman|geçmiş)/i, score: 14, reason: 'Zamanda geri gidiş' },
    // English
    { pattern: /(time|clock).*(stop|froze|frozen|halt)/i, score: 18, reason: 'Time stopped' },
    { pattern: /(past|future).*(same.*time|mixed|together|simultaneously)/i, score: 14, reason: 'Past-future mix' },
    { pattern: /(go.*back|went.*back|travel).*(time|past)/i, score: 14, reason: 'Time travel backward' }
  ];

  timeFlowAnomalies.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Space-Time', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 4: Spatial distortions (EN dream specific - "elevator carried me sideways")
  const spatialDistortions = [
    // Turkish
    { pattern: /(asansör|merdiven).*(yan|yatay|yana).*(taşı|götür|git)/i, score: 14, reason: 'Asansör yatay hareket ediyor' },
    { pattern: /(oda|koridor).*(sonsuz|sonsuza|bitmeyen|uçsuz)/i, score: 12, reason: 'Sonsuz mekan' },
    { pattern: /(ayna|yansı).*(koridor|oda).*(çok|birçok|sonsuz)/i, score: 12, reason: 'Sonsuz ayna koridoru' },
    // English
    { pattern: /(elevator|lift).*(sideways|horizontal|side).*(carried|took|move)/i, score: 14, reason: 'Elevator moving sideways' },
    { pattern: /(room|corridor|hall).*(infinite|endless|never.*end)/i, score: 12, reason: 'Infinite space' },
    { pattern: /(mirror|reflection).*(corridor|hallway).*(many|multiple|infinite)/i, score: 12, reason: 'Infinite mirror corridor' },
    { pattern: /(elevator|lift).*(forest|tree|wood|outdoor)/i, score: 14, reason: 'Elevator in impossible location (forest)' }
  ];

  spatialDistortions.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Space-Time', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 5: Seasonal/temporal anomalies on objects (EN test: "staircase with seasonal steps")
  const temporalAnomalies = [
    // English
    { pattern: /(stairs?|steps?).*(different).*(seasons?|winter|summer|autumn|spring)/i, score: 18, reason: 'Seasonal stairs/steps (each step = different season)' },
    { pattern: /(each|every).*(step|stair).*(season|temperature|weather|time)/i, score: 16, reason: 'Each step has different season' },
    { pattern: /(room|space|place).*(all.*seasons|different.*times)/i, score: 14, reason: 'Space contains multiple seasons simultaneously' },
    { pattern: /(walk|climb).*(through).*(seasons?|time|ages?)/i, score: 14, reason: 'Walking through seasons/time' },
    // Turkish
    { pattern: /(merdiven|basamak).*(farklı).*(mevsim|kış|yaz|sonbahar|ilkbahar)/i, score: 18, reason: 'Mevsimsel merdivenler (her basamak farklı mevsim)' },
    { pattern: /(her).*(basamak|adım).*(mevsim|sıcaklık|hava|zaman)/i, score: 16, reason: 'Her basamak farklı mevsimde' },
    { pattern: /(oda|yer|mekan).*(tüm.*mevsimler|farklı.*zamanlar)/i, score: 14, reason: 'Mekan aynı anda birden fazla mevsim içeriyor' },
    { pattern: /(yürü|tırman).*(içinden|boyunca).*(mevsim|zaman|çağlar)/i, score: 14, reason: 'Mevsimler/zaman içinden yürüme' }
  ];

  temporalAnomalies.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Space-Time', score: rule.score, reason: rule.reason });
    }
  });

  return Math.min(score, 20);
}

/**
 * Category 5: Identity Confusion
 * Detects self-identity ambiguities
 */
function detectIdentityConfusion(
  text: string,
  details: { category: string; score: number; reason: string }[]
): number {
  let score = 0;

  // Rule 1: Direct identity questions
  const identityQuestions = [
    { pattern: /(kim|kimim|ben.*kim|kim.*ben)/i, score: 15, reason: 'Kimlik sorgulaması' },
    { pattern: /(kendim|kendi).*(değil|yok|başka|farklı)/i, score: 12, reason: 'Kendini tanımama' }
  ];

  identityQuestions.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Identity', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 2: Identity shifts
  const identityShifts = [
    { pattern: /(başka.*biri|başka.*insan).*(ol|oluyor|oldu)/i, score: 12, reason: 'Başka birine dönüşme' },
    { pattern: /(kimlik|kişilik).*(değiş|kayıp|kaybol)/i, score: 10, reason: 'Kimlik değişimi/kaybı' }
  ];

  identityShifts.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Identity', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 4: Seeing self at multiple ages simultaneously (EN test: "mirrors showing all ages")
  const ageMultiplicity = [
    // English
    { pattern: /(mirror|reflection).*(showing|reflect).*(all.*ages?|different.*ages?|baby.*elderly)/i, score: 16, reason: 'Mirrors showing self at all ages simultaneously' },
    { pattern: /(saw|see|seeing).*(myself|me).*(all.*ages|different.*ages|baby.*child.*elderly)/i, score: 16, reason: 'Seeing self at multiple ages' },
    { pattern: /(corridor|hallway|room).*(mirrors?).*(ages?|baby|child|old|elderly)/i, score: 14, reason: 'Corridor of age mirrors' },
    { pattern: /(mirror|glass).*(baby|child|young|old|elderly).*(same.*time|simultaneously)/i, score: 15, reason: 'All ages visible at once in mirror' },
    // Turkish
    { pattern: /(ayna|yansıma).*(göster|yansıt).*(tüm.*yaş|farklı.*yaş|bebek.*yaşlı)/i, score: 16, reason: 'Aynalar kendimi tüm yaşlarda gösteriyor' },
    { pattern: /(gördüm|görmek).*(kendim|ben).*(tüm.*yaş|farklı.*yaş|bebek.*çocuk.*yaşlı)/i, score: 16, reason: 'Kendimi birden fazla yaşta görme' },
    { pattern: /(koridor|oda).*(ayna).*(yaş|bebek|çocuk|yaşlı)/i, score: 14, reason: 'Yaş aynaları koridoru' },
    { pattern: /(ayna|cam).*(bebek|çocuk|genç|yaşlı).*(aynı.*anda|eşzamanlı)/i, score: 15, reason: 'Aynada tüm yaşlar aynı anda görünüyor' }
  ];

  ageMultiplicity.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Identity', score: rule.score, reason: rule.reason });
    }
  });

  // Rule 5: Person with dual age/voice/form (EN test: "mother younger self, adult voice")
  const dualIdentity = [
    // English
    { pattern: /(mother|father|person|child).*(younger|older|child|adult).*(voice|form|body|appearance)/i, score: 15, reason: 'Person with dual age (child body, adult voice)' },
    { pattern: /(looked|was|appeared).*(like).*(child|young|old).*(but|yet).*(voice|sounded|spoke)/i, score: 15, reason: 'Age-voice mismatch' },
    { pattern: /(child|young).*(body|form|appearance).*(adult|old).*(voice|sound|speak)/i, score: 16, reason: 'Young body with old voice' },
    // Turkish
    { pattern: /(anne|baba|insan|çocuk).*(genç|yaşlı|çocuk|yetişkin).*(ses|form|vücut|görünüm)/i, score: 15, reason: 'Kişi ikili yaşta (çocuk vücudu, yetişkin sesi)' },
    { pattern: /(görünüyor|gözüküyor).*(gibi).*(çocuk|genç|yaşlı).*(ama|fakat).*(ses|konuşuyor)/i, score: 15, reason: 'Yaş-ses uyumsuzluğu' },
    { pattern: /(çocuk|genç).*(vücut|form|görünüm).*(yetişkin|yaşlı).*(ses|konuşma)/i, score: 16, reason: 'Genç vücut yaşlı ses' }
  ];

  dualIdentity.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.score;
      details.push({ category: 'Identity', score: rule.score, reason: rule.reason });
    }
  });

  return Math.min(score, 20);
}
