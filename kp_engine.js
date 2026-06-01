/* ═══════════════════════════════════════════════════
   KP ASTROLOGY ANALYSER — Prediction Engine
   kp_engine.js
   Contains: All 8 logic tables + prediction functions
═══════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════
// TABLE 1 — HOUSE CLUSTERS
// ═══════════════════════════════════════════════════

const HOUSE_DATA = {
  1: {
    name: 'Self',
    domain: 'Body, Mind, Personality & Vitality',
    Sanskrit: 'Tanu Bhava',
    primary: 1,
    support: [1, 5, 9, 11],
    obstruct: [6, 8, 12],
    subEvents: [
      'BODY', 'MIND', 'PERSONALITY', 'APPEARANCE',
      'LIFE_PHASE', 'NATURE_BEHAVIOUR'
    ]
  },
  2: {
    name: 'Wealth',
    domain: 'Money, Family, Speech & Savings',
    Sanskrit: 'Dhana Bhava',
    primary: 2,
    support: [2, 6, 10, 11],
    obstruct: [5, 8, 12],
    subEvents: ['WEALTH', 'SAVINGS', 'FAMILY', 'SPEECH', 'FOOD']
  },
  3: {
    name: 'Siblings',
    domain: 'Siblings, Courage, Communication & Short Travel',
    Sanskrit: 'Sahaja Bhava',
    primary: 3,
    support: [3, 9, 11],
    obstruct: [6, 8, 12],
    subEvents: ['SIBLINGS', 'COURAGE', 'COMMUNICATION', 'SHORT_TRAVEL', 'SKILLS']
  },
  4: {
    name: 'Property',
    domain: 'Home, Mother, Property, Vehicles & Education',
    Sanskrit: 'Sukha Bhava',
    primary: 4,
    support: [4, 11, 12],
    obstruct: [6, 8, 10],
    subEvents: [
      'PROPERTY_BUY', 'PROPERTY_SELL', 'PROPERTY_RENOVATE',
      'PROPERTY_TYPE', 'VEHICLE', 'MOTHER', 'EDUCATION', 'DOMESTIC'
    ]
  },
  5: {
    name: 'Children',
    domain: 'Children, Romance, Creativity & Speculation',
    Sanskrit: 'Putra Bhava',
    primary: 5,
    support: [5, 2, 11],
    obstruct: [1, 4, 10],
    subEvents: [
      'ROMANCE', 'CONCEPTION', 'DELIVERY',
      'CHILD_ENERGY', 'CHILD_NUMBER',
      'CREATIVITY', 'SPECULATION', 'INTELLIGENCE'
    ]
  },
  6: {
    name: 'Service',
    domain: 'Employment, Debt, Disease, Competition & Litigation',
    Sanskrit: 'Ari Bhava',
    primary: 6,
    support: [6, 2, 10, 11],
    obstruct: [1, 5, 12],
    subEvents: [
      'EMPLOYMENT', 'DEBT', 'DISEASE',
      'COMPETITION', 'LITIGATION', 'BODY_PART', 'ENEMIES'
    ]
  },
  7: {
    name: 'Marriage',
    domain: 'Spouse, Marriage, Partnership & Public Dealings',
    Sanskrit: 'Kalatra Bhava',
    primary: 7,
    support: [7, 2, 11],
    obstruct: [1, 6, 10, 12],
    subEvents: [
      'UNION', 'SEPARATION', 'SPOUSE_NATURE',
      'PARTNERSHIP', 'TYPE', 'MARRIAGE_NUMBER'
    ]
  },
  8: {
    name: 'Transformation',
    domain: 'Longevity, Inheritance, Occult & Sudden Events',
    Sanskrit: 'Ayur Bhava',
    primary: 8,
    support: [8, 2, 11],
    obstruct: [1, 4, 10],
    subEvents: [
      'LONGEVITY', 'INHERITANCE', 'OCCULT',
      'CRISIS', 'TRANSFORMATION', 'EOL'
    ]
  },
  9: {
    name: 'Fortune',
    domain: 'Father, Luck, Higher Study, Long Travel & Dharma',
    Sanskrit: 'Bhagya Bhava',
    primary: 9,
    support: [9, 3, 11],
    obstruct: [4, 6, 12],
    subEvents: [
      'FORTUNE', 'FATHER', 'HIGHER_STUDY',
      'LONG_TRAVEL', 'SPIRITUALITY'
    ]
  },
  10: {
    name: 'Career',
    domain: 'Profession, Status, Authority & Karma',
    Sanskrit: 'Karma Bhava',
    primary: 10,
    support: [10, 6, 2, 11],
    obstruct: [4, 5, 12],
    subEvents: [
      'PROFESSION', 'PROMOTION', 'JOB_CHANGE',
      'BUSINESS', 'JOB_VS_BUSINESS',
      'GOVT_PRIVATE', 'SECTOR', 'STATUS'
    ]
  },
  11: {
    name: 'Gains',
    domain: 'Income, Desires, Elder Siblings & Networks',
    Sanskrit: 'Labha Bhava',
    primary: 11,
    support: [11, 2, 6, 10],
    obstruct: [5, 8, 12],
    subEvents: [
      'INCOME', 'DESIRES', 'ELDER_SIBLING',
      'NETWORK', 'GAINS'
    ]
  },
  12: {
    name: 'Foreign',
    domain: 'Foreign Lands, Expenses, Hospital & Moksha',
    Sanskrit: 'Vyaya Bhava',
    primary: 12,
    support: [12, 3, 9],
    obstruct: [2, 4, 10],
    subEvents: [
      'FOREIGN', 'VISA', 'RESIDENCE',
      'HOSPITAL', 'EXPENSES', 'SECLUSION', 'MOKSHA'
    ]
  }
};

// ═══════════════════════════════════════════════════
// TABLE 2 — PLANET KARAKATVA MAP
// ═══════════════════════════════════════════════════

const PLANET_DATA = {
  Sun: {
    nature: 'mild_malefic',
    karakatva: ['soul', 'father', 'authority', 'government', 'leadership', 'health', 'vitality'],
    friendly: ['Moon', 'Mars', 'Jupiter'],
    enemy: ['Saturn', 'Venus'],
    neutral: ['Mercury'],
    owns: [],     // filled dynamically from chart (Leo house)
    exaltation: 'Aries',
    debilitation: 'Libra',
    bodyParts: ['heart', 'spine', 'right_eye', 'bones'],
    professions: ['government', 'politics', 'medicine', 'management', 'gold_trade'],
    color: '#e8a030',
    dbaPeriodYears: 6
  },
  Moon: {
    nature: 'benefic_waxing_malefic_waning',
    karakatva: ['mind', 'mother', 'emotions', 'public', 'memory', 'water', 'nurturing'],
    friendly: ['Sun', 'Mercury'],
    enemy: [],
    neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    owns: [],
    exaltation: 'Taurus',
    debilitation: 'Scorpio',
    bodyParts: ['mind', 'left_eye', 'breasts', 'stomach', 'uterus', 'lymph'],
    professions: ['nursing', 'hospitality', 'import_export', 'agriculture', 'public_service'],
    color: '#90aac8',
    dbaPeriodYears: 10
  },
  Mars: {
    nature: 'malefic',
    karakatva: ['energy', 'courage', 'aggression', 'siblings', 'property', 'surgery', 'blood'],
    friendly: ['Sun', 'Moon', 'Jupiter'],
    enemy: ['Mercury', 'Saturn'],
    neutral: ['Venus'],
    owns: [],
    exaltation: 'Capricorn',
    debilitation: 'Cancer',
    bodyParts: ['blood', 'muscles', 'marrow', 'head', 'forehead'],
    professions: ['military', 'police', 'surgery', 'engineering', 'real_estate', 'sports'],
    color: '#d05040',
    dbaPeriodYears: 7
  },
  Mercury: {
    nature: 'neutral',
    karakatva: ['intelligence', 'communication', 'business', 'writing', 'analysis', 'trade'],
    friendly: ['Sun', 'Venus'],
    enemy: ['Moon'],
    neutral: ['Mars', 'Jupiter', 'Saturn'],
    owns: [],
    exaltation: 'Virgo',
    debilitation: 'Pisces',
    bodyParts: ['nervous_system', 'skin', 'tongue', 'arms', 'hands', 'intestines'],
    professions: ['accounting', 'banking', 'writing', 'IT', 'teaching', 'trade'],
    color: '#50c880',
    dbaPeriodYears: 17
  },
  Jupiter: {
    nature: 'greatest_benefic',
    karakatva: ['wisdom', 'children', 'wealth', 'dharma', 'religion', 'law', 'expansion'],
    friendly: ['Sun', 'Moon', 'Mars'],
    enemy: ['Mercury', 'Venus'],
    neutral: ['Saturn'],
    owns: [],
    exaltation: 'Cancer',
    debilitation: 'Capricorn',
    bodyParts: ['liver', 'hips', 'thighs', 'fat', 'arteries', 'ears'],
    professions: ['teaching', 'law', 'finance', 'religion', 'advisory', 'medicine'],
    color: '#d8b040',
    dbaPeriodYears: 16
  },
  Venus: {
    nature: 'benefic',
    karakatva: ['love', 'marriage', 'beauty', 'arts', 'comforts', 'luxury', 'vehicles'],
    friendly: ['Mercury', 'Saturn'],
    enemy: ['Sun', 'Moon'],
    neutral: ['Mars', 'Jupiter'],
    owns: [],
    exaltation: 'Pisces',
    debilitation: 'Virgo',
    bodyParts: ['reproductive', 'kidneys', 'face', 'throat', 'skin'],
    professions: ['arts', 'music', 'fashion', 'luxury', 'hospitality', 'beauty', 'finance'],
    color: '#e080a0',
    dbaPeriodYears: 20
  },
  Saturn: {
    nature: 'greatest_malefic',
    karakatva: ['discipline', 'delay', 'service', 'karma', 'longevity', 'masses', 'detachment'],
    friendly: ['Mercury', 'Venus'],
    enemy: ['Sun', 'Moon', 'Mars'],
    neutral: ['Jupiter'],
    owns: [],
    exaltation: 'Libra',
    debilitation: 'Aries',
    bodyParts: ['bones', 'teeth', 'knees', 'joints', 'skin', 'hair', 'spleen'],
    professions: ['government', 'mining', 'agriculture', 'construction', 'law_enforcement', 'research'],
    color: '#8090b8',
    dbaPeriodYears: 19
  },
  Rahu: {
    nature: 'malefic_amplifier',
    karakatva: ['foreign', 'unconventional', 'obsession', 'technology', 'illusion', 'amplifier'],
    friendly: [],
    enemy: [],
    neutral: [],
    owns: [],
    exaltation: 'Gemini',
    debilitation: 'Sagittarius',
    bodyParts: ['nervous_system', 'skin', 'breathing', 'intestines'],
    professions: ['technology', 'foreign_trade', 'politics', 'media', 'research'],
    color: '#6878a0',
    dbaPeriodYears: 18,
    alwaysRetrograde: true
  },
  Ketu: {
    nature: 'malefic_spiritual',
    karakatva: ['spirituality', 'detachment', 'past_karma', 'occult', 'isolation', 'moksha'],
    friendly: [],
    enemy: [],
    neutral: [],
    owns: [],
    exaltation: 'Sagittarius',
    debilitation: 'Gemini',
    bodyParts: ['feet', 'toes', 'abdomen', 'mysterious_conditions'],
    professions: ['spirituality', 'astrology', 'research', 'forensics', 'healing', 'isolation_work'],
    color: '#b09060',
    dbaPeriodYears: 7,
    alwaysRetrograde: true
  }
};

// ═══════════════════════════════════════════════════
// TABLE 3 — SIGN PROPERTIES MAP
// ═══════════════════════════════════════════════════

const SIGN_DATA = {
  Aries:       { num:1,  element:'Fire',  quality:'Movable', direction:'East',  ruler:'Mars',    gender:'M', speed:'Fast',     bodyPart:'head_brain' },
  Taurus:      { num:2,  element:'Earth', quality:'Fixed',   direction:'South', ruler:'Venus',   gender:'F', speed:'Slow',     bodyPart:'neck_throat' },
  Gemini:      { num:3,  element:'Air',   quality:'Dual',    direction:'West',  ruler:'Mercury', gender:'M', speed:'Mixed',    bodyPart:'shoulders_arms_lungs' },
  Cancer:      { num:4,  element:'Water', quality:'Movable', direction:'North', ruler:'Moon',    gender:'F', speed:'Fast',     bodyPart:'chest_stomach' },
  Leo:         { num:5,  element:'Fire',  quality:'Fixed',   direction:'East',  ruler:'Sun',     gender:'M', speed:'Slow',     bodyPart:'heart_spine' },
  Virgo:       { num:6,  element:'Earth', quality:'Dual',    direction:'South', ruler:'Mercury', gender:'F', speed:'Mixed',    bodyPart:'abdomen_intestines' },
  Libra:       { num:7,  element:'Air',   quality:'Movable', direction:'West',  ruler:'Venus',   gender:'M', speed:'Fast',     bodyPart:'kidneys_lower_back' },
  Scorpio:     { num:8,  element:'Water', quality:'Fixed',   direction:'North', ruler:'Mars',    gender:'F', speed:'Slow',     bodyPart:'reproductive_bladder' },
  Sagittarius: { num:9,  element:'Fire',  quality:'Dual',    direction:'East',  ruler:'Jupiter', gender:'M', speed:'Mixed',    bodyPart:'hips_thighs_liver' },
  Capricorn:   { num:10, element:'Earth', quality:'Movable', direction:'South', ruler:'Saturn',  gender:'F', speed:'Practical',bodyPart:'knees_bones_joints' },
  Aquarius:    { num:11, element:'Air',   quality:'Fixed',   direction:'West',  ruler:'Saturn',  gender:'M', speed:'Slow',     bodyPart:'ankles_circulation' },
  Pisces:      { num:12, element:'Water', quality:'Dual',    direction:'North', ruler:'Jupiter', gender:'F', speed:'Mixed',    bodyPart:'feet_lymphatic' }
};

// ═══════════════════════════════════════════════════
// TABLE 4 — DBA WEIGHT CONFIG
// ═══════════════════════════════════════════════════

const DBA_WEIGHTS = {
  MD: 1,   // backdrop
  AD: 2,   // executor — most critical, hard gate
  PD: 1    // timing pin
};

// ═══════════════════════════════════════════════════
// TABLE 5 — SUB-EVENT PROMISE RULES
// ═══════════════════════════════════════════════════

const SUB_EVENT_RULES = {

  // ── H1 SELF ──
  'H1.BODY':            { primaryGate:1, support:[1,5,11],    obstruct:[6,8,12], type:'Time' },
  'H1.MIND':            { primaryGate:1, support:[1,5,9],     obstruct:[6,8,12], type:'Time' },
  'H1.PERSONALITY':     { primaryGate:1, support:[1,3,9,10],  obstruct:[6,8,12], type:'Life' },
  'H1.APPEARANCE':      { primaryGate:1, support:[1,2,5],     obstruct:[6,8,12], type:'Life' },
  'H1.LIFE_PHASE':      { primaryGate:1, support:[1,9,10,11], obstruct:[6,8,12], type:'Time' },
  'H1.NATURE_BEHAVIOUR':{ primaryGate:1, support:[1,3,5,9,10],obstruct:[6,7,8,12],type:'Life'},

  // ── H2 WEALTH ──
  'H2.WEALTH':  { primaryGate:2, support:[2,6,10,11],obstruct:[5,8,12], type:'Time' },
  'H2.SAVINGS': { primaryGate:2, support:[2,4,11],   obstruct:[5,8,12], type:'Time' },
  'H2.FAMILY':  { primaryGate:2, support:[2,4,11],   obstruct:[6,8,12], type:'Life' },
  'H2.SPEECH':  { primaryGate:2, support:[2,3,11],   obstruct:[6,8,12], type:'Life' },
  'H2.FOOD':    { primaryGate:2, support:[2,4,11],   obstruct:[6,8,12], type:'Life' },

  // ── H3 SIBLINGS ──
  'H3.SIBLINGS':      { primaryGate:3, support:[3,11],    obstruct:[6,8,12], type:'Life' },
  'H3.COURAGE':       { primaryGate:3, support:[3,1,9],   obstruct:[6,8,12], type:'Life' },
  'H3.COMMUNICATION': { primaryGate:3, support:[3,9,11],  obstruct:[6,8,12], type:'Time' },
  'H3.SHORT_TRAVEL':  { primaryGate:3, support:[3,9,12],  obstruct:[4,8,10], type:'Time' },
  'H3.SKILLS':        { primaryGate:3, support:[3,6,10],  obstruct:[8,12],   type:'Life' },

  // ── H4 PROPERTY ──
  'H4.PROPERTY_BUY':     { primaryGate:4, support:[4,11,2],   obstruct:[6,8,12], type:'Time' },
  'H4.PROPERTY_SELL':    { primaryGate:4, support:[4,12,3,10],obstruct:[6,8,2],  type:'Time' },
  'H4.PROPERTY_RENOVATE':{ primaryGate:4, support:[4,2,11],   obstruct:[6,8,12], type:'Time' },
  'H4.PROPERTY_TYPE':    { primaryGate:4, support:[4,3,10,11,12],obstruct:[],     type:'Life' },
  'H4.VEHICLE':          { primaryGate:4, support:[4,11,2],   obstruct:[6,8,12], type:'Time' },
  'H4.MOTHER':           { primaryGate:4, support:[4,2,11],   obstruct:[6,8,12], type:'Life' },
  'H4.EDUCATION':        { primaryGate:4, support:[4,9,11],   obstruct:[6,8,12], type:'Time' },
  'H4.DOMESTIC':         { primaryGate:4, support:[4,2,7,11], obstruct:[6,8,12], type:'Time' },

  // ── H5 CHILDREN ──
  'H5.ROMANCE':       { primaryGate:5, support:[5,7,11],obstruct:[1,6,12],  type:'Time' },
  'H5.CONCEPTION':    { primaryGate:5, support:[5,2,11], obstruct:[1,4,10],  type:'Time' },
  'H5.DELIVERY':      { primaryGate:5, support:[5,2,11], obstruct:[6,8,12],  type:'Time' },
  'H5.CHILD_ENERGY':  { primaryGate:5, support:[5],      obstruct:[],        type:'Life' },
  'H5.CHILD_NUMBER':  { primaryGate:5, support:[5,2,11], obstruct:[1,4,10],  type:'Life' },
  'H5.CREATIVITY':    { primaryGate:5, support:[5,3,11], obstruct:[6,8,12],  type:'Life' },
  'H5.SPECULATION':   { primaryGate:5, support:[5,2,11], obstruct:[6,8,12],  type:'Time' },
  'H5.INTELLIGENCE':  { primaryGate:5, support:[5,4,9],  obstruct:[6,8,12],  type:'Life' },

  // ── H6 SERVICE ──
  'H6.EMPLOYMENT': { primaryGate:6, support:[6,2,10,11],obstruct:[1,5,12], type:'Time' },
  'H6.DEBT':       { primaryGate:6, support:[6,2,11],   obstruct:[8,12,5], type:'Time' },
  'H6.DISEASE':    { primaryGate:6, support:[6,8,12],   obstruct:[1,5,11], type:'Time' },
  'H6.COMPETITION':{ primaryGate:6, support:[6,3,11],   obstruct:[5,8,12], type:'Time' },
  'H6.LITIGATION': { primaryGate:6, support:[6,11,1],   obstruct:[8,12,7], type:'Time' },
  'H6.BODY_PART':  { primaryGate:6, support:[6,8,12],   obstruct:[],       type:'Life' },
  'H6.ENEMIES':    { primaryGate:6, support:[6,1,11],   obstruct:[8,12,4], type:'Time' },

  // ── H7 MARRIAGE ──
  'H7.UNION':          { primaryGate:7, support:[7,2,11],     obstruct:[1,6,10,12], type:'Time' },
  'H7.SEPARATION':     { primaryGate:7, support:[1,6,10,12],  obstruct:[2,7,11],    type:'Time' },
  'H7.SPOUSE_NATURE':  { primaryGate:7, support:[7,2,11],     obstruct:[6,8,12],    type:'Life' },
  'H7.PARTNERSHIP':    { primaryGate:7, support:[7,10,11],    obstruct:[6,8,12],    type:'Time' },
  'H7.TYPE':           { primaryGate:7, support:[5,7,9,11,12],obstruct:[],          type:'Life' },
  'H7.MARRIAGE_NUMBER':{ primaryGate:7, support:[7,9],        obstruct:[6,8,12],    type:'Life' },

  // ── H8 TRANSFORMATION ──
  'H8.LONGEVITY':      { primaryGate:8, support:[8,1,5],    obstruct:[6,12,3],  type:'Life' },
  'H8.INHERITANCE':    { primaryGate:8, support:[8,2,11],   obstruct:[6,12,4],  type:'Time' },
  'H8.OCCULT':         { primaryGate:8, support:[8,9,12],   obstruct:[2,6,10],  type:'Life' },
  'H8.CRISIS':         { primaryGate:8, support:[8,12,6],   obstruct:[1,5,11],  type:'Time' },
  'H8.TRANSFORMATION': { primaryGate:8, support:[8,9,1],    obstruct:[4,2,10],  type:'Time' },
  'H8.EOL':            { primaryGate:8, support:[8,2,7],    obstruct:[6,12,1],  type:'Life' },

  // ── H9 FORTUNE ──
  'H9.FORTUNE':      { primaryGate:9, support:[9,5,11],  obstruct:[4,6,12], type:'Life' },
  'H9.FATHER':       { primaryGate:9, support:[9,10,2],  obstruct:[6,8,12], type:'Life' },
  'H9.HIGHER_STUDY': { primaryGate:9, support:[9,4,11],  obstruct:[3,6,12], type:'Time' },
  'H9.LONG_TRAVEL':  { primaryGate:9, support:[9,3,12],  obstruct:[4,10,6], type:'Time' },
  'H9.SPIRITUALITY': { primaryGate:9, support:[9,8,12],  obstruct:[2,6,10], type:'Life' },

  // ── H10 CAREER ──
  'H10.PROFESSION':    { primaryGate:10, support:[10,6,2,11],  obstruct:[4,5,12],  type:'Life' },
  'H10.PROMOTION':     { primaryGate:10, support:[10,11,6,2],  obstruct:[8,12,4],  type:'Time' },
  'H10.JOB_CHANGE':    { primaryGate:10, support:[10,3,9],     obstruct:[4,12,8],  type:'Time' },
  'H10.BUSINESS':      { primaryGate:10, support:[10,7,11,2],  obstruct:[6,8,12],  type:'Time' },
  'H10.JOB_VS_BUSINESS':{ primaryGate:10,support:[6,7,10,11], obstruct:[],         type:'Life' },
  'H10.GOVT_PRIVATE':  { primaryGate:10, support:[6,7,10,11], obstruct:[],         type:'Life' },
  'H10.SECTOR':        { primaryGate:10, support:[10],         obstruct:[],         type:'Life' },
  'H10.STATUS':        { primaryGate:10, support:[10,1,9,11],  obstruct:[6,8,12],  type:'Time' },

  // ── H11 GAINS ──
  'H11.INCOME':        { primaryGate:11, support:[11,6,10,2],  obstruct:[5,8,12],  type:'Time' },
  'H11.DESIRES':       { primaryGate:11, support:[11,9,5],     obstruct:[6,8,12],  type:'Time' },
  'H11.ELDER_SIBLING': { primaryGate:11, support:[11,3,2],     obstruct:[6,8,12],  type:'Life' },
  'H11.NETWORK':       { primaryGate:11, support:[11,7,3],     obstruct:[6,8,12],  type:'Time' },
  'H11.GAINS':         { primaryGate:11, support:[11,5,9],     obstruct:[8,12,6],  type:'Time' },

  // ── H12 FOREIGN ──
  'H12.FOREIGN':   { primaryGate:12, support:[12,9,3],   obstruct:[2,4,10],  type:'Time' },
  'H12.VISA':      { primaryGate:12, support:[12,9,3,6], obstruct:[4,6,8,2], type:'Time' },
  'H12.RESIDENCE': { primaryGate:12, support:[12,4,7],   obstruct:[2,10,1],  type:'Time' },
  'H12.HOSPITAL':  { primaryGate:12, support:[12,6,8],   obstruct:[1,5,11],  type:'Time' },
  'H12.EXPENSES':  { primaryGate:12, support:[12,8,6],   obstruct:[2,11,10], type:'Time' },
  'H12.SECLUSION': { primaryGate:12, support:[12,8,9],   obstruct:[1,7,11],  type:'Time' },
  'H12.MOKSHA':    { primaryGate:12, support:[12,8,9],   obstruct:[2,7,10],  type:'Life' }
};

// ═══════════════════════════════════════════════════
// TABLE 6 — ATTRIBUTE DERIVATION RULES
// ═══════════════════════════════════════════════════

const ATTRIBUTE_RULES = {

  MARRIAGE_TYPE: (slSig) => {
    if (slSig.includes(5) && slSig.includes(7)) return 'Love Marriage';
    if (slSig.includes(9) && slSig.includes(12) && slSig.includes(7)) return 'Foreign / Long-distance Spouse';
    if (slSig.includes(2) && slSig.includes(4) && slSig.includes(7)) return 'Arranged / Family-led Marriage';
    if (slSig.includes(3) && slSig.includes(7) && slSig.includes(11)) return 'Through Friends / Network';
    if (slSig.includes(6) && slSig.includes(10) && slSig.includes(7)) return 'Court / Registered Marriage';
    return 'Mixed — Arranged with personal choice';
  },

  MARRIAGE_TIMING: (slSig, slPlanet) => {
    if (['Saturn'].includes(slPlanet)) return 'Late — after sustained wait';
    if (slSig.includes(6) || slSig.includes(8) || slSig.includes(12)) return 'Delayed — obstacles present';
    if (slSig.includes(5) || slSig.includes(11)) return 'Timely — relatively early';
    if (slSig.includes(1)) return 'Delayed — self-focus first';
    return 'On time — as per social norm';
  },

  CAREER_PATH: (slSig) => {
    const job = slSig.filter(h => [6,10].includes(h)).length;
    const biz = slSig.filter(h => [7,11].includes(h)).length;
    if (job > biz) return 'Service / Employment path';
    if (biz > job) return 'Business / Self-employment path';
    return 'Hybrid — both paths viable';
  },

  CAREER_SECTOR: (slPlanet) => {
    const map = {
      Sun:     'Government, Administration, Medicine, Management',
      Moon:    'Public Service, Hospitality, Import/Export, Dairy',
      Mars:    'Military, Engineering, Real Estate, Surgery, Sports',
      Mercury: 'IT, Communication, Accounting, Writing, Trade',
      Jupiter: 'Law, Education, Finance, Religion, Advisory',
      Venus:   'Arts, Fashion, Beauty, Luxury, Hospitality',
      Saturn:  'Government Service, Mining, Construction, Research',
      Rahu:    'Technology, Foreign Companies, Media, Innovation',
      Ketu:    'Spiritual Work, Astrology, Forensics, Research'
    };
    return map[slPlanet] || 'Multi-sector — diverse career path';
  },

  GOVT_VS_PRIVATE: (slSig, slPlanet) => {
    const govtPlanets = ['Sun', 'Saturn', 'Moon'];
    const privPlanets = ['Mercury', 'Venus', 'Jupiter'];
    const govtScore = slSig.filter(h => [6,10].includes(h)).length
                    + (govtPlanets.includes(slPlanet) ? 2 : 0);
    const privScore = slSig.filter(h => [7,11].includes(h)).length
                    + (privPlanets.includes(slPlanet) ? 2 : 0);
    if (govtScore > privScore) return 'Government / Public sector';
    if (privScore > govtScore) return 'Private / Corporate sector';
    return 'Both sectors viable';
  },

  PROPERTY_ACTION: (netScore, slSig) => {
    if (netScore >= 2 && slSig.includes(11)) return 'Buy / Acquire';
    if (netScore <= -2 && slSig.includes(12)) return 'Sell / Vacate';
    if (slSig.includes(3) && slSig.includes(10)) return 'Transfer / Relocation';
    return 'Renovate / Repair existing';
  },

  PROPERTY_TYPE: (slSig, cuspSign) => {
    if (slSig.includes(12)) return 'Foreign / Abroad property';
    if (slSig.includes(10)) return 'Commercial / Office property';
    if (slSig.includes(3)) return 'Vehicle / Transport asset';
    const sign = SIGN_DATA[cuspSign];
    if (!sign) return 'Residential property';
    if (sign.element === 'Earth') return 'Land / Agricultural property';
    if (sign.element === 'Water') return 'Residential / Home near water';
    if (sign.element === 'Air')   return 'Apartment / Flat';
    if (sign.element === 'Fire')  return 'Independent House / Villa';
    return 'Residential property';
  },

  INCOME_TYPE: (slSig) => {
    if (slSig.includes(2) && slSig.includes(6) && slSig.includes(10)) return 'Salary / Service income';
    if (slSig.includes(7) && slSig.includes(11))  return 'Business / Partnership income';
    if (slSig.includes(5) && slSig.includes(11))  return 'Speculative / Investment income';
    if (slSig.includes(9) && slSig.includes(12))  return 'Foreign income';
    if (slSig.includes(8) && slSig.includes(11))  return 'Windfall / Inheritance income';
    return 'Multiple income streams';
  },

  VISA_TYPE: (slSig) => {
    if (slSig.includes(9) && slSig.includes(4))   return 'Student / Study permit';
    if (slSig.includes(6) && slSig.includes(10))  return 'Work visa / Employment permit';
    if (slSig.includes(12) && slSig.includes(11)) return 'PR / Permanent Residence';
    if (slSig.includes(3))                         return 'Tourist / Visitor visa';
    if (slSig.includes(6) && slSig.includes(8))   return 'Medical visa';
    if (slSig.includes(7))                         return 'Spouse / Dependent visa';
    return 'Visa type — mixed indicators';
  },

  CHILD_GENDER: (subPlanet, starPlanet, signLord) => {
    const mascPlanets = ['Sun','Mars','Jupiter','Mercury','Saturn','Rahu'];
    let mScore = 0, fScore = 0;
    [subPlanet, starPlanet, signLord].forEach(p => {
      if (mascPlanets.includes(p)) mScore++;
      else fScore++;
    });
    if (mScore > fScore) return 'Male tendency';
    if (fScore > mScore) return 'Female tendency';
    return 'Mixed — equal indication';
  },

  INHERITANCE_TYPE: (slSig) => {
    if (slSig.includes(8) && slSig.includes(4)) return 'Property / Land inheritance';
    if (slSig.includes(8) && slSig.includes(2) && slSig.includes(11)) return 'Money / Financial inheritance';
    if (slSig.includes(8) && slSig.includes(3)) return 'Vehicle / Equipment inheritance';
    return 'Mixed / Multiple types';
  },

  SPIRITUAL_PATH: (slPlanet) => {
    const map = {
      Jupiter: 'Traditional / Religious / Temple path',
      Ketu:    'Mystical / Moksha / Deep meditation path',
      Saturn:  'Disciplined / Ascetic / Renunciation path',
      Rahu:    'Unconventional / Tantric / Foreign spiritual path',
      Moon:    'Devotional / Emotional / Bhakti path',
      Sun:     'Solar / Surya upasana / Self-realisation'
    };
    return map[slPlanet] || 'Mixed spiritual inclination';
  },

  STUDY_FIELD: (slPlanet) => {
    const map = {
      Sun:     'Government / Administration / Medicine',
      Moon:    'Nursing / Public Administration / Hospitality',
      Mars:    'Engineering / Defense / Surgery / Technical',
      Mercury: 'Commerce / IT / Communication / Law',
      Jupiter: 'Philosophy / Education / Medicine / Law',
      Venus:   'Arts / Design / Music / Fashion',
      Saturn:  'Research / History / Agriculture / Mining',
      Rahu:    'Technology / Foreign study / Unconventional fields',
      Ketu:    'Occult / Spiritual / Research / Forensics'
    };
    return map[slPlanet] || 'Multi-disciplinary field';
  }
};

// ═══════════════════════════════════════════════════
// TABLE 7 — RP WEIGHTS
// ═══════════════════════════════════════════════════

const RP_WEIGHTS = {
  'rp-asc-nl':  3,  // Asc Nakshatra Lord — strongest
  'rp-moon-nl': 3,  // Moon Nakshatra Lord — strong
  'rp-asc-rl':  2,  // Asc Rasi Lord
  'rp-moon-rl': 2,  // Moon Rasi Lord
  'rp-asc-sl':  2,  // Asc Sub Lord
  'rp-moon-sl': 2,  // Moon Sub Lord
  'rp-day':     1   // Day Lord — weakest
};

// ═══════════════════════════════════════════════════
// TABLE 8 — PLANET + SIGN + HOUSE COMBINATIONS
// Core combination outputs (abbreviated for engine use)
// ═══════════════════════════════════════════════════

const COMBO_MAP = {
  // Format: 'Planet_Element' → descriptive output
  // Used for Star-lord × Sign element combinations

  // H7 Marriage spouse nature
  'Venus_Fire':    'Passionate, bold, independent and artistically expressive',
  'Venus_Earth':   'Stable, sensual, comfort-loving and reliably devoted',
  'Venus_Air':     'Socially charming, intellectually stimulating and communicative',
  'Venus_Water':   'Deeply romantic, emotionally sensitive and nurturing',
  'Jupiter_Fire':  'Wise, philosophical, adventurous and spiritually inclined',
  'Jupiter_Earth': 'Practical, grounded, financially sound and family-oriented',
  'Jupiter_Air':   'Intellectual, educated, socially conscious and advisory',
  'Jupiter_Water': 'Compassionate, spiritually deep and emotionally generous',
  'Saturn_Fire':   'Serious, disciplined, older-natured and authority-driven',
  'Saturn_Earth':  'Dutiful, patient, practical and reliably committed',
  'Saturn_Air':    'Detached, intellectually disciplined and independent',
  'Saturn_Water':  'Emotionally reserved, karmic bond and deeply responsible',
  'Mars_Fire':     'Passionate, energetic, independent and occasionally aggressive',
  'Mars_Earth':    'Hardworking, property-focused and practically confrontational',
  'Mars_Air':      'Quick-witted, argumentative and technically intelligent',
  'Mars_Water':    'Intensely emotional, passionate and surgically decisive',
  'Mercury_Fire':  'Quick-thinking, entrepreneurial and intellectually dynamic',
  'Mercury_Earth': 'Analytical, business-minded and practically intelligent',
  'Mercury_Air':   'Highly communicative, socially agile and mentally versatile',
  'Mercury_Water': 'Intuitively intelligent, emotionally adaptable and counselling-oriented',
  'Moon_Fire':     'Emotionally bold, publicly popular and nurturing in a dramatic way',
  'Moon_Earth':    'Domestically nurturing, caring and comfortably home-focused',
  'Moon_Air':      'Socially sensitive, publicly communicative and emotionally expressive',
  'Moon_Water':    'Deeply intuitive, psychically sensitive and profoundly caring',
  'Sun_Fire':      'Proud, authoritative, government-connected and dominantly confident',
  'Sun_Earth':     'Practically authoritative, status-conscious and professionally grounded',
  'Sun_Air':       'Socially prominent, intellectually proud and communicatively assertive',
  'Sun_Water':     'Emotionally proud, publicly influential and intuitively authoritative',
  'Rahu_Fire':     'Bold, unconventional, foreign-influenced and obsessively ambitious',
  'Rahu_Earth':    'Materially unconventional, foreign-connected and practically unusual',
  'Rahu_Air':      'Technologically advanced, foreign-minded and intellectually revolutionary',
  'Rahu_Water':    'Emotionally obsessive, foreign emotional connection and psychically unusual',
  'Ketu_Fire':     'Spiritually bold, past-life warrior energy and periodically detached',
  'Ketu_Earth':    'Spiritually practical, detached from material and moksha-oriented',
  'Ketu_Air':      'Intellectually spiritual, past-life scholar and mystically communicative',
  'Ketu_Water':    'Deeply psychic, spiritually sensitive and profoundly karmic'
};

// ═══════════════════════════════════════════════════
// PREDICTION ENGINE FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Check if Sub-lord satisfies the promise for a sub-event
 * Returns: { promised: bool, strength: 'strong'|'moderate'|'weak'|'denied',
 *            supportCount: n, obstructCount: n, netScore: n }
 */
function checkPromise(subEventKey, subLordSig) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { promised: false, strength: 'denied', supportCount: 0, obstructCount: 0, netScore: 0 };

  // Primary gate — hard check
  const primaryPresent = subLordSig.includes(rule.primaryGate);

  const supportCount  = rule.support.filter(h => subLordSig.includes(h)).length;
  const obstructCount = rule.obstruct.filter(h => subLordSig.includes(h)).length;
  const netScore      = supportCount - obstructCount;

  if (!primaryPresent) {
    return { promised: false, strength: 'denied', supportCount, obstructCount, netScore };
  }

  let strength = 'weak';
  if (supportCount >= 3) strength = 'strong';
  else if (supportCount >= 2) strength = 'moderate';
  else if (supportCount === 1) strength = 'weak';

  return { promised: true, strength, supportCount, obstructCount, netScore };
}

/**
 * Score DBA alignment for a sub-event
 * Returns: { score: n, adGate: bool, mdScore: n, adScore: n, pdScore: n,
 *            verdict: 'active'|'possible'|'not_this_period' }
 */
function scoreDBA(subEventKey, mdSig, adSig, pdSig) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { score: 0, adGate: false, verdict: 'not_this_period' };

  const allRelevant = [...new Set([rule.primaryGate, ...rule.support])];

  // AD Gate — mandatory
  const adGate = adSig.includes(rule.primaryGate);

  const countHits = (sig) => allRelevant.filter(h => sig.includes(h)).length
                           - rule.obstruct.filter(h => sig.includes(h)).length;

  const mdScore = countHits(mdSig) * DBA_WEIGHTS.MD;
  const adScore = countHits(adSig) * DBA_WEIGHTS.AD;
  const pdScore = countHits(pdSig) * DBA_WEIGHTS.PD;
  const score   = mdScore + adScore + pdScore;

  let verdict = 'not_this_period';
  if (adGate) {
    if (score >= 4)      verdict = 'active';
    else if (score >= 1) verdict = 'possible';
    else                 verdict = 'possible'; // AD gate open but score low
  }

  return { score, adGate, mdScore, adScore, pdScore, verdict };
}

/**
 * Score RP alignment
 * Returns: { rpScore: n, confidence: 'very_high'|'high'|'moderate'|'low'|'not_confirmed',
 *            matchedRPs: [] }
 */
function scoreRP(subEventKey, rpData, planetSig, dbaLords) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { rpScore: 0, confidence: 'not_confirmed', matchedRPs: [] };

  const allRelevant = [rule.primaryGate, ...rule.support];
  let rpScore = 0;
  const matchedRPs = [];

  Object.entries(rpData).forEach(([rpKey, planet]) => {
    if (!planet || planet === '—') return;
    const weight = RP_WEIGHTS[rpKey] || 1;
    const sig = planetSig[planet] || [];

    // RP signifies event house
    const sigHits = allRelevant.filter(h => sig.includes(h)).length;
    if (sigHits > 0) {
      rpScore += sigHits * weight;
      matchedRPs.push(planet);
    }

    // RP matches DBA lord
    if (dbaLords.includes(planet)) {
      rpScore += weight * 3;
    }
  });

  // Sub-lord = RP bonus
  const subLordPlanet = ''; // passed separately if needed
  let confidence = 'not_confirmed';
  if (rpScore >= 10)      confidence = 'very_high';
  else if (rpScore >= 6)  confidence = 'high';
  else if (rpScore >= 3)  confidence = 'moderate';
  else if (rpScore >= 1)  confidence = 'low';

  return { rpScore, confidence, matchedRPs: [...new Set(matchedRPs)] };
}

/**
 * Determine nature tilt from net score
 */
function getNatureTilt(netScore) {
  if (netScore >= 2)  return 'Supportive';
  if (netScore <= -2) return 'Obstructive';
  return 'Mixed';
}

/**
 * Get sign element combination output for a planet + cusp sign
 */
function getComboOutput(planet, cuspSign) {
  if (!planet || !cuspSign) return null;
  const sign = SIGN_DATA[cuspSign];
  if (!sign) return null;
  const key = `${planet}_${sign.element}`;
  return COMBO_MAP[key] || null;
}

/**
 * Derive all attributes for a sub-event
 */
function deriveAttributes(subEventKey, slSig, slPlanet, starPlanet, cuspSign, netScore) {
  const attrs = {};

  if (subEventKey === 'H7.UNION' || subEventKey === 'H7.TYPE') {
    attrs.marriageType    = ATTRIBUTE_RULES.MARRIAGE_TYPE(slSig);
    attrs.marriageTiming  = ATTRIBUTE_RULES.MARRIAGE_TIMING(slSig, slPlanet);
  }
  if (subEventKey === 'H7.SPOUSE_NATURE') {
    attrs.spouseNature    = getComboOutput(starPlanet, cuspSign) || 'See chart details';
  }
  if (subEventKey === 'H7.MARRIAGE_NUMBER') {
    attrs.marriageNumber  = slSig.includes(9) ? 'Second marriage possible' : 'One marriage indicated';
  }
  if (subEventKey === 'H10.PROFESSION' || subEventKey === 'H10.JOB_VS_BUSINESS') {
    attrs.careerPath      = ATTRIBUTE_RULES.CAREER_PATH(slSig);
    attrs.govtVsPrivate   = ATTRIBUTE_RULES.GOVT_VS_PRIVATE(slSig, slPlanet);
  }
  if (subEventKey === 'H10.SECTOR') {
    attrs.careerSector    = ATTRIBUTE_RULES.CAREER_SECTOR(starPlanet || slPlanet);
  }
  if (subEventKey === 'H4.PROPERTY_BUY' || subEventKey === 'H4.PROPERTY_SELL') {
    attrs.propertyAction  = ATTRIBUTE_RULES.PROPERTY_ACTION(netScore, slSig);
    attrs.propertyType    = ATTRIBUTE_RULES.PROPERTY_TYPE(slSig, cuspSign);
  }
  if (subEventKey === 'H2.WEALTH') {
    attrs.incomeType      = ATTRIBUTE_RULES.INCOME_TYPE(slSig);
  }
  if (subEventKey === 'H12.VISA') {
    attrs.visaType        = ATTRIBUTE_RULES.VISA_TYPE(slSig);
  }
  if (subEventKey === 'H5.CHILD_ENERGY') {
    const signLord = cuspSign ? SIGN_DATA[cuspSign]?.ruler : '';
    attrs.childGender     = ATTRIBUTE_RULES.CHILD_GENDER(slPlanet, starPlanet, signLord);
  }
  if (subEventKey === 'H8.INHERITANCE') {
    attrs.inheritanceType = ATTRIBUTE_RULES.INHERITANCE_TYPE(slSig);
  }
  if (subEventKey === 'H9.SPIRITUALITY') {
    attrs.spiritualPath   = ATTRIBUTE_RULES.SPIRITUAL_PATH(slPlanet);
  }
  if (subEventKey === 'H9.HIGHER_STUDY') {
    attrs.studyField      = ATTRIBUTE_RULES.STUDY_FIELD(starPlanet || slPlanet);
  }

  return attrs;
}

/**
 * Run full prediction for one house
 * Returns complete result object for that house
 */
function runHousePrediction(houseNum, chartData) {
  const houseInfo  = HOUSE_DATA[houseNum];
  const cuspData   = chartData.cusps[houseNum];
  const planetSig  = chartData.planetSig;
  const dba        = chartData.dba;
  const rp         = chartData.rp;

  if (!cuspData || !cuspData.sl || cuspData.sl === '—') {
    return {
      house: houseNum,
      name: houseInfo.name,
      domain: houseInfo.domain,
      error: 'Sub-lord not entered',
      subEvents: []
    };
  }

  const slPlanet   = cuspData.sl;
  const nlPlanet   = cuspData.nl;
  const cuspSign   = cuspData.sign;
  const slSig      = planetSig[slPlanet] || [];
  const mdSig      = planetSig[dba.md]   || [];
  const adSig      = planetSig[dba.ad]   || [];
  const pdSig      = planetSig[dba.pd]   || [];
  const dbaLords   = [dba.md, dba.ad, dba.pd].filter(Boolean);

  // Run each sub-event
  const subEventResults = houseInfo.subEvents.map(seKey => {
    const fullKey = `H${houseNum}.${seKey}`;
    const rule    = SUB_EVENT_RULES[fullKey];
    if (!rule) return null;

    const promise = checkPromise(fullKey, slSig);
    const dbaResult = rule.type === 'Life'
      ? { score: 0, verdict: 'life_reading', adGate: true }
      : scoreDBA(fullKey, mdSig, adSig, pdSig);
    const rpResult  = scoreRP(fullKey, rp, planetSig, dbaLords);
    const natureTilt = getNatureTilt(promise.netScore);
    const attrs     = promise.promised
      ? deriveAttributes(fullKey, slSig, slPlanet, nlPlanet, cuspSign, promise.netScore)
      : {};
    const comboOut  = getComboOutput(nlPlanet, cuspSign);

    return {
      key:         fullKey,
      name:        seKey.replace(/_/g, ' '),
      type:        rule.type,
      promise:     promise,
      dba:         dbaResult,
      rp:          rpResult,
      nature:      natureTilt,
      attributes:  attrs,
      combination: comboOut,
      slPlanet,
      nlPlanet,
      cuspSign,
      signData:    SIGN_DATA[cuspSign] || null
    };
  }).filter(Boolean);

  // House-level summary
  const primaryPresent = slSig.includes(houseNum);
  const totalSupport   = houseInfo.support.filter(h => slSig.includes(h)).length;
  const totalObstruct  = houseInfo.obstruct.filter(h => slSig.includes(h)).length;
  const houseNetScore  = totalSupport - totalObstruct;
  const houseNature    = getNatureTilt(houseNetScore);
  const adActive       = adSig.includes(houseNum);

  // Overall house verdict
  let houseVerdict = 'Not Promised';
  if (primaryPresent) {
    if (adActive && houseNetScore >= 0) houseVerdict = 'Active';
    else if (adActive)                   houseVerdict = 'Active with challenges';
    else                                 houseVerdict = 'Promised — awaiting period';
  }

  return {
    house:         houseNum,
    name:          houseInfo.name,
    domain:        houseInfo.domain,
    Sanskrit:      houseInfo.Sanskrit,
    slPlanet,
    nlPlanet,
    cuspSign,
    signData:      SIGN_DATA[cuspSign] || null,
    slSignif:      slSig,
    primaryPresent,
    totalSupport,
    totalObstruct,
    houseNetScore,
    houseNature,
    houseVerdict,
    adActive,
    subEvents:     subEventResults
  };
}

/**
 * Run full chart prediction — all 12 houses
 */
function runFullChart(chartData) {
  const results = {};
  for (let h = 1; h <= 12; h++) {
    results[h] = runHousePrediction(h, chartData);
  }
  return results;
}

/**
 * Generate summary statistics across all houses
 */
function getChartSummary(results) {
  let supportive = 0, mixed = 0, obstructive = 0, notPromised = 0;
  Object.values(results).forEach(r => {
    if (r.error) return;
    if (r.houseVerdict === 'Not Promised') notPromised++;
    else if (r.houseNature === 'Supportive') supportive++;
    else if (r.houseNature === 'Obstructive') obstructive++;
    else mixed++;
  });
  return { supportive, mixed, obstructive, notPromised };
}

/**
 * Generate astrological interpretation text for a house
 * This is the main narrative paragraph shown on dashboard card
 */
function generateHouseInterpretation(houseResult, chartData) {
  const { house, name, slPlanet, nlPlanet, cuspSign,
          signData, houseNature, houseVerdict,
          primaryPresent, totalSupport, totalObstruct,
          houseNetScore, adActive } = houseResult;

  const dba = chartData.dba;
  const hData = HOUSE_DATA[house];
  const sign = signData;

  // Build interpretation
  let text = '';

  // Opening — Sub-lord and primary gate
  if (!primaryPresent) {
    text += `The Sub-lord of the ${getOrdinal(house)} Bhava is <strong>${slPlanet}</strong>, `;
    text += `whose significations do not encompass the ${getOrdinal(house)} house itself. `;
    text += `By the KP principle, this indicates that the core matters of the ${name} house `;
    text += `are not strongly promised in the current chart configuration. `;
  } else {
    text += `The Sub-lord of the ${getOrdinal(house)} Bhava is <strong>${slPlanet}</strong>, `;
    text += `which carries the signification of the ${getOrdinal(house)} house — confirming `;
    text += `that the matters governed by this Bhava are indeed promised in the nativity. `;
  }

  // Support/Obstruct description
  if (primaryPresent && totalSupport >= 2) {
    text += `The Sub-lord further connects to ${totalSupport} supporting house${totalSupport > 1 ? 's' : ''}, `;
    text += `lending considerable strength to the promise of ${name.toLowerCase()}. `;
  }
  if (totalObstruct > 0) {
    text += `However, the presence of ${totalObstruct} obstructing house${totalObstruct > 1 ? 's' : ''} `;
    text += `in the Sub-lord's significations introduces `;
    text += totalObstruct === 1 ? 'a degree of friction. ' : 'notable complications. ';
  }

  // Star-lord contribution
  if (nlPlanet) {
    const nlData = PLANET_DATA[nlPlanet];
    if (nlData) {
      text += `The Star-lord <strong>${nlPlanet}</strong>, `;
      text += `whose natural karakatva encompasses ${nlData.karakatva.slice(0,3).join(', ')}, `;
      text += `colors the manner in which these matters shall unfold. `;
    }
  }

  // Sign contribution
  if (sign) {
    text += `The ${getOrdinal(house)} cusp falling in <strong>${cuspSign}</strong> — `;
    text += `a ${sign.element} sign of ${sign.quality} quality — `;
    if (sign.quality === 'Movable')
      text += `suggests events in this domain will manifest with relative swiftness once triggered. `;
    else if (sign.quality === 'Fixed')
      text += `indicates that once manifested, results in this domain will be enduring and resistant to change. `;
    else
      text += `points to a mixed and phased unfolding of events in this domain. `;
  }

  // DBA period assessment
  if (primaryPresent) {
    text += `In the current period of <strong>${dba.md}–${dba.ad}–${dba.pd}</strong>, `;
    if (adActive) {
      text += `the Antardasha lord ${dba.ad} is actively signifying this house, `;
      text += houseNetScore >= 2
        ? `creating a strongly supportive window for ${name.toLowerCase()} matters to fructify. `
        : houseNetScore >= 0
        ? `keeping this domain alive and active, though results may require conscious effort. `
        : `though the overall balance of significations introduces challenges that must be navigated carefully. `;
    } else {
      text += `the Antardasha lord ${dba.ad} does not presently activate this house directly. `;
      text += `The promise exists in the chart, yet the current Bhukti has not opened the gates for manifestation. `;
      text += `A future Antardasha connecting to this Bhava shall bring results forward. `;
    }
  }

  // Nature summary
  if (houseNature === 'Supportive') {
    text += `The overall planetary configuration renders this Bhava <strong>decidedly supportive</strong> in the present analysis.`;
  } else if (houseNature === 'Obstructive') {
    text += `The overall configuration indicates <strong>obstructive influences</strong> presently governing this Bhava — patience and caution are advised.`;
  } else {
    text += `The indications are <strong>mixed</strong> — promise exists but the path requires deliberate effort and timing.`;
  }

  return text;
}

// Helper: ordinal numbers
function getOrdinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ═══════════════════════════════════════════════════
// DATA PASSING BETWEEN PAGES
// Uses sessionStorage — cleared on tab/window close
// ═══════════════════════════════════════════════════

function saveChartData(data) {
  sessionStorage.setItem('kp_input', JSON.stringify(data));
}

function loadChartData() {
  const raw = sessionStorage.getItem('kp_input');
  return raw ? JSON.parse(raw) : null;
}

function saveResults(results) {
  sessionStorage.setItem('kp_results', JSON.stringify(results));
}

function loadResults() {
  const raw = sessionStorage.getItem('kp_results');
  return raw ? JSON.parse(raw) : null;
}

function clearAll() {
  sessionStorage.removeItem('kp_input');
  sessionStorage.removeItem('kp_results');
}
