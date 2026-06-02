/* ═══════════════════════════════════════════════════
   KP ASTROLOGY ANALYSER — Prediction Engine v2.0
   kp_engine.js
   Fixed: Promise gate, NL of SL, TABLE 9 contextual
   meanings, DBA scoring, interpretation text,
   attribute rules, lagnesh impact
═══════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════
// TABLE 0 — NAKSHATRA DATA (for NL of SL derivation)
// ═══════════════════════════════════════════════════

// Each nakshatra: start degree (absolute from Aries 0), lord
const NAKSHATRA_DATA = [
  { name:'Ashwini',      start:0,        lord:'Ketu'    },
  { name:'Bharani',      start:13.333,   lord:'Venus'   },
  { name:'Krittika',     start:26.667,   lord:'Sun'     },
  { name:'Rohini',       start:40.000,   lord:'Moon'    },
  { name:'Mrigashira',   start:53.333,   lord:'Mars'    },
  { name:'Ardra',        start:66.667,   lord:'Rahu'    },
  { name:'Punarvasu',    start:80.000,   lord:'Jupiter' },
  { name:'Pushya',       start:93.333,   lord:'Saturn'  },
  { name:'Ashlesha',     start:106.667,  lord:'Mercury' },
  { name:'Magha',        start:120.000,  lord:'Ketu'    },
  { name:'PurvaPhalguni',start:133.333,  lord:'Venus'   },
  { name:'UttaraPhalguni',start:146.667, lord:'Sun'     },
  { name:'Hasta',        start:160.000,  lord:'Moon'    },
  { name:'Chitra',       start:173.333,  lord:'Mars'    },
  { name:'Swati',        start:186.667,  lord:'Rahu'    },
  { name:'Vishakha',     start:200.000,  lord:'Jupiter' },
  { name:'Anuradha',     start:213.333,  lord:'Saturn'  },
  { name:'Jyeshtha',     start:226.667,  lord:'Mercury' },
  { name:'Mula',         start:240.000,  lord:'Ketu'    },
  { name:'PurvaAshadha', start:253.333,  lord:'Venus'   },
  { name:'UttaraAshadha',start:266.667,  lord:'Sun'     },
  { name:'Shravana',     start:280.000,  lord:'Moon'    },
  { name:'Dhanishtha',   start:293.333,  lord:'Mars'    },
  { name:'Shatabhisha',  start:306.667,  lord:'Rahu'    },
  { name:'PurvaBhadra',  start:320.000,  lord:'Jupiter' },
  { name:'UttaraBhadra', start:333.333,  lord:'Saturn'  },
  { name:'Revati',       start:346.667,  lord:'Mercury' }
];

const SIGN_ORDER = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

/**
 * Convert sign + degree string to absolute longitude (0-360)
 * degStr format: "DDMMSS" e.g. "062639"
 */
function toAbsoluteDeg(sign, degStr) {
  const signIdx = SIGN_ORDER.indexOf(sign);
  if (signIdx < 0) return null;
  if (!degStr || degStr.length < 6) return signIdx * 30;
  const d = parseInt(degStr.slice(0,2)) || 0;
  const m = parseInt(degStr.slice(2,4)) || 0;
  const s = parseInt(degStr.slice(4,6)) || 0;
  const degInSign = d + m/60 + s/3600;
  return signIdx * 30 + degInSign;
}

/**
 * Get nakshatra lord for a given absolute longitude
 */
function getNakshatraLord(absLong) {
  if (absLong === null || absLong === undefined) return null;
  const norm = ((absLong % 360) + 360) % 360;
  // Find which nakshatra
  let found = NAKSHATRA_DATA[0];
  for (let i = NAKSHATRA_DATA.length - 1; i >= 0; i--) {
    if (norm >= NAKSHATRA_DATA[i].start) {
      found = NAKSHATRA_DATA[i];
      break;
    }
  }
  return found.lord;
}

/**
 * Get true NL of SL:
 * Find the SL planet's position in the chart
 * Return lord of nakshatra where SL planet sits
 * If SL planet position not found → fall back to cusp NL
 */
function getNLofSL(slPlanet, chartData, cuspNL) {
  if (!slPlanet || !chartData) return cuspNL;

  // Look up SL planet position from chart planet data
  const pData = chartData.planets && chartData.planets[slPlanet];
  if (pData && pData.sign && pData.deg_raw) {
    const absLong = toAbsoluteDeg(pData.sign, pData.deg_raw);
    if (absLong !== null) {
      return getNakshatraLord(absLong);
    }
  }

  // Fallback: try to derive from cusp data if SL matches a cusp's SL
  // For planets occupying houses we can check their cusp position
  // Last resort: return cusp NL
  return cuspNL;
}

// ═══════════════════════════════════════════════════
// TABLE 1 — HOUSE CLUSTERS
// ═══════════════════════════════════════════════════

const HOUSE_DATA = {
  1:  { name:'Self',           domain:'Body, Mind, Personality & Vitality',
        Sanskrit:'Tanu Bhava',    primary:1, cluster:[1,5,9,11],      obstruct:[6,8,12],
        subEvents:['BODY','MIND','PERSONALITY','APPEARANCE','LIFE_PHASE','NATURE_BEHAVIOUR'] },
  2:  { name:'Wealth',         domain:'Money, Family, Speech & Savings',
        Sanskrit:'Dhana Bhava',   primary:2, cluster:[2,6,10,11],     obstruct:[5,8,12],
        subEvents:['WEALTH','SAVINGS','FAMILY','SPEECH','FOOD'] },
  3:  { name:'Siblings',       domain:'Siblings, Courage, Communication & Short Travel',
        Sanskrit:'Sahaja Bhava',  primary:3, cluster:[3,9,11],        obstruct:[6,8,12],
        subEvents:['SIBLINGS','COURAGE','COMMUNICATION','SHORT_TRAVEL','SKILLS'] },
  4:  { name:'Property',       domain:'Home, Mother, Property, Vehicles & Education',
        Sanskrit:'Sukha Bhava',   primary:4, cluster:[4,11,12],       obstruct:[6,8,10],
        subEvents:['PROPERTY_BUY','PROPERTY_SELL','PROPERTY_RENOVATE','PROPERTY_TYPE','VEHICLE','MOTHER','EDUCATION','DOMESTIC'] },
  5:  { name:'Children',       domain:'Children, Romance, Creativity & Speculation',
        Sanskrit:'Putra Bhava',   primary:5, cluster:[2,5,11],        obstruct:[1,4,10],
        subEvents:['ROMANCE','CONCEPTION','DELIVERY','CHILD_ENERGY','CHILD_NUMBER','CREATIVITY','SPECULATION','INTELLIGENCE'] },
  6:  { name:'Service',        domain:'Employment, Debt, Disease, Competition & Litigation',
        Sanskrit:'Ari Bhava',     primary:6, cluster:[2,6,10,11],     obstruct:[1,5,12],
        subEvents:['EMPLOYMENT','DEBT','DISEASE','COMPETITION','LITIGATION','BODY_PART','ENEMIES'] },
  7:  { name:'Marriage',       domain:'Spouse, Marriage, Partnership & Public Dealings',
        Sanskrit:'Kalatra Bhava', primary:7, cluster:[2,7,11],        obstruct:[1,6,10,12],
        subEvents:['UNION','SEPARATION','SPOUSE_NATURE','PARTNERSHIP','TYPE','MARRIAGE_NUMBER'] },
  8:  { name:'Transformation', domain:'Longevity, Inheritance, Occult & Sudden Events',
        Sanskrit:'Ayur Bhava',    primary:8, cluster:[2,8,11],        obstruct:[1,4,10],
        subEvents:['LONGEVITY','INHERITANCE','OCCULT','CRISIS','TRANSFORMATION','EOL'] },
  9:  { name:'Fortune',        domain:'Father, Luck, Higher Study, Long Travel & Dharma',
        Sanskrit:'Bhagya Bhava',  primary:9, cluster:[5,9,11],        obstruct:[4,6,12],
        subEvents:['FORTUNE','FATHER','HIGHER_STUDY','LONG_TRAVEL','SPIRITUALITY'] },
  10: { name:'Career',         domain:'Profession, Status, Authority & Karma',
        Sanskrit:'Karma Bhava',   primary:10, cluster:[2,6,10,11],    obstruct:[4,5,12],
        subEvents:['PROFESSION','PROMOTION','JOB_CHANGE','BUSINESS','JOB_VS_BUSINESS','GOVT_PRIVATE','SECTOR','STATUS'] },
  11: { name:'Gains',          domain:'Income, Desires, Elder Siblings & Networks',
        Sanskrit:'Labha Bhava',   primary:11, cluster:[2,6,10,11],    obstruct:[5,8,12],
        subEvents:['INCOME','DESIRES','ELDER_SIBLING','NETWORK','GAINS'] },
  12: { name:'Foreign',        domain:'Foreign Lands, Expenses, Hospital & Moksha',
        Sanskrit:'Vyaya Bhava',   primary:12, cluster:[3,9,12],       obstruct:[2,4,10],
        subEvents:['FOREIGN','VISA','RESIDENCE','HOSPITAL','EXPENSES','SECLUSION','MOKSHA'] }
};

// ═══════════════════════════════════════════════════
// TABLE 2 — PLANET KARAKATVA MAP
// ═══════════════════════════════════════════════════

const PLANET_DATA = {
  Sun:     { nature:'mild_malefic',     gender:'M',
             karakatva:['soul','father','authority','government','leadership','health','vitality'],
             friendly:['Moon','Mars','Jupiter'], enemy:['Saturn','Venus'], neutral:['Mercury'],
             exaltation:'Aries', debilitation:'Libra',
             bodyParts:['heart','spine','right_eye','bones'],
             professions:['government','politics','medicine','management','gold_trade'],
             color:'#e8a030', dbaPeriodYears:6 },
  Moon:    { nature:'benefic',          gender:'F',
             karakatva:['mind','mother','emotions','public','memory','water','nurturing'],
             friendly:['Sun','Mercury'], enemy:[], neutral:['Mars','Jupiter','Venus','Saturn'],
             exaltation:'Taurus', debilitation:'Scorpio',
             bodyParts:['mind','left_eye','breasts','stomach','uterus','lymph'],
             professions:['nursing','hospitality','import_export','agriculture','public_service'],
             color:'#90aac8', dbaPeriodYears:10 },
  Mars:    { nature:'malefic',          gender:'M',
             karakatva:['energy','courage','aggression','siblings','property','surgery','blood'],
             friendly:['Sun','Moon','Jupiter'], enemy:['Mercury','Saturn'], neutral:['Venus'],
             exaltation:'Capricorn', debilitation:'Cancer',
             bodyParts:['blood','muscles','marrow','head','forehead'],
             professions:['military','police','surgery','engineering','real_estate','sports'],
             color:'#d05040', dbaPeriodYears:7 },
  Mercury: { nature:'neutral',          gender:'N',
             karakatva:['intelligence','communication','business','writing','analysis','trade'],
             friendly:['Sun','Venus'], enemy:['Moon'], neutral:['Mars','Jupiter','Saturn'],
             exaltation:'Virgo', debilitation:'Pisces',
             bodyParts:['nervous_system','skin','tongue','arms','hands','intestines'],
             professions:['accounting','banking','writing','IT','teaching','trade'],
             color:'#50c880', dbaPeriodYears:17 },
  Jupiter: { nature:'greatest_benefic', gender:'M',
             karakatva:['wisdom','children','wealth','dharma','religion','law','expansion'],
             friendly:['Sun','Moon','Mars'], enemy:['Mercury','Venus'], neutral:['Saturn'],
             exaltation:'Cancer', debilitation:'Capricorn',
             bodyParts:['liver','hips','thighs','fat','arteries','ears'],
             professions:['teaching','law','finance','religion','advisory','medicine'],
             color:'#d8b040', dbaPeriodYears:16 },
  Venus:   { nature:'benefic',          gender:'F',
             karakatva:['love','marriage','beauty','arts','comforts','luxury','vehicles'],
             friendly:['Mercury','Saturn'], enemy:['Sun','Moon'], neutral:['Mars','Jupiter'],
             exaltation:'Pisces', debilitation:'Virgo',
             bodyParts:['reproductive','kidneys','face','throat','skin'],
             professions:['arts','music','fashion','luxury','hospitality','beauty','finance'],
             color:'#e080a0', dbaPeriodYears:20 },
  Saturn:  { nature:'greatest_malefic', gender:'N',
             karakatva:['discipline','delay','service','karma','longevity','masses','detachment'],
             friendly:['Mercury','Venus'], enemy:['Sun','Moon','Mars'], neutral:['Jupiter'],
             exaltation:'Libra', debilitation:'Aries',
             bodyParts:['bones','teeth','knees','joints','skin','hair','spleen'],
             professions:['government','mining','agriculture','construction','law_enforcement','research'],
             color:'#8090b8', dbaPeriodYears:19 },
  Rahu:    { nature:'malefic_amplifier', gender:'M',
             karakatva:['foreign','unconventional','obsession','technology','illusion','amplifier'],
             friendly:[], enemy:[], neutral:[],
             exaltation:'Gemini', debilitation:'Sagittarius',
             bodyParts:['nervous_system','skin','breathing','intestines'],
             professions:['technology','foreign_trade','politics','media','research'],
             color:'#6878a0', dbaPeriodYears:18, alwaysRetrograde:true },
  Ketu:    { nature:'malefic_spiritual', gender:'F',
             karakatva:['spirituality','detachment','past_karma','occult','isolation','moksha'],
             friendly:[], enemy:[], neutral:[],
             exaltation:'Sagittarius', debilitation:'Gemini',
             bodyParts:['feet','toes','abdomen','mysterious_conditions'],
             professions:['spirituality','astrology','research','forensics','healing'],
             color:'#b09060', dbaPeriodYears:7, alwaysRetrograde:true }
};

// ═══════════════════════════════════════════════════
// TABLE 3 — SIGN PROPERTIES
// ═══════════════════════════════════════════════════

const SIGN_DATA = {
  Aries:       {num:1,  element:'Fire',  quality:'Movable', direction:'East',  ruler:'Mars',    gender:'M', bodyPart:'head_brain'},
  Taurus:      {num:2,  element:'Earth', quality:'Fixed',   direction:'South', ruler:'Venus',   gender:'F', bodyPart:'neck_throat'},
  Gemini:      {num:3,  element:'Air',   quality:'Dual',    direction:'West',  ruler:'Mercury', gender:'M', bodyPart:'shoulders_arms_lungs'},
  Cancer:      {num:4,  element:'Water', quality:'Movable', direction:'North', ruler:'Moon',    gender:'F', bodyPart:'chest_stomach'},
  Leo:         {num:5,  element:'Fire',  quality:'Fixed',   direction:'East',  ruler:'Sun',     gender:'M', bodyPart:'heart_spine'},
  Virgo:       {num:6,  element:'Earth', quality:'Dual',    direction:'South', ruler:'Mercury', gender:'F', bodyPart:'abdomen_intestines'},
  Libra:       {num:7,  element:'Air',   quality:'Movable', direction:'West',  ruler:'Venus',   gender:'M', bodyPart:'kidneys_lower_back'},
  Scorpio:     {num:8,  element:'Water', quality:'Fixed',   direction:'North', ruler:'Mars',    gender:'F', bodyPart:'reproductive_bladder'},
  Sagittarius: {num:9,  element:'Fire',  quality:'Dual',    direction:'East',  ruler:'Jupiter', gender:'M', bodyPart:'hips_thighs_liver'},
  Capricorn:   {num:10, element:'Earth', quality:'Movable', direction:'South', ruler:'Saturn',  gender:'F', bodyPart:'knees_bones_joints'},
  Aquarius:    {num:11, element:'Air',   quality:'Fixed',   direction:'West',  ruler:'Saturn',  gender:'M', bodyPart:'ankles_circulation'},
  Pisces:      {num:12, element:'Water', quality:'Dual',    direction:'North', ruler:'Jupiter', gender:'F', bodyPart:'feet_lymphatic'}
};

// ═══════════════════════════════════════════════════
// TABLE 4 — DBA WEIGHT CONFIG
// ═══════════════════════════════════════════════════

const DBA_WEIGHTS = { MD:1, AD:2, PD:1 };

// ═══════════════════════════════════════════════════
// TABLE 5 — SUB-EVENT RULES (CORRECTED PROMISE GATE)
// primaryGate = main house (presence = +3)
// cluster = additional supporting houses (each = +1)
// obstruct = obstructing houses (each = -1)
// type = 'Life' | 'Time'
// ═══════════════════════════════════════════════════

const SUB_EVENT_RULES = {
  'H1.BODY':             {primaryGate:1, cluster:[5,11],        obstruct:[6,8,12],    type:'Time'},
  'H1.MIND':             {primaryGate:1, cluster:[5,9],         obstruct:[6,8,12],    type:'Time'},
  'H1.PERSONALITY':      {primaryGate:1, cluster:[3,10],        obstruct:[6,8,12],    type:'Life'},
  'H1.APPEARANCE':       {primaryGate:1, cluster:[2],           obstruct:[6,8,12],    type:'Life'},
  'H1.LIFE_PHASE':       {primaryGate:1, cluster:[9,10,11],     obstruct:[6,8,12],    type:'Time'},
  'H1.NATURE_BEHAVIOUR': {primaryGate:1, cluster:[3,5],         obstruct:[6,8,12],    type:'Life'},

  'H2.WEALTH':  {primaryGate:2, cluster:[6,10,11],  obstruct:[5,8,12],    type:'Time'},
  'H2.SAVINGS': {primaryGate:2, cluster:[4,11],      obstruct:[5,8,12],    type:'Time'},
  'H2.FAMILY':  {primaryGate:2, cluster:[4],         obstruct:[6,8,12],    type:'Life'},
  'H2.SPEECH':  {primaryGate:2, cluster:[3,11],      obstruct:[6,8,12],    type:'Life'},
  'H2.FOOD':    {primaryGate:2, cluster:[4,11],      obstruct:[6,8,12],    type:'Life'},

  'H3.SIBLINGS':      {primaryGate:3, cluster:[11],       obstruct:[6,8,12],    type:'Life'},
  'H3.COURAGE':       {primaryGate:3, cluster:[1,9],      obstruct:[6,8,12],    type:'Life'},
  'H3.COMMUNICATION': {primaryGate:3, cluster:[9,11],     obstruct:[6,8,12],    type:'Time'},
  'H3.SHORT_TRAVEL':  {primaryGate:3, cluster:[9,12],     obstruct:[4,8,10],    type:'Time'},
  'H3.SKILLS':        {primaryGate:3, cluster:[6,10],     obstruct:[8,12],      type:'Life'},

  'H4.PROPERTY_BUY':      {primaryGate:4, cluster:[11,2],      obstruct:[6,8,12],    type:'Time'},
  'H4.PROPERTY_SELL':     {primaryGate:4, cluster:[12,3,10],   obstruct:[6,8,2],     type:'Time'},
  'H4.PROPERTY_RENOVATE': {primaryGate:4, cluster:[2,11],      obstruct:[6,8,12],    type:'Time'},
  'H4.PROPERTY_TYPE':     {primaryGate:4, cluster:[10,11,12],  obstruct:[],          type:'Life'},
  'H4.VEHICLE':           {primaryGate:4, cluster:[11,2],      obstruct:[6,8,12],    type:'Time'},
  'H4.MOTHER':            {primaryGate:4, cluster:[2,11],      obstruct:[6,8,12],    type:'Life'},
  'H4.EDUCATION':         {primaryGate:4, cluster:[9,11],      obstruct:[6,8,12],    type:'Time'},
  'H4.DOMESTIC':          {primaryGate:4, cluster:[2,7,11],    obstruct:[6,8,12],    type:'Time'},

  'H5.ROMANCE':       {primaryGate:5, cluster:[7,11],     obstruct:[1,6,12],    type:'Time'},
  'H5.CONCEPTION':    {primaryGate:5, cluster:[2,11],     obstruct:[1,4,10],    type:'Time'},
  'H5.DELIVERY':      {primaryGate:5, cluster:[2,11],     obstruct:[6,8,12],    type:'Time'},
  'H5.CHILD_ENERGY':  {primaryGate:5, cluster:[],         obstruct:[],          type:'Life'},
  'H5.CHILD_NUMBER':  {primaryGate:5, cluster:[9,11],     obstruct:[1,4,10],    type:'Life'},
  'H5.CREATIVITY':    {primaryGate:5, cluster:[3,11],     obstruct:[6,8,12],    type:'Life'},
  'H5.SPECULATION':   {primaryGate:5, cluster:[11],       obstruct:[6,8,12],    type:'Time'},
  'H5.INTELLIGENCE':  {primaryGate:5, cluster:[9],        obstruct:[6,8,12],    type:'Life'},

  'H6.EMPLOYMENT': {primaryGate:6, cluster:[2,10,11],  obstruct:[1,5,12],    type:'Time'},
  'H6.DEBT':       {primaryGate:6, cluster:[2,11],     obstruct:[5,8,12],    type:'Time'},
  'H6.DISEASE':    {primaryGate:6, cluster:[8,12],     obstruct:[1,5,11],    type:'Time'},
  'H6.COMPETITION':{primaryGate:6, cluster:[3,11],     obstruct:[5,8,12],    type:'Time'},
  'H6.LITIGATION': {primaryGate:6, cluster:[1,11],     obstruct:[7,8,12],    type:'Time'},
  'H6.BODY_PART':  {primaryGate:6, cluster:[8,12],     obstruct:[],          type:'Life'},
  'H6.ENEMIES':    {primaryGate:6, cluster:[1,11],     obstruct:[4,8,12],    type:'Time'},

  'H7.UNION':          {primaryGate:7, cluster:[2,11],     obstruct:[1,6,10,12], type:'Time'},
  'H7.SEPARATION':     {primaryGate:1, cluster:[6,12],     obstruct:[2,7,11],    type:'Time'},
  'H7.SPOUSE_NATURE':  {primaryGate:7, cluster:[2,11],     obstruct:[6,8,12],    type:'Life'},
  'H7.PARTNERSHIP':    {primaryGate:7, cluster:[10,11],    obstruct:[6,8,12],    type:'Time'},
  'H7.TYPE':           {primaryGate:7, cluster:[2,3,9,11], obstruct:[],          type:'Life'},
  'H7.MARRIAGE_NUMBER':{primaryGate:7, cluster:[9],        obstruct:[6,8,12],    type:'Life'},

  'H8.LONGEVITY':      {primaryGate:8, cluster:[1,5],      obstruct:[6,12],      type:'Life'},
  'H8.INHERITANCE':    {primaryGate:8, cluster:[2,11],     obstruct:[6,12],      type:'Time'},
  'H8.OCCULT':         {primaryGate:8, cluster:[9,12],     obstruct:[2,6,10],    type:'Life'},
  'H8.CRISIS':         {primaryGate:8, cluster:[6,12],     obstruct:[1,5,11],    type:'Time'},
  'H8.TRANSFORMATION': {primaryGate:8, cluster:[1,9],      obstruct:[2,4,10],    type:'Time'},
  'H8.EOL':            {primaryGate:8, cluster:[12],       obstruct:[1,6],       type:'Life'},

  'H9.FORTUNE':      {primaryGate:9, cluster:[5,11],   obstruct:[4,6,12],    type:'Time'},
  'H9.FATHER':       {primaryGate:9, cluster:[10],     obstruct:[6,8,12],    type:'Life'},
  'H9.HIGHER_STUDY': {primaryGate:9, cluster:[4,12],   obstruct:[3,6],       type:'Time'},
  'H9.LONG_TRAVEL':  {primaryGate:9, cluster:[3,12],   obstruct:[4,10],      type:'Time'},
  'H9.SPIRITUALITY': {primaryGate:9, cluster:[8,12],   obstruct:[2,6,10],    type:'Life'},

  'H10.PROFESSION':     {primaryGate:10, cluster:[2,6,11],   obstruct:[4,5,12],    type:'Life'},
  'H10.PROMOTION':      {primaryGate:10, cluster:[6,11],     obstruct:[4,8,12],    type:'Time'},
  'H10.JOB_CHANGE':     {primaryGate:10, cluster:[3,9],      obstruct:[4,8,12],    type:'Time'},
  'H10.BUSINESS':       {primaryGate:10, cluster:[7,11],     obstruct:[6,8,12],    type:'Time'},
  'H10.JOB_VS_BUSINESS':{primaryGate:10, cluster:[6,7,11],   obstruct:[],          type:'Life'},
  'H10.GOVT_PRIVATE':   {primaryGate:10, cluster:[6,7,11],   obstruct:[],          type:'Life'},
  'H10.SECTOR':         {primaryGate:10, cluster:[],         obstruct:[],          type:'Life'},
  'H10.STATUS':         {primaryGate:10, cluster:[1,11],     obstruct:[6,8,12],    type:'Time'},

  'H11.INCOME':        {primaryGate:11, cluster:[2,6,10],  obstruct:[5,8,12],    type:'Time'},
  'H11.DESIRES':       {primaryGate:11, cluster:[5,9],     obstruct:[6,8,12],    type:'Time'},
  'H11.ELDER_SIBLING': {primaryGate:11, cluster:[3],       obstruct:[6,8,12],    type:'Life'},
  'H11.NETWORK':       {primaryGate:11, cluster:[3,7],     obstruct:[6,8,12],    type:'Time'},
  'H11.GAINS':         {primaryGate:11, cluster:[5,9],     obstruct:[8,12],      type:'Time'},

  'H12.FOREIGN':   {primaryGate:12, cluster:[3,9],     obstruct:[2,4,10],    type:'Time'},
  'H12.VISA':      {primaryGate:12, cluster:[3,6,9],   obstruct:[2,4,8],     type:'Time'},
  'H12.RESIDENCE': {primaryGate:12, cluster:[4],       obstruct:[2,10],      type:'Time'},
  'H12.HOSPITAL':  {primaryGate:12, cluster:[6,8],     obstruct:[1,5,11],    type:'Time'},
  'H12.EXPENSES':  {primaryGate:12, cluster:[6,8],     obstruct:[2,10,11],   type:'Time'},
  'H12.SECLUSION': {primaryGate:12, cluster:[8,9],     obstruct:[1,7,11],    type:'Time'},
  'H12.MOKSHA':    {primaryGate:12, cluster:[8,9],     obstruct:[2,7,10],    type:'Life'}
};

// ═══════════════════════════════════════════════════
// TABLE 6 — ATTRIBUTE DERIVATION (CORRECTED)
// ═══════════════════════════════════════════════════

const ATTRIBUTE_RULES = {

  // MARRIAGE TYPE — uses corrected TABLE 9 H7 contextual meanings
  // H5 = love indicator, H2+H3+H9 = arranged/traditional, H1 = dominant personality NOT self-choice
  // H9+H12 together = foreign ONLY when sign direction also confirms it
  MARRIAGE_TYPE: (slSig, nlSig, slPlanet, cuspSign) => {
    const both = [...new Set([...slSig, ...nlSig])];
    const hasH2  = both.includes(2);
    const hasH3  = both.includes(3);
    const hasH4  = both.includes(4);
    const hasH5  = both.includes(5);
    const hasH6  = both.includes(6);
    const hasH7  = both.includes(7);
    const hasH8  = both.includes(8);
    const hasH9  = both.includes(9);
    const hasH10 = both.includes(10);
    const hasH11 = both.includes(11);
    const hasH12 = both.includes(12);

    // ARRANGED indicators (TABLE 9 H7 context):
    // H2 = partner joins family / family arranges
    // H3 = family negotiations / matchmaking process
    // H9 = father's blessing / dharmic/traditional union
    // H4 = mother's role / domestic focus
    const arrangedScore = (hasH2?2:0) + (hasH3?2:0) + (hasH9?2:0) + (hasH4?1:0);

    // LOVE indicators:
    // H5 = love/romance element (the ONLY direct love indicator)
    // H7 = direct union energy present (strengthens any type)
    // NOTE: H1 = dominant personality in relationship, NOT self-choice
    const loveScore = (hasH5?3:0) + (hasH7?1:0);

    // FOREIGN indicator — requires H9+H12 TOGETHER, not individually
    // H9 alone = father's blessing/arranged, H12 alone = bed happiness/expenses
    const foreignScore = (hasH9 && hasH12) ? 2 : 0;

    // COURT / REGISTERED: H6+H10 both present (service/career over ceremony)
    const courtScore = (hasH6 && hasH10) ? 3 : 0;

    // INTERCASTE / INTER-COMMUNITY: Rahu as SL + H6 (social friction) present
    const intercasteFlag = (slPlanet === 'Rahu' || slPlanet === 'Ketu') && hasH6;

    // LATE MARRIAGE: Saturn as SL OR H1+H8 obstruct pattern
    const lateFlag = slPlanet === 'Saturn' || (both.includes(1) && (hasH8 || hasH12));

    // ── Determine primary type ──
    let primaryType;

    if (courtScore >= 3) {
      primaryType = 'Court / Registered';
    } else if (loveScore >= 3 && arrangedScore < 3) {
      primaryType = hasH6 ? 'Love — Against Family Wishes' : 'Love Marriage';
    } else if (loveScore >= 3 && arrangedScore >= 3) {
      primaryType = 'Love with Family Support';
    } else if (loveScore >= 2 && arrangedScore >= 2) {
      primaryType = 'Love with Family Support';
    } else if (arrangedScore >= 6 && !hasH5) {
      primaryType = 'Arranged — Traditional';
    } else if (arrangedScore >= 4 && !hasH5) {
      primaryType = 'Arranged';
    } else if (arrangedScore >= 2 && !hasH5) {
      primaryType = 'Arranged with Personal Choice';
    } else if (loveScore >= 1 && arrangedScore >= 1) {
      primaryType = 'Semi-arranged with Self-choice';
    } else {
      primaryType = 'Arranged with Personal Choice';
    }

    // ── Secondary qualifiers ──
    const qualifiers = [];
    if (foreignScore >= 2) qualifiers.push('Inter-regional / Foreign partner possible');
    if (intercasteFlag)    qualifiers.push('Intercaste / Inter-community possible');
    if (lateFlag)          qualifiers.push('Late timing — 30+ years');
    if (hasH9 && !hasH5)   qualifiers.push('Traditional ceremony');
    if (hasH8)             qualifiers.push('Unconventional circumstances');

    return qualifiers.length
      ? `${primaryType} — ${qualifiers.join('; ')}`
      : primaryType;
  },

  MARRIAGE_TIMING: (slSig, slPlanet) => {
    // H6/H8/H12 in SL sig = obstruct/delay in H7 context
    // H1 in H7 context = dominant personality, NOT delay indicator
    if (slPlanet === 'Saturn') return 'Late — 30+ years';
    if (slSig.includes(6) && slSig.includes(10)) return 'Delayed — career and service obligations dominant';
    if (slSig.includes(8) || slSig.includes(6)) return 'Delayed — obstacles and transformation phase first';
    if (slSig.includes(5) || slSig.includes(11)) return 'Timely — natural timing';
    if (slSig.includes(7)) return 'On time — direct union energy present';
    return 'Moderate — around social norm age';
  },

  CAREER_PATH: (slSig, nlSig) => {
    const both = [...new Set([...slSig, ...nlSig])];
    const job = both.filter(h => [6,10].includes(h)).length;
    const biz = both.filter(h => [7,11].includes(h)).length;
    if (job > biz) return 'Service / Employment path currently';
    if (biz > job) return 'Business / Self-employment path';
    return 'Hybrid — employment now, business later';
  },

  GOVT_VS_PRIVATE: (slSig, slPlanet, nlPlanet) => {
    const govtPlanets = ['Sun','Saturn','Moon'];
    const privPlanets = ['Mercury','Venus','Jupiter','Rahu'];
    const govtScore = slSig.filter(h => [6,10].includes(h)).length
                    + (govtPlanets.includes(slPlanet) ? 1 : 0)
                    + (govtPlanets.includes(nlPlanet) ? 1 : 0);
    const privScore = slSig.filter(h => [7,11].includes(h)).length
                    + (privPlanets.includes(slPlanet) ? 2 : 0)
                    + (privPlanets.includes(nlPlanet) ? 1 : 0);
    if (govtScore > privScore) return 'Government / Public sector';
    if (privScore > govtScore) return 'Private / Corporate sector';
    return 'Both sectors viable — private preferred';
  },

  CAREER_SECTOR: (nlPlanet, slPlanet, cuspSign) => {
    const planet = nlPlanet || slPlanet;
    const sign = SIGN_DATA[cuspSign];
    const planetSectors = {
      Sun:     'Government, Management, Medicine, Leadership',
      Moon:    'Public Service, Hospitality, Import-Export, F&B',
      Mars:    'Engineering, Real Estate, Military, Sports, Surgery',
      Mercury: 'IT, Communication, Finance, Writing, Analytics',
      Jupiter: 'Education, Law, Finance, Advisory, Religion',
      Venus:   'Arts, Fashion, Luxury, Beauty, Hospitality, Finance',
      Saturn:  'Government Service, Research, Construction, Mining',
      Rahu:    'Technology, Foreign Companies, Media, Innovation',
      Ketu:    'Spiritual Work, Astrology, Research, Forensics'
    };
    const signSectors = {
      Cancer: 'Hospitality, Real Estate, Import-Export, Public',
      Capricorn: 'Government, Banking, Management, Construction',
      Virgo: 'Healthcare, Analytics, IT, Research',
      Taurus: 'Finance, Luxury, Food, Art, Banking',
      Scorpio: 'Research, Surgery, Intelligence, Occult',
      Pisces: 'Spiritual, Healthcare, Arts, Import-Export'
    };
    const pSector = planetSectors[planet] || 'Multi-sector career';
    const sSector = sign ? (signSectors[cuspSign] || '') : '';
    return sSector ? `${pSector} / ${sSector}` : pSector;
  },

  // PROPERTY TYPE: derived from sign + planets
  PROPERTY_TYPE: (cuspSign, planetsInH4, slSig, nlSig) => {
    const sign = SIGN_DATA[cuspSign];
    const both = [...new Set([...slSig, ...nlSig])];
    const types = [];

    // Primary from sign element
    if (sign) {
      if (sign.element === 'Earth') types.push('Plot / Land / Solid structure');
      else if (sign.element === 'Fire') types.push('Independent House / Villa / Bungalow');
      else if (sign.element === 'Air') types.push('Apartment / Flat');
      else if (sign.element === 'Water') types.push('Residential near water / Riverside');
    }

    // Secondary from significations
    if (both.includes(10)) types.push('Commercial / Office property possible');
    if (both.includes(12)) types.push('Foreign / Away-from-birthplace property');
    if (both.includes(9)) types.push('Auspicious location / Away from hometown');

    // Planets in H4
    if (planetsInH4.includes('Saturn')) types.push('Old/ancestral structure or land preferred');
    if (planetsInH4.includes('Mars')) types.push('New construction / Modern building');
    if (planetsInH4.includes('Venus')) types.push('Beautiful, well-appointed residence');

    return types.length ? types : ['Residential property'];
  },

  PROPERTY_NUMBER: (slPlanet, nlPlanet, cuspSign, slSig) => {
    const sign = SIGN_DATA[cuspSign];
    let count = 'One property (primary)';
    const movable = sign && sign.quality === 'Movable';
    const dual = sign && sign.quality === 'Dual';
    const jupiterInvolved = [slPlanet, nlPlanet].includes('Jupiter') || slSig.includes(3);
    const saturnInvolved = [slPlanet, nlPlanet].includes('Saturn');

    if (jupiterInvolved && !saturnInvolved) count = '2-3 properties over lifetime';
    else if (movable) count = '1-2 properties — changes residence';
    else if (dual) count = 'Possibly two properties';
    else if (saturnInvolved) count = 'One primary, permanent holding';

    return count;
  },

  // VEHICLE TYPE
  VEHICLE_TYPE: (slPlanet, nlPlanet, planetsInH4, slSig) => {
    const all = [slPlanet, nlPlanet, ...planetsInH4].filter(Boolean);
    const attrs = {
      brand: 'Foreign brand indicated',
      type: 'SUV or Premium Sedan',
      colour: 'Dark (Black/Grey/Dark Blue) or Silver/White',
      number: '2 vehicles over lifetime',
      tech: 'Modern / Foreign technology'
    };

    if (all.includes('Saturn')) { attrs.type = 'Robust SUV / Durable vehicle'; attrs.colour = 'Dark — Black or Grey preferred'; }
    if (all.includes('Venus'))  { attrs.type = 'Premium Sedan / Luxury SUV'; attrs.colour = 'White, Silver or Cream'; }
    if (all.includes('Sun'))    { attrs.brand = 'Prestigious foreign brand'; }
    if (all.includes('Rahu'))   { attrs.tech = 'Latest technology / Electric or Hybrid'; attrs.brand = 'Foreign brand strongly indicated'; }
    if (all.includes('Moon'))   { attrs.colour = 'Silver, White or Cream preferred'; }
    if (all.includes('Mars'))   { attrs.type = 'SUV / Powerful vehicle'; }

    if (slSig.includes(12)) attrs.brand = 'Foreign brand — imported vehicle';

    return attrs;
  },

  // CHILD GENDER — for multiple children
  CHILD_GENDER: (cuspNum, chartData) => {
    // C5=first, C9=second, C1=third
    const cuspMap = {1: 5, 2: 9, 3: 1};
    const cuspNo = cuspMap[cuspNum] || 5;
    const cuspData = chartData.cusps && chartData.cusps[cuspNo];
    if (!cuspData) return 'Unknown';

    const mascPlanets = ['Sun','Mars','Jupiter','Mercury','Saturn','Rahu'];
    let mScore = 0, fScore = 0;

    const sl = cuspData.sl;
    const sign = cuspData.sign;
    const signData = sign ? SIGN_DATA[sign] : null;

    if (sl) { mascPlanets.includes(sl) ? mScore++ : fScore++; }
    // NL of SL
    const nlOfSl = cuspData.nl; // use available NL as approximation
    if (nlOfSl) { mascPlanets.includes(nlOfSl) ? mScore++ : fScore++; }
    // Sign lord
    if (signData) { mascPlanets.includes(signData.ruler) ? mScore++ : fScore++; }
    // Sign gender
    if (signData) { signData.gender === 'M' ? mScore++ : fScore++; }

    if (mScore > fScore) return `Male tendency (${mScore}M vs ${fScore}F)`;
    if (fScore > mScore) return `Female tendency (${fScore}F vs ${mScore}M)`;
    return 'Mixed / Uncertain (equal indicators)';
  },

  INCOME_TYPE: (slSig, nlSig) => {
    const both = [...new Set([...slSig, ...nlSig])];
    if (both.includes(6) && both.includes(10)) return 'Salary / Service income (primary)';
    if (both.includes(10)) return 'Career / Professional income';
    if (both.includes(7) && both.includes(11)) return 'Business / Partnership income';
    if (both.includes(5) && both.includes(11)) return 'Speculative / Investment income';
    if (both.includes(9) && both.includes(12)) return 'Foreign / International income';
    if (both.includes(8) && both.includes(11)) return 'Windfall / Inheritance income';
    return 'Multiple income streams';
  },

  VISA_TYPE: (slSig, nlSig) => {
    const both = [...new Set([...slSig, ...nlSig])];
    if (both.includes(9) && both.includes(4))   return 'Student / Study permit';
    if (both.includes(6) && both.includes(10))  return 'Work visa / Employment permit';
    if (both.includes(12) && both.includes(11)) return 'PR / Permanent Residence';
    if (both.includes(3))                        return 'Tourist / Business visitor visa';
    if (both.includes(6) && both.includes(8))   return 'Medical visa';
    if (both.includes(7))                        return 'Spouse / Dependent visa';
    return 'Business visa (multiple entry)';
  },

  SPIRITUAL_PATH: (slPlanet, nlPlanet) => {
    const planet = nlPlanet || slPlanet;
    const map = {
      Jupiter:'Traditional / Religious / Vedic path',
      Ketu:   'Mystical / Moksha / Deep meditation',
      Saturn: 'Karma Yoga / Disciplined / Ascetic',
      Rahu:   'Unconventional / Tantric / Foreign spiritual',
      Moon:   'Bhakti / Devotional / Emotional path',
      Sun:    'Solar / Self-realisation / Raja Yoga',
      Mars:   'Karma Yoga / Active / Warrior path',
      Mercury:'Jnana Yoga / Intellectual / Study path',
      Venus:  'Bhakti / Artistic / Devotional path'
    };
    return map[planet] || 'Mixed spiritual inclination';
  },

  STUDY_FIELD: (nlPlanet, slPlanet) => {
    const planet = nlPlanet || slPlanet;
    const map = {
      Sun:    'Management / Administration / Medicine',
      Moon:   'Public Administration / Hospitality / Nursing',
      Mars:   'Engineering / Defense / Surgery / Sports Science',
      Mercury:'Commerce / IT / Communication / Analytics',
      Jupiter:'Philosophy / Law / Education / Medicine',
      Venus:  'Arts / Design / Music / Fashion / Finance',
      Saturn: 'Research / History / Architecture / Mining',
      Rahu:   'Technology / AI / Foreign Studies / Innovation',
      Ketu:   'Occult / Spiritual / Forensics / Research'
    };
    return map[planet] || 'Multi-disciplinary';
  },

  INHERITANCE_TYPE: (slSig, nlSig) => {
    const both = [...new Set([...slSig, ...nlSig])];
    if (both.includes(4)) return 'Property / Land inheritance (primary)';
    if (both.includes(2) && both.includes(11)) return 'Financial / Monetary inheritance';
    if (both.includes(3)) return 'Vehicle / Equipment inheritance';
    return 'Mixed inheritance — property and financial';
  }
};

// ═══════════════════════════════════════════════════
// TABLE 7 — RP WEIGHTS
// ═══════════════════════════════════════════════════

const RP_WEIGHTS = {
  'rp-asc-nl':  3,
  'rp-moon-nl': 3,
  'rp-asc-rl':  2,
  'rp-moon-rl': 2,
  'rp-asc-sl':  2,
  'rp-moon-sl': 2,
  'rp-day':     1
};

// ═══════════════════════════════════════════════════
// TABLE 8 — PLANET + SIGN COMBINATIONS
// ═══════════════════════════════════════════════════

const COMBO_MAP = {
  'Venus_Fire':'Passionate, bold, independent and artistically expressive',
  'Venus_Earth':'Stable, sensual, comfort-loving and reliably devoted',
  'Venus_Air':'Socially charming, intellectually stimulating and communicative',
  'Venus_Water':'Deeply romantic, emotionally sensitive and nurturing',
  'Jupiter_Fire':'Wise, philosophical, adventurous and spiritually inclined',
  'Jupiter_Earth':'Practical, grounded, financially sound and family-oriented',
  'Jupiter_Air':'Intellectual, educated, socially conscious and advisory',
  'Jupiter_Water':'Compassionate, spiritually deep and emotionally generous',
  'Saturn_Fire':'Serious, disciplined, older-natured and authority-driven',
  'Saturn_Earth':'Dutiful, patient, practical and reliably committed',
  'Saturn_Air':'Detached, intellectually disciplined and independent',
  'Saturn_Water':'Emotionally reserved, karmic bond and deeply responsible',
  'Mars_Fire':'Passionate, energetic, independent and boldly assertive',
  'Mars_Earth':'Hardworking, property-focused and practically determined',
  'Mars_Air':'Quick-witted, argumentative and technically intelligent',
  'Mars_Water':'Intensely emotional, passionate and surgically decisive',
  'Mercury_Fire':'Quick-thinking, entrepreneurial and intellectually dynamic',
  'Mercury_Earth':'Analytical, business-minded and practically intelligent',
  'Mercury_Air':'Highly communicative, socially agile and mentally versatile',
  'Mercury_Water':'Intuitively intelligent, emotionally adaptable and counselling-oriented',
  'Moon_Fire':'Emotionally bold, publicly popular and dramatically nurturing',
  'Moon_Earth':'Domestically nurturing, caring and comfortably home-focused',
  'Moon_Air':'Socially sensitive, publicly communicative and emotionally expressive',
  'Moon_Water':'Deeply intuitive, psychically sensitive and profoundly caring',
  'Sun_Fire':'Proud, authoritative, government-connected and dominantly confident',
  'Sun_Earth':'Practically authoritative, status-conscious and professionally grounded',
  'Sun_Air':'Socially prominent, intellectually proud and communicatively assertive',
  'Sun_Water':'Emotionally proud, publicly influential and intuitively authoritative',
  'Rahu_Fire':'Bold, unconventional, foreign-influenced and obsessively ambitious',
  'Rahu_Earth':'Materially unconventional, foreign-connected and practically unusual',
  'Rahu_Air':'Technologically advanced, foreign-minded and intellectually revolutionary',
  'Rahu_Water':'Emotionally obsessive, foreign emotional connection and psychically unusual',
  'Ketu_Fire':'Spiritually bold, past-life warrior energy and periodically detached',
  'Ketu_Earth':'Spiritually practical, detached from material and moksha-oriented',
  'Ketu_Air':'Intellectually spiritual, past-life scholar and mystically communicative',
  'Ketu_Water':'Deeply psychic, spiritually sensitive and profoundly karmic'
};

// ═══════════════════════════════════════════════════
// TABLE 9 — CONTEXTUAL HOUSE MEANINGS
// Usage: TABLE9[evalHouse][slHouse]
// Returns: { meaning, supportType, weight }
// supportType: 'support' | 'obstruct' | 'neutral'
// weight: 'strong' | 'weak'
// ═══════════════════════════════════════════════════

const TABLE9 = {
  1: { // Evaluating H1 — SELF
    1:  {m:'Body/health directly active. Vitality strong.',                          s:'support',  w:'strong'},
    2:  {m:'Face/speech health. Family supporting self.',                             s:'support',  w:'weak'},
    3:  {m:'Courage active. Self-effort working.',                                    s:'support',  w:'weak'},
    4:  {m:'Emotional security supporting self. Mother influence.',                   s:'support',  w:'weak'},
    5:  {m:'Past merit protecting health. Confidence active.',                        s:'support',  w:'strong'},
    6:  {m:'Disease/enemies affecting body. Service stress on health.',               s:'obstruct', w:'strong'},
    7:  {m:'Partnerships shaping personality. Public role affecting identity.',       s:'neutral',  w:'weak'},
    8:  {m:'Deep psychological transformation. Health crisis possible.',              s:'obstruct', w:'strong'},
    9:  {m:'Divine grace on health. Fortune supporting vitality.',                    s:'support',  w:'strong'},
    10: {m:'Career defining identity. Professional stress on body.',                  s:'neutral',  w:'weak'},
    11: {m:'Recovery active. Gains of health. Self\'s desires fulfilled.',            s:'support',  w:'strong'},
    12: {m:'Hospitalisation possible. Loss of vitality. Withdrawal from self.',       s:'obstruct', w:'strong'}
  },
  2: { // Evaluating H2 — WEALTH
    1:  {m:'Personal spending. Self-driven financial decisions.',                     s:'obstruct', w:'weak'},
    2:  {m:'Wealth directly active. Savings accumulating.',                           s:'support',  w:'strong'},
    3:  {m:'Income through communication/skills. Siblings financial role.',           s:'support',  w:'weak'},
    4:  {m:'Fixed asset savings. Property as wealth. Domestic financial security.',  s:'support',  w:'strong'},
    5:  {m:'Speculation and risky investments. Gambling losses.',                     s:'obstruct', w:'strong'},
    6:  {m:'Service income. Salary from employment. Earned income.',                  s:'support',  w:'strong'},
    7:  {m:'Partnership income. Spouse financial role. Business partner wealth.',     s:'support',  w:'weak'},
    8:  {m:'Sudden financial gain OR loss. Inheritance possible. Hidden money.',      s:'obstruct', w:'strong'},
    9:  {m:'Fortune-based income. Father\'s financial support. Luck bringing wealth.',s:'support',  w:'weak'},
    10: {m:'Career income. Professional earnings. Salary from work.',                 s:'support',  w:'strong'},
    11: {m:'Gains confirmed. Inflow of money. Financial desires fulfilled.',          s:'support',  w:'strong'},
    12: {m:'Expenses and losses. Money going out. Financial drain.',                  s:'obstruct', w:'strong'}
  },
  3: { // Evaluating H3 — SIBLINGS/COMMUNICATION
    1:  {m:'Self-driven communication. Personal courage active.',                     s:'support',  w:'strong'},
    2:  {m:'Wealth through communication. Siblings financial help.',                  s:'support',  w:'weak'},
    3:  {m:'Siblings directly. Communication fully active. Short travel happening.',  s:'support',  w:'strong'},
    4:  {m:'Siblings connected to home. Mother\'s role in communication.',            s:'neutral',  w:'weak'},
    5:  {m:'Creative communication. Children\'s communication. Playful expression.',  s:'support',  w:'weak'},
    6:  {m:'Conflict with siblings. Disputes through communication.',                 s:'obstruct', w:'strong'},
    7:  {m:'Communication in partnership. Public communication active.',              s:'neutral',  w:'weak'},
    8:  {m:'Sudden sibling event. Transformation in communication. Accident in travel.',s:'obstruct',w:'strong'},
    9:  {m:'Long distance travel. Foreign communication. Fortune through siblings.',  s:'support',  w:'strong'},
    10: {m:'Professional communication. Career through skills. Authoritative expression.',s:'support',w:'strong'},
    11: {m:'Gains through communication. Elder sibling support. Social network active.',s:'support', w:'strong'},
    12: {m:'Separation from siblings. Communication losses. Travel leads to foreign.', s:'obstruct', w:'strong'}
  },
  4: { // Evaluating H4 — PROPERTY/HOME
    1:  {m:'Self building/acquiring property. Personal home desire.',                 s:'support',  w:'weak'},
    2:  {m:'Financial capacity for property. Family property. Wealth in real estate.',s:'support',  w:'strong'},
    3:  {m:'Property nearby/local. Siblings connected to property.',                  s:'neutral',  w:'weak'},
    4:  {m:'Property directly active. Home matters central. Mother relationship.',    s:'support',  w:'strong'},
    5:  {m:'Property for children. Speculative property investment.',                 s:'neutral',  w:'weak'},
    6:  {m:'Property disputes/legal issues. Mortgage burden. Forced decisions.',      s:'obstruct', w:'strong'},
    7:  {m:'Spouse\'s role in property. Joint property. Partner and home.',           s:'neutral',  w:'weak'},
    8:  {m:'Sudden property event. Inherited property. Unexpected acquisition.',      s:'neutral',  w:'weak'},
    9:  {m:'Property away from birthplace. Father\'s property role. Auspicious home.',s:'support',  w:'strong'},
    10: {m:'Career demands competing with home. Commercial property.',                s:'obstruct', w:'strong'},
    11: {m:'Property desire fulfilled. Gains through property. Investment value.',    s:'support',  w:'strong'},
    12: {m:'Foreign property. Away from home. Heavy property expenses.',              s:'neutral',  w:'weak'}
  },
  5: { // Evaluating H5 — CHILDREN/ROMANCE/CREATIVITY
    1:  {m:'Self focused over children. Independence over romance.',                  s:'obstruct', w:'strong'},
    2:  {m:'Children add to family. Financial capacity for children.',                s:'support',  w:'strong'},
    3:  {m:'Communication with children. Creative expression through writing.',       s:'support',  w:'weak'},
    4:  {m:'Domestic stability needed first. Home environment for child.',            s:'obstruct', w:'strong'},
    5:  {m:'Children directly promised. Creativity active. Romance confirmed.',       s:'support',  w:'strong'},
    6:  {m:'Health complications in conception/delivery. Service delays children.',   s:'obstruct', w:'strong'},
    7:  {m:'Spouse connected to children. Partnership before children.',              s:'support',  w:'weak'},
    8:  {m:'Transformation before children. Medical involvement in conception.',      s:'neutral',  w:'weak'},
    9:  {m:'Second child indicator. Fortune through children. Child higher education.',s:'support', w:'strong'},
    10: {m:'Career demands delaying children. Career before family.',                 s:'obstruct', w:'strong'},
    11: {m:'Desire for children fulfilled. Children bring gains.',                    s:'support',  w:'strong'},
    12: {m:'Hospitalisation for delivery. Children away/foreign. Sacrifice.',         s:'obstruct', w:'weak'}
  },
  6: { // Evaluating H6 — SERVICE/DISEASE/EMPLOYMENT
    1:  {m:'Independence resisting service. Self-employed tendency.',                 s:'obstruct', w:'strong'},
    2:  {m:'Income from service. Financial reward from work.',                        s:'support',  w:'strong'},
    3:  {m:'Communication-based service. Travel in work. Skills applied.',            s:'support',  w:'strong'},
    4:  {m:'Domestic demands on service. Service from home.',                         s:'neutral',  w:'weak'},
    5:  {m:'Pleasure distracting from work. Speculation over duty.',                  s:'obstruct', w:'strong'},
    6:  {m:'Service directly active. Disease present. Employment confirmed.',         s:'support',  w:'strong'},
    7:  {m:'Partner in service. Public dealings in work. Open rivals.',               s:'neutral',  w:'weak'},
    8:  {m:'Sudden service change. Chronic disease. Work transformation.',            s:'neutral',  w:'weak'},
    9:  {m:'Fortune through service. Travel in work. Lucky in competition.',          s:'support',  w:'strong'},
    10: {m:'Career backing service. Professional employment confirmed.',              s:'support',  w:'strong'},
    11: {m:'Gains from service. Salary/recognition active. Victory over enemies.',   s:'support',  w:'strong'},
    12: {m:'Foreign employer. Job loss/change. Hospitalisation. Losses through service.',s:'obstruct',w:'strong'}
  },
  7: { // Evaluating H7 — MARRIAGE/PARTNERSHIP
    1:  {m:'Dominant personality in relationship. Independence resisting full commitment.',s:'obstruct',w:'strong'},
    2:  {m:'Partner joins family. Family arranges/approves. ARRANGED element.',       s:'support',  w:'strong'},
    3:  {m:'Family marriage negotiations. Matchmaking. ARRANGED PROCESS indicator.',  s:'support',  w:'strong'},
    4:  {m:'Home/domestic focus. Mother\'s role in marriage.',                        s:'neutral',  w:'weak'},
    5:  {m:'Love/romance element. Attraction initiated. LOVE INDICATOR.',             s:'support',  w:'strong'},
    6:  {m:'Disputes in marriage. Spouse health issues. Service obligations blocking.',s:'obstruct', w:'strong'},
    7:  {m:'Union directly promised. Partner present. Marriage happening.',           s:'support',  w:'strong'},
    8:  {m:'Transformation through marriage. Hidden aspects. Sudden marriage event.', s:'neutral',  w:'weak'},
    9:  {m:'Father\'s blessing. Dharmic/religious union. Fortune through marriage. TRADITIONAL.',s:'support',w:'strong'},
    10: {m:'Career over marriage. Professional image in union.',                      s:'obstruct', w:'strong'},
    11: {m:'Desire for partner fulfilled. Gains through marriage.',                   s:'support',  w:'strong'},
    12: {m:'Bed happiness. Marriage expenses. Some sacrifice. NOT automatically foreign.',s:'neutral',w:'weak'}
  },
  8: { // Evaluating H8 — TRANSFORMATION/CRISIS
    1:  {m:'Self resisting transformation. Identity fighting change.',                s:'obstruct', w:'strong'},
    2:  {m:'Financial transformation. Inheritance possible. Family change.',          s:'support',  w:'strong'},
    3:  {m:'Communication triggers transformation. Travel-related sudden event.',     s:'neutral',  w:'weak'},
    4:  {m:'Domestic transformation. Mother-related crisis. Emotional resistance.',   s:'obstruct', w:'strong'},
    5:  {m:'Creative transformation. Children-related change. Past karma resolving.',s:'neutral',  w:'weak'},
    6:  {m:'Disease triggering transformation. Conflict-driven change.',              s:'neutral',  w:'weak'},
    7:  {m:'Marriage transformation. Partner-triggered change. Relationship crisis.', s:'neutral',  w:'weak'},
    8:  {m:'Deep transformation directly active. Longevity event. Inheritance.',      s:'support',  w:'strong'},
    9:  {m:'Fortune after transformation. Wisdom through crisis. Philosophical shift.',s:'support', w:'weak'},
    10: {m:'Career transformation. Status change. Status quo resisting change.',      s:'obstruct', w:'strong'},
    11: {m:'Gains through transformation. Recovery after crisis.',                    s:'support',  w:'strong'},
    12: {m:'Foreign-triggered transformation. Seclusion for healing. Liberation.',   s:'support',  w:'weak'}
  },
  9: { // Evaluating H9 — FORTUNE/FATHER/TRAVEL
    1:  {m:'Personal luck active. Self-made fortune. Individual dharma.',             s:'support',  w:'strong'},
    2:  {m:'Financial fortune. Wealth through luck. Family fortune.',                 s:'support',  w:'strong'},
    3:  {m:'Fortune through communication. Luck in short journeys.',                  s:'support',  w:'weak'},
    4:  {m:'Home attachment limiting fortune expansion. Domestic comfort.',           s:'obstruct', w:'strong'},
    5:  {m:'Past merit bringing fortune. Intelligence supporting luck.',              s:'support',  w:'strong'},
    6:  {m:'Fortune requires hard work first. Obstacles before fortune.',             s:'obstruct', w:'strong'},
    7:  {m:'Fortune through partnership. Spouse brings luck.',                        s:'support',  w:'weak'},
    8:  {m:'Fortune through transformation. Hidden sources of luck.',                 s:'support',  w:'weak'},
    9:  {m:'Fortune directly active. Divine grace present. Dharma supporting.',       s:'support',  w:'strong'},
    10: {m:'Career brings fortune. Professional status generates luck.',              s:'support',  w:'strong'},
    11: {m:'Fortune converting to gains. Desires fulfilled through luck.',            s:'support',  w:'strong'},
    12: {m:'Fortune drained by expenses. Seclusion before luck. Losses first.',      s:'obstruct', w:'strong'}
  },
  10: { // Evaluating H10 — CAREER/STATUS
    1:  {m:'Career tied to personal identity. Self-employment tendency.',             s:'support',  w:'strong'},
    2:  {m:'Income from career. Financial career rewards.',                           s:'support',  w:'strong'},
    3:  {m:'Communication career. Travel in work. Skill-based profession.',           s:'support',  w:'strong'},
    4:  {m:'Domestic demands competing with career. Home vs career conflict.',        s:'obstruct', w:'strong'},
    5:  {m:'Speculation over work discipline. Creative career.',                      s:'obstruct', w:'strong'},
    6:  {m:'Service career confirmed. Employment-based profession.',                  s:'support',  w:'strong'},
    7:  {m:'Partnership career. Business with partner. Public-facing profession.',    s:'support',  w:'weak'},
    8:  {m:'Career transformation. Sudden career change. Research profession.',       s:'neutral',  w:'weak'},
    9:  {m:'Fortune through career. Long-distance work. Luck in profession.',         s:'support',  w:'strong'},
    10: {m:'Career directly active. Status rising. Promotion happening.',             s:'support',  w:'strong'},
    11: {m:'Career bringing gains. Recognition in profession. Salary growing.',       s:'support',  w:'strong'},
    12: {m:'Foreign career dimension. Career expenses. Behind-scenes work.',          s:'obstruct', w:'strong'}
  },
  11: { // Evaluating H11 — GAINS/DESIRES/NETWORK
    1:  {m:'Personal gains. Self-generated income. Individual desires.',              s:'support',  w:'strong'},
    2:  {m:'Financial gains. Savings growing. Family financial gains.',               s:'support',  w:'strong'},
    3:  {m:'Gains through communication. Income from skills. Network active.',        s:'support',  w:'strong'},
    4:  {m:'Property gains. Domestic financial benefit. Fixed asset gains.',          s:'support',  w:'strong'},
    5:  {m:'Speculative gains — risky. Creative income.',                             s:'obstruct', w:'strong'},
    6:  {m:'Service income. Salary from employment. Gains through effort.',           s:'support',  w:'strong'},
    7:  {m:'Partnership gains. Spouse income. Business partner wealth.',              s:'support',  w:'weak'},
    8:  {m:'Sudden windfall possible. Inheritance gains. Also sudden loss risk.',     s:'obstruct', w:'strong'},
    9:  {m:'Fortune-based gains. Luck bringing income. Father\'s support.',           s:'support',  w:'strong'},
    10: {m:'Career income. Professional gains. Salary/fees from work.',               s:'support',  w:'strong'},
    11: {m:'Gains directly active. Desires fulfilled. Income confirmed.',             s:'support',  w:'strong'},
    12: {m:'Expenses eating gains. Losses reducing income.',                          s:'obstruct', w:'strong'}
  },
  12: { // Evaluating H12 — FOREIGN/EXPENSES/SECLUSION
    1:  {m:'Self going foreign. Personal seclusion. Native\'s identity in foreign.',  s:'support',  w:'strong'},
    2:  {m:'Family attachment holding from foreign. Financial ties to homeland.',     s:'obstruct', w:'strong'},
    3:  {m:'Short travel initiating foreign. Communication about foreign.',           s:'support',  w:'strong'},
    4:  {m:'Home attachment blocking foreign. Domestic comfort over adventure.',      s:'obstruct', w:'strong'},
    5:  {m:'Creative reason for foreign. Children abroad. Past merit supports.',      s:'neutral',  w:'weak'},
    6:  {m:'Work visa/employment abroad. Service in foreign country.',                s:'support',  w:'strong'},
    7:  {m:'Spouse connected to foreign. Partner abroad. Marriage abroad.',           s:'support',  w:'weak'},
    8:  {m:'Transformation through foreign. Sudden foreign event.',                   s:'neutral',  w:'weak'},
    9:  {m:'Higher education abroad. Long purposeful journey. Fortune through foreign.',s:'support', w:'strong'},
    10: {m:'Career obligations blocking foreign. Career vs foreign conflict.',        s:'obstruct', w:'strong'},
    11: {m:'Gains through foreign. Desires fulfilled abroad. Foreign income.',        s:'support',  w:'strong'},
    12: {m:'Foreign directly active. Seclusion happening. Expenses present.',        s:'support',  w:'strong'}
  }
};

/**
 * Get contextual meaning from TABLE 9
 */
function getContextualMeaning(evalHouse, slHouse) {
  const row = TABLE9[evalHouse];
  if (!row) return { m: '', s: 'neutral', w: 'weak' };
  return row[slHouse] || { m: '', s: 'neutral', w: 'weak' };
}

// ═══════════════════════════════════════════════════
// PROMISE SCORING ENGINE (CORRECTED)
// ═══════════════════════════════════════════════════

/**
 * Score promise for a sub-event using corrected 5-level system
 * Main house = +3, cluster house = +1, obstruct = -1
 */
function checkPromise(subEventKey, slSig) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { level:5, label:'Not Promised', score:0, mainPresent:false, clusterHits:[], obstructHits:[] };

  const mainPresent   = slSig.includes(rule.primaryGate);
  const clusterHits   = rule.cluster.filter(h => slSig.includes(h));
  const obstructHits  = rule.obstruct.filter(h => slSig.includes(h));

  const baseScore = (mainPresent ? 3 : 0)
                  + clusterHits.length
                  - obstructHits.length;

  // Determine promise level
  let level, label;
  if (mainPresent && obstructHits.length === 0) {
    level = 1; label = 'Direct Strong Promise';
  } else if (mainPresent && obstructHits.length > 0) {
    level = 2; label = 'Direct — Complicated';
  } else if (clusterHits.length >= 2 && obstructHits.length === 0) {
    level = 2; label = 'Indirect Strong Promise';
  } else if (clusterHits.length >= 1 && obstructHits.length === 0) {
    level = 3; label = 'Indirect Moderate Promise';
  } else if ((clusterHits.length >= 1 || mainPresent) && obstructHits.length > 0) {
    level = 4; label = 'Promised — Complicated';
  } else {
    level = 5; label = 'Not Promised';
  }

  return { level, label, score:baseScore, mainPresent, clusterHits, obstructHits };
}

// ═══════════════════════════════════════════════════
// DBA SCORING ENGINE (CORRECTED — uses TABLE 9)
// ═══════════════════════════════════════════════════

/**
 * Score a single DBA lord for a sub-event
 * Uses TABLE 9 contextual meanings for evalHouse
 */
function scoreSingleDBA(evalHouse, subEventKey, dbaSig) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return 0;

  let score = 0;

  // Check main house
  if (dbaSig.includes(rule.primaryGate)) {
    score += 3;
  }

  // Check cluster houses
  rule.cluster.forEach(h => {
    if (dbaSig.includes(h)) score += 1;
  });

  // Check obstruct houses using TABLE 9 contextual meanings
  rule.obstruct.forEach(h => {
    if (dbaSig.includes(h)) score -= 1;
  });

  // Additional contextual check: for each house in dbaSig,
  // check TABLE 9 for contextual support/obstruct in evalHouse
  dbaSig.forEach(h => {
    const ctx = getContextualMeaning(evalHouse, h);
    if (ctx.s === 'obstruct' && ctx.w === 'strong' &&
        !rule.obstruct.includes(h) && !rule.cluster.includes(h) && h !== rule.primaryGate) {
      score -= 0.5; // contextual obstruct penalty
    }
  });

  return Math.round(score);
}

/**
 * Full DBA scoring for a sub-event
 */
function scoreDBA(subEventKey, evalHouse, mdSig, adSig, pdSig) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { score:0, adGate:'closed', verdict:'not_this_period',
                      mdScore:0, adScore:0, pdScore:0 };

  const mdRaw = scoreSingleDBA(evalHouse, subEventKey, mdSig);
  const adRaw = scoreSingleDBA(evalHouse, subEventKey, adSig);
  const pdRaw = scoreSingleDBA(evalHouse, subEventKey, pdSig);

  const mdScore = mdRaw * DBA_WEIGHTS.MD;
  const adScore = adRaw * DBA_WEIGHTS.AD;
  const pdScore = pdRaw * DBA_WEIGHTS.PD;
  const score = mdScore + adScore + pdScore;

  // AD Gate determination
  let adGate = 'closed';
  if (adSig.includes(rule.primaryGate)) adGate = 'wide_open';
  else if (rule.cluster.some(h => adSig.includes(h))) adGate = 'partial';

  // Verdict
  let verdict = 'not_this_period';
  if (adGate !== 'closed') {
    if (score >= 8)      verdict = 'strongly_active';
    else if (score >= 5) verdict = 'active';
    else if (score >= 3) verdict = 'moderately_active';
    else if (score >= 1) verdict = 'weakly_active';
    else                 verdict = 'possible';
  } else {
    if (score >= 5)      verdict = 'possible';
    else if (score >= 1) verdict = 'background_active';
    else                 verdict = 'not_this_period';
  }

  return { score, adGate, verdict, mdScore, adScore, pdScore };
}

// ═══════════════════════════════════════════════════
// RP SCORING ENGINE
// ═══════════════════════════════════════════════════

function scoreRP(subEventKey, rpData, planetSig, dbaLords) {
  const rule = SUB_EVENT_RULES[subEventKey];
  if (!rule) return { rpScore:0, confidence:'not_confirmed', matchedRPs:[] };

  const allRelevant = [rule.primaryGate, ...rule.cluster];
  let rpScore = 0;
  const matchedRPs = [];

  Object.entries(rpData).forEach(([rpKey, planet]) => {
    if (!planet || planet === '' || planet === '—') return;
    const weight = RP_WEIGHTS[rpKey] || 1;
    const sig = planetSig[planet] || [];

    // Main house hit
    if (sig.includes(rule.primaryGate)) {
      rpScore += weight * 3;
      matchedRPs.push(planet);
    }
    // Cluster hits
    const clusterHits = rule.cluster.filter(h => sig.includes(h));
    if (clusterHits.length > 0) {
      rpScore += clusterHits.length * weight;
      matchedRPs.push(planet);
    }
    // Obstruct hits
    const obstructHits = rule.obstruct.filter(h => sig.includes(h));
    rpScore -= obstructHits.length * weight;

    // DBA lord match bonus
    if (dbaLords.includes(planet)) {
      rpScore += weight * 2;
    }
  });

  let confidence = 'not_confirmed';
  if (rpScore >= 15)      confidence = 'certain';
  else if (rpScore >= 10) confidence = 'very_high';
  else if (rpScore >= 6)  confidence = 'high';
  else if (rpScore >= 3)  confidence = 'moderate';
  else if (rpScore >= 1)  confidence = 'low';

  return { rpScore, confidence, matchedRPs:[...new Set(matchedRPs)] };
}

// ═══════════════════════════════════════════════════
// ATTRIBUTE DERIVATION
// ═══════════════════════════════════════════════════

function deriveAttributes(subEventKey, slSig, nlSig, slPlanet, nlPlanet,
                           cuspSign, chartData, houseNum) {
  const attrs = {};
  const planetsInHouse = getOccupyingPlanets(houseNum, chartData);

  if (subEventKey === 'H7.TYPE') {
    attrs.marriageType   = ATTRIBUTE_RULES.MARRIAGE_TYPE(slSig, nlSig, slPlanet, cuspSign);
    attrs.marriageTiming = ATTRIBUTE_RULES.MARRIAGE_TIMING(slSig, slPlanet);
  }
  if (subEventKey === 'H7.UNION') {
    attrs.marriageType   = ATTRIBUTE_RULES.MARRIAGE_TYPE(slSig, nlSig, slPlanet, cuspSign);
    attrs.marriageTiming = ATTRIBUTE_RULES.MARRIAGE_TIMING(slSig, slPlanet);
    // slSig and nlSig exposed for use in summary
    attrs._slSig = slSig;
    attrs._nlSig = nlSig;
  }
  if (subEventKey === 'H7.SPOUSE_NATURE') {
    const sign = SIGN_DATA[cuspSign];
    const comboKey = nlPlanet && sign ? `${nlPlanet}_${sign.element}` : null;
    attrs.spouseNature = comboKey ? (COMBO_MAP[comboKey] || '') : '';
  }
  if (subEventKey === 'H7.MARRIAGE_NUMBER') {
    attrs.marriageNumber = (slSig.includes(9) || nlSig.includes(9))
      ? 'Second marriage possible — H9 active in both SL and NL'
      : 'One marriage primarily indicated';
  }
  if (subEventKey === 'H10.PROFESSION' || subEventKey === 'H10.JOB_VS_BUSINESS') {
    attrs.careerPath    = ATTRIBUTE_RULES.CAREER_PATH(slSig, nlSig);
    attrs.govtVsPrivate = ATTRIBUTE_RULES.GOVT_VS_PRIVATE(slSig, slPlanet, nlPlanet);
  }
  if (subEventKey === 'H10.SECTOR') {
    attrs.careerSector = ATTRIBUTE_RULES.CAREER_SECTOR(nlPlanet, slPlanet, cuspSign);
  }
  if (subEventKey === 'H10.GOVT_PRIVATE') {
    attrs.govtVsPrivate = ATTRIBUTE_RULES.GOVT_VS_PRIVATE(slSig, slPlanet, nlPlanet);
  }
  if (subEventKey === 'H4.PROPERTY_TYPE') {
    attrs.propertyTypes  = ATTRIBUTE_RULES.PROPERTY_TYPE(cuspSign, planetsInHouse, slSig, nlSig);
    attrs.propertyNumber = ATTRIBUTE_RULES.PROPERTY_NUMBER(slPlanet, nlPlanet, cuspSign, slSig);
  }
  if (subEventKey === 'H4.PROPERTY_BUY' || subEventKey === 'H4.PROPERTY_SELL') {
    attrs.propertyTypes  = ATTRIBUTE_RULES.PROPERTY_TYPE(cuspSign, planetsInHouse, slSig, nlSig);
  }
  if (subEventKey === 'H4.VEHICLE') {
    attrs.vehicleAttrs = ATTRIBUTE_RULES.VEHICLE_TYPE(slPlanet, nlPlanet, planetsInHouse, slSig);
  }
  if (subEventKey === 'H2.WEALTH' || subEventKey === 'H11.INCOME') {
    attrs.incomeType = ATTRIBUTE_RULES.INCOME_TYPE(slSig, nlSig);
  }
  if (subEventKey === 'H12.VISA') {
    attrs.visaType = ATTRIBUTE_RULES.VISA_TYPE(slSig, nlSig);
  }
  if (subEventKey === 'H5.CHILD_ENERGY') {
    attrs.child1Gender = ATTRIBUTE_RULES.CHILD_GENDER(1, chartData);
    attrs.child2Gender = ATTRIBUTE_RULES.CHILD_GENDER(2, chartData);
    attrs.child3Gender = ATTRIBUTE_RULES.CHILD_GENDER(3, chartData);
  }
  if (subEventKey === 'H8.INHERITANCE') {
    attrs.inheritanceType = ATTRIBUTE_RULES.INHERITANCE_TYPE(slSig, nlSig);
  }
  if (subEventKey === 'H9.SPIRITUALITY') {
    attrs.spiritualPath = ATTRIBUTE_RULES.SPIRITUAL_PATH(slPlanet, nlPlanet);
  }
  if (subEventKey === 'H9.HIGHER_STUDY') {
    attrs.studyField = ATTRIBUTE_RULES.STUDY_FIELD(nlPlanet, slPlanet);
  }

  return attrs;
}

// ═══════════════════════════════════════════════════
// OCCUPYING PLANETS HELPER
// ═══════════════════════════════════════════════════

/**
 * Get planets physically occupying a given house
 * Uses planet cusp-house data from chartData
 */
function getOccupyingPlanets(houseNum, chartData) {
  if (!chartData || !chartData.planets) return [];
  const occupants = [];
  Object.entries(chartData.planets).forEach(([planet, pData]) => {
    if (pData && pData.house == houseNum) occupants.push(planet);
  });
  return occupants;
}

// ═══════════════════════════════════════════════════
// SUB-EVENT PLAIN-ENGLISH SUMMARY GENERATOR
// Format: Para1=Promise, Para2=Nature, Para3=Current period
// All TABLE 9 meanings converted to natural prose — no raw text leaking
// ═══════════════════════════════════════════════════

function generateSubEventSummary(se, houseNum, chartData) {
  if (!se) return '';

  const rule      = SUB_EVENT_RULES[se.key] || {};
  const slData    = PLANET_DATA[se.slPlanet] || {};
  const nlData    = PLANET_DATA[se.nlPlanet] || {};
  const promise   = se.promise;
  const dba       = se.dba;
  const attrs     = se.attributes || {};
  const occupants = getOccupyingPlanets(houseNum, chartData);
  const dba_ad    = chartData && chartData.dba ? chartData.dba.ad : '';
  const dba_md    = chartData && chartData.dba ? chartData.dba.md : '';
  const slKarak   = slData.karakatva ? slData.karakatva.slice(0,2).join(' and ') : se.slPlanet;
  const nlKarak   = nlData.karakatva ? nlData.karakatva.slice(0,2).join(' and ') : se.nlPlanet;
  const ownStar   = se.nlPlanet === se.slPlanet;

  // ── Promise strength helper (client language) ──
  function promiseStrength() {
    if (promise.mainPresent && promise.obstructHits.length === 0) return 'strong';
    if (promise.mainPresent && promise.obstructHits.length > 0)   return 'mixed';
    if (promise.clusterHits.length >= 2)                          return 'indirect';
    if (promise.clusterHits.length === 1)                         return 'weak';
    return 'absent';
  }

  // ── NL flavour sentence (client language) ──
  function nlFlavour() {
    if (ownStar) {
      return `${se.slPlanet} is in its own star, so it works at full strength here — its qualities of ${nlKarak} come through clearly.`;
    }
    return `The star lord is ${se.nlPlanet}, which brings the qualities of ${nlKarak} into the picture.`;
  }

  // ── Period sentence (client language) ──
  function periodSentence() {
    if (se.type === 'Life') return '';
    if (!dba) return '';
    let s = '';
    if (dba.adGate === 'wide_open') {
      s = `The current period (${dba_ad} antardasha) is directly activating this — things can move now.`;
    } else if (dba.adGate === 'partial') {
      s = `The current period (${dba_ad} antardasha) gives partial support — some movement is possible but the timing is not at its peak.`;
    } else {
      s = `The current period (${dba_ad} antardasha) is not the main trigger for this — a better period will come.`;
    }
    if (dba.verdict === 'strongly_active' || dba.verdict === 'active') {
      s += ` Overall the planetary periods are strongly aligned for this right now.`;
    } else if (dba.verdict === 'possible') {
      s += ` This can happen in this period but needs a stronger sub-period trigger.`;
    } else if (dba.verdict === 'not_this_period') {
      s += ` This is not the right window — wait for a period when the right planets become active.`;
    }
    return s;
  }

  // ══════════════════════════════════════════════
  // SUB-EVENT SPECIFIC SUMMARIES
  // ══════════════════════════════════════════════

  // H7.UNION — Will marriage happen?
  if (se.key === 'H7.UNION') {
    const strength = promiseStrength();
    let para1 = '', para2 = '', para3 = '';

    if (strength === 'strong') {
      para1 = `<strong>Marriage is clearly promised in this chart.</strong> The 7th house is directly activated — there is no ambiguity here. Marriage will happen.`;
    } else if (strength === 'mixed') {
      para1 = `<strong>Marriage is promised but with some complications.</strong> The 7th house is activated, however there are also houses of delay and obstacles present. Marriage will happen — but it may come with challenges, delays, or unconventional circumstances.`;
    } else if (strength === 'indirect') {
      para1 = `<strong>Marriage is indirectly promised.</strong> The 7th house is not directly lit up, but supporting factors (gains, partnerships, family connections) build the case. Marriage is likely — though it may come through an indirect route.`;
    } else if (strength === 'weak') {
      para1 = `<strong>Marriage has a weak promise in this chart.</strong> Only one supporting factor connects to the 7th house. Marriage is possible but not strongly indicated — it depends heavily on the right planetary period arriving.`;
    } else {
      para1 = `<strong>Marriage is not clearly promised in this chart.</strong> The 7th house sub-lord's significations don't connect to the houses needed for marriage to fructify. This does not mean marriage is impossible — but it will need very specific planetary conditions to materialise.`;
    }

    if (attrs.marriageType) {
      para1 += `<br><strong>Type: ${attrs.marriageType}</strong>`;
    }

    para2 = nlFlavour();
    if (occupants.length > 0) {
      para2 += ` ${occupants.join(' and ')} ${occupants.length > 1 ? 'are' : 'is'} placed in the 7th house and directly colour the marriage picture.`;
    }

    para3 = periodSentence();
    if (attrs.marriageTiming) {
      para3 += para3 ? ` Timing: <strong>${attrs.marriageTiming}</strong>.` : `Timing: <strong>${attrs.marriageTiming}</strong>.`;
    }

    return [para1, para2, para3].filter(p => p).join('<br><br>');
  }

  // H7.TYPE — What kind of marriage?
  if (se.key === 'H7.TYPE') {
    let para1 = '', para2 = '', para3 = '';

    const mType = attrs.marriageType || 'Not determined';
    para1 = `<strong>Marriage Type: ${mType}</strong><br>`;

    // Explain why based on which houses are present
    const both = [...new Set([...se.slSig || [], ...se.nlSig || []])];
    const reasons = [];
    if (both.includes(5))  reasons.push('H5 is present — a romantic connection is part of this');
    if (both.includes(3))  reasons.push('H3 is present — family negotiations and matchmaking are involved');
    if (both.includes(9))  reasons.push('H9 is present — traditional ceremony and family blessing are involved');
    if (both.includes(2))  reasons.push('H2 is present — the partner joins the family setup');
    if (both.includes(6))  reasons.push('H6 is present — there may be opposition or it crosses community lines');
    if (both.includes(12)) reasons.push('H12 is present — there is a foreign or distant connection possible');
    if (both.includes(8))  reasons.push('H8 is present — the circumstances around marriage are unconventional');

    if (reasons.length > 0) {
      para1 += reasons.map(r => `• ${r}`).join('<br>');
    }

    para2 = nlFlavour();
    if (attrs.marriageTiming) {
      para2 += `<br><strong>Marriage timing: ${attrs.marriageTiming}</strong>`;
    }

    para3 = `This is a permanent reading about the nature of marriage — it does not change with planetary periods.`;

    return [para1, para2, para3].filter(p => p).join('<br><br>');
  }

  // H7.MARRIAGE_NUMBER — How many marriages?
  if (se.key === 'H7.MARRIAGE_NUMBER') {
    const strength = promiseStrength();
    let para1 = '';

    const num = attrs.marriageNumber || '';
    if (num.includes('Second') || num.includes('second')) {
      para1 = `<strong>Second marriage is possible in this chart.</strong><br>H9 is activated in the sub-lord's significations — in KP, H9 is the house of the 3rd partner (or 2nd marriage). This does not mean the first marriage will end, but the chart does show the possibility of more than one significant relationship or union.`;
    } else {
      para1 = `<strong>One marriage is primarily indicated.</strong><br>The chart points to a single marriage as the primary relationship path. H9 is not strongly activated in a way that would suggest a second union.`;
    }

    if (strength === 'absent' || strength === 'weak') {
      para1 += `<br><br>Note: Since the basic marriage promise itself is weak (as seen in H7.UNION), the number of marriages becomes secondary — first the marriage needs to happen.`;
    }

    const para2 = nlFlavour();
    return [para1, para2].filter(p => p).join('<br><br>');
  }

  // H7.SPOUSE_NATURE — What will the spouse be like?
  if (se.key === 'H7.SPOUSE_NATURE') {
    const strength = promiseStrength();
    let para1 = '', para2 = '', para3 = '';

    if (strength === 'absent') {
      para1 = `<strong>Spouse nature is not clearly defined in this chart.</strong> The 7th sub-lord doesn't give strong clues about the partner's qualities.`;
    } else {
      para1 = `<strong>About the spouse:</strong><br>`;
      const nature = attrs.spouseNature || [];
      if (Array.isArray(nature) && nature.length > 0) {
        para1 += nature.map(q => `• ${q}`).join('<br>');
      } else {
        // Derive from NL planet qualities
        para1 += `The spouse will carry the qualities of <strong>${se.nlPlanet}</strong> — ${nlKarak}.`;
      }
    }

    para2 = nlFlavour();
    if (occupants.length > 0) {
      para2 += ` ${occupants.join(' and ')} in the 7th house also shape the partner's personality and appearance.`;
    }

    para3 = `This is a permanent reading — the spouse's nature is shown by the chart at birth and doesn't change.`;
    return [para1, para2, para3].filter(p => p).join('<br><br>');
  }

  // H7.SEPARATION — Risk of separation?
  if (se.key === 'H7.SEPARATION') {
    const strength = promiseStrength();
    let para1 = '', para2 = '', para3 = '';

    if (strength === 'strong') {
      para1 = `<strong>Separation or distancing in marriage is clearly indicated.</strong> The house of dissolution and separation is strongly activated. This does not guarantee divorce — but significant friction, distance, or a formal separation is possible.`;
    } else if (strength === 'mixed' || strength === 'indirect') {
      para1 = `<strong>There is some indication of marital stress or separation — but not a strong one.</strong> The separation indicators are present but mixed with other factors. There may be periods of difficulty or distance, but it is not the dominant pattern.`;
    } else {
      para1 = `<strong>No strong indication of separation in this chart.</strong> The separation houses are not prominently activated — the marriage is more likely to stay intact.`;
    }

    para2 = nlFlavour();
    para3 = periodSentence();
    return [para1, para2, para3].filter(p => p).join('<br><br>');
  }

  // H7.PARTNERSHIP — Business or professional partnership
  if (se.key === 'H7.PARTNERSHIP') {
    const strength = promiseStrength();
    let para1 = '', para2 = '', para3 = '';

    if (strength === 'strong') {
      para1 = `<strong>Professional partnership is strongly promised.</strong> This person is well-suited for collaborative business — the chart supports working with a partner rather than alone.`;
    } else if (strength === 'mixed') {
      para1 = `<strong>Partnership is possible but comes with friction.</strong> While collaboration is indicated, there will be challenges — differences of opinion, power struggles, or legal complications with partners.`;
    } else if (strength === 'indirect' || strength === 'weak') {
      para1 = `<strong>Partnership may happen but is not the primary path.</strong> The chart leans more toward independent work than collaborative ventures.`;
    } else {
      para1 = `<strong>Partnership is not strongly supported in this chart.</strong> Working alone or in a support role suits this chart better than formal business partnership.`;
    }

    para2 = nlFlavour();
    para3 = periodSentence();
    return [para1, para2, para3].filter(p => p).join('<br><br>');
  }

  // ══════════════════════════════════════════════
  // GENERIC FALLBACK — client language for all other sub-events
  // ══════════════════════════════════════════════

  const strength = promiseStrength();
  const topicLabel = se.name.replace(/_/g,' ');

  // Para 1: Promise in plain client language
  let para1 = '';
  if (strength === 'strong') {
    para1 = `<strong>${topicLabel}</strong> is clearly and strongly promised in this chart.`;
  } else if (strength === 'mixed') {
    para1 = `<strong>${topicLabel}</strong> is promised but comes with some complications and obstacles. It will happen — but not without challenges.`;
  } else if (strength === 'indirect') {
    para1 = `<strong>${topicLabel}</strong> is indicated in the chart, though indirectly. It is likely — but may come through an unexpected route or require more effort.`;
  } else if (strength === 'weak') {
    para1 = `<strong>${topicLabel}</strong> has a weak indication in this chart. It is possible but not guaranteed — the right planetary period is needed.`;
  } else {
    para1 = `<strong>${topicLabel}</strong> is not clearly indicated in this chart. This does not mean it can never happen, but it will need very specific conditions.`;
  }

  // Key attribute if present
  const attrEntries = Object.entries(attrs);
  if (attrEntries.length > 0) {
    const highlights = attrEntries.slice(0,3).map(([k, v]) => {
      const label = k.replace(/([A-Z])/g,' $1').trim();
      const val = Array.isArray(v) ? v.slice(0,2).join(', ') : String(v);
      return `<strong>${label}:</strong> ${val}`;
    }).join(' &nbsp;|&nbsp; ');
    para1 += `<br>${highlights}`;
  }

  // Para 2: NL flavour + occupants
  let para2 = nlFlavour();
  if (occupants.length > 0) {
    const occDesc = occupants.map(p => {
      const pd = PLANET_DATA[p];
      return pd ? `${p} (${pd.karakatva[0]})` : p;
    }).join(' and ');
    para2 += ` ${occDesc} ${occupants.length > 1 ? 'are' : 'is'} placed directly in this house, adding their energy to this area of life.`;
  }

  // Para 3: Period or life reading
  let para3 = '';
  if (se.type === 'Life') {
    para3 = `This is a permanent reading — it shows a fixed pattern in the chart from birth.`;
  } else {
    para3 = periodSentence();
  }

  return [para1, para2, para3].filter(p => p).join('<br><br>');
}
function getLagneshData(chartData) {
  const c1 = chartData.cusps && chartData.cusps[1];
  if (!c1 || !c1.sign) return null;
  const signData = SIGN_DATA[c1.sign];
  if (!signData) return null;
  const lagnesh = signData.ruler;
  const lagneshSig = (chartData.planetSig && chartData.planetSig[lagnesh]) || [];
  return { planet: lagnesh, signif: lagneshSig };
}

// ═══════════════════════════════════════════════════
// HOUSE INTERPRETATION GENERATOR
// Corrected: SL → NL → Occupying planets → RL backdrop
// No DBA in main card
// Style 2 story-based summary
// ═══════════════════════════════════════════════════

function generateHouseInterpretation(houseResult, chartData) {
  const { house, name, slPlanet, nlPlanet, cuspSign,
          signData, houseNature, houseVerdict,
          slSignif, totalSupport, totalObstruct } = houseResult;

  const hData  = HOUSE_DATA[house];
  const slData = PLANET_DATA[slPlanet] || {};
  const nlData = PLANET_DATA[nlPlanet] || {};
  const sign   = signData || {};
  const slSig  = slSignif || [];

  // Occupying planets
  const occupants = getOccupyingPlanets(house, chartData);

  // Lagnesh
  const lagneshData = getLagneshData(chartData);
  const lagnesh     = lagneshData ? lagneshData.planet : null;
  const lagneshSig  = lagneshData ? lagneshData.signif : [];

  // Check if NL = SL (own star)
  const ownStar = nlPlanet === slPlanet;

  // ── PARAGRAPH 1 — Sub-lord Promise ──
  let text = `The Sub-lord of the ${getOrdinal(house)} Bhava is <strong>${slPlanet}</strong>, `;

  if (slSig.length > 0) {
    text += `signifying ${slSig.map(h => `H${h}`).join(', ')}. `;
  }

  // Promise direction
  const mainPresent = slSig.includes(house);
  const clusterHits = hData.cluster ? hData.cluster.filter(h => slSig.includes(h)) : [];
  const obstructHits = hData.obstruct ? hData.obstruct.filter(h => slSig.includes(h)) : [];

  if (mainPresent && obstructHits.length === 0) {
    text += `The main house is directly present in the Sub-lord's signification — this Bhava is <strong>strongly and directly promised</strong>. `;
  } else if (mainPresent && obstructHits.length > 0) {
    text += `The main house is directly present, confirming a strong promise, though ${obstructHits.length} complicating house${obstructHits.length > 1 ? 's' : ''} introduce friction. `;
  } else if (clusterHits.length >= 2) {
    text += `Though the main house is absent, ${clusterHits.length} supporting cluster houses (H${clusterHits.join(', H')}) confirm the promise through an indirect but real path. `;
  } else if (clusterHits.length === 1) {
    text += `The Sub-lord connects to one cluster house (H${clusterHits[0]}) — a moderate indirect promise is present. `;
  } else {
    text += `The Sub-lord's significations do not connect to this Bhava's cluster — the matters governed here face challenges in manifestation. `;
  }

  // What the houses mean in context
  if (slSig.length > 0 && totalSupport > 0) {
    const supportMeanings = slSig
      .filter(h => hData.cluster && hData.cluster.includes(h))
      .map(h => getContextualMeaning(house, h).m)
      .filter(Boolean);
    if (supportMeanings.length > 0) {
      text += `${slData.karakatva ? `${slPlanet}'s natural karakatva of ${slData.karakatva.slice(0,3).join(', ')} ` : ''}operates through ${supportMeanings.slice(0,2).join('; ')}. `;
    }
  }

  if (obstructHits.length > 0) {
    const obstructMeanings = obstructHits
      .map(h => getContextualMeaning(house, h).m)
      .filter(Boolean);
    if (obstructMeanings.length > 0) {
      text += `However ${obstructMeanings.slice(0,2).join('; ')}. `;
    }
  }

  // ── PARAGRAPH 2 — Star-lord Type/Nature ──
  if (nlPlanet) {
    text += `The Star-lord <strong>${nlPlanet}</strong>`;
    if (ownStar) {
      text += ` operates in its own constellation — a position of exceptional strength and purity, doubling its influence on this Bhava without dilution from any secondary planet. `;
    } else {
      text += `, as the Star-lord of ${slPlanet}, `;
    }

    if (nlData.karakatva) {
      text += `brings its karakatva of ${nlData.karakatva.slice(0,3).join(', ')} to color how these matters unfold. `;
    }

    // Combo output
    if (sign.element) {
      const comboKey = `${nlPlanet}_${sign.element}`;
      const combo = COMBO_MAP[comboKey];
      if (combo) text += `The ${nlPlanet}-${cuspSign} combination indicates <em>${combo}</em> as the characteristic expression. `;
    }
  }

  // ── PARAGRAPH 3 — Occupying Planets ──
  if (occupants.length > 0) {
    text += `${occupants.length === 1 ? `<strong>${occupants[0]}</strong> occupies` : `<strong>${occupants.join(' and ')}</strong> occupy`} this Bhava, `;
    const occupantDesc = occupants.map(p => {
      const pd = PLANET_DATA[p];
      return pd ? `${p}'s karakatva of ${pd.karakatva.slice(0,2).join(' and ')}` : p;
    });
    text += `adding ${occupantDesc.join('; ')} directly into this house's expression. `;
  }

  // ── LAGNESH CONNECTION ──
  if (lagnesh && lagnesh !== slPlanet) {
    const lagneshInCluster = hData.cluster && hData.cluster.some(h => lagneshSig.includes(h));
    const lagneshIsMain = lagneshSig.includes(house);
    if (lagneshIsMain || lagneshInCluster) {
      text += `The Lagnesh <strong>${lagnesh}</strong> connects to this Bhava — making these matters <em>personally significant</em> and identity-connected for this native. `;
    }
    if (slPlanet === lagnesh) {
      text += `Notably, the Lagnesh itself governs this cusp — rendering these matters <em>identity-defining</em> in the fullest sense. `;
    }
  }

  // ── SIGN BACKDROP (one line) ──
  if (sign && cuspSign) {
    text += `The ${cuspSign} cusp${sign.ruler ? `, with ${sign.ruler} as sign lord,` : ''} `;
    if (sign.quality === 'Movable') text += `brings swiftness and changeability to manifestation. `;
    else if (sign.quality === 'Fixed') text += `ensures once established, results here are enduring. `;
    else text += `creates a phased, dual unfolding of results. `;
  }

  // ── SUMMARY (Style 2 — Story based) ──
  const summary = generateHouseSummary(house, name, slPlanet, nlPlanet, slSig,
                                        occupants, lagnesh, houseNature, houseVerdict,
                                        ownStar, chartData);
  text += `<br><br><strong>In summary —</strong> ${summary}`;

  return text;
}

/**
 * Generate Style 2 story-based summary per house
 * Simple language, 2-3 sentences
 */
function generateHouseSummary(house, name, slPlanet, nlPlanet, slSig,
                               occupants, lagnesh, houseNature, houseVerdict,
                               ownStar, chartData) {
  const hData = HOUSE_DATA[house];
  const clusterHits = hData.cluster ? hData.cluster.filter(h => slSig.includes(h)) : [];
  const mainPresent = slSig.includes(house);
  const slData = PLANET_DATA[slPlanet] || {};
  const nlData = PLANET_DATA[nlPlanet] || {};

  // Build story elements
  const promise = mainPresent ? 'directly promised' :
                  clusterHits.length >= 2 ? 'promised through indirect path' :
                  clusterHits.length === 1 ? 'moderately indicated' :
                  'not strongly promised';

  const slKarak = slData.karakatva ? slData.karakatva.slice(0,2).join(' and ') : slPlanet;
  const nlKarak = nlData.karakatva ? nlData.karakatva.slice(0,2).join(' and ') : nlPlanet;

  // House-specific story templates
  const stories = {
    1:  `A person whose identity is ${promise} through the lens of ${slKarak}. ${ownStar ? `${slPlanet} in its own star operates with undivided intensity — this quality runs through every dimension of self-expression.` : `${nlPlanet}'s ${nlKarak} colors how this identity manifests.`}${occupants.length ? ` ${occupants.join(' and ')} in the Lagna add their energy directly to personality.` : ''}`,
    2:  `Wealth is ${promise} in this chart, primarily through ${slKarak}. ${ownStar ? `${slPlanet} doubles its energy here — income and family matters carry this planet's undiluted influence.` : `${nlPlanet} shapes the manner in which wealth arrives.`}${occupants.length ? ` ${occupants.join(' and ')} in H2 add significant color to financial and family matters.` : ''}`,
    3:  `Siblings and communication are ${promise}. ${slPlanet}'s ${slKarak} operates through this house. ${ownStar ? `${slPlanet} in own star — communication is a pure, powerful expression of identity.` : `${nlPlanet}'s influence shapes the style and quality of expression.`}${occupants.length ? ` ${occupants.join(' and ')} in H3 add their karakatva to communication and courage.` : ''}`,
    4:  `Property and home are ${promise} — ${slPlanet}'s ${slKarak} shapes the domestic life. ${ownStar ? `${slPlanet} in own star intensifies home and property matters.` : `${nlPlanet} colors the type and nature of property acquired.`}${occupants.length ? ` ${occupants.join(' and ')} in H4 add their energy to home and mother matters.` : ''}${lagnesh === slPlanet ? ' The Lagnesh governing this cusp makes property and home identity-defining.' : ''}`,
    5:  `Children and creativity are ${promise} in this nativity. ${slPlanet}'s ${slKarak} governs this domain. ${ownStar ? `${slPlanet} in own star — the creative and parental promise carries pure, undiluted force.` : `${nlPlanet}'s ${nlKarak} determines how these matters unfold.`}${occupants.length ? ` ${occupants.join(' and ')} in H5 add their influence to romance and children.` : ''}`,
    6:  `Service and employment are ${promise}. ${slPlanet}'s ${slKarak} operates in this domain. ${ownStar ? `${slPlanet} in own star — service matters carry this planet's full, undiluted force.` : `${nlPlanet} colors the nature and style of professional service.`}${occupants.length ? ` ${occupants.join(' and ')} in H6 add their energy to work and health matters.` : ''}`,
    7:  `Marriage and partnership are ${promise}. ${slPlanet}'s ${slKarak} shapes the union. ${ownStar ? `${slPlanet} in own star — partnership matters carry pure, intensified force.` : `${nlPlanet}'s ${nlKarak} colors the type and quality of union.`}${occupants.length ? ` ${occupants.join(' and ')} in H7 add their energy to partnership dynamics.` : ''}`,
    8:  `Transformation and hidden matters are ${promise}. ${slPlanet}'s ${slKarak} operates here. ${ownStar ? `${slPlanet} in own star — transformation comes with undiluted, pure force.` : `${nlPlanet}'s ${nlKarak} shapes how transformation manifests.`}${occupants.length ? ` ${occupants.join(' and ')} in H8 add their energy to transformation and occult matters.` : ''}`,
    9:  `Fortune and higher philosophy are ${promise} through ${slKarak}. ${ownStar ? `${slPlanet} in own star — luck and fortune carry this planet's pure, doubled intensity.` : `${nlPlanet}'s ${nlKarak} shapes how fortune operates.`}${occupants.length ? ` ${occupants.join(' and ')} in H9 add their energy to fortune and long travel.` : ''}`,
    10: `Career and public status are ${promise} — this is ${slPlanet}'s ${slKarak} in action. ${ownStar ? `${slPlanet} in own star — career matters carry maximum, undiluted force.` : `${nlPlanet}'s ${nlKarak} shapes the nature and style of professional achievement.`}${lagnesh === slPlanet ? ' The Lagnesh governing this cusp makes career the most identity-defining domain in the chart.' : ''}`,
    11: `Gains and desires are ${promise}, flowing through ${slKarak}. ${ownStar ? `${slPlanet} in own star doubles its influence on income and fulfilment.` : `${nlPlanet}'s ${nlKarak} colors the nature and source of gains.`}${occupants.length ? ` ${occupants.join(' and ')} in H11 add their energy to gains and social network.` : ''}`,
    12: `Foreign and expenses are ${promise} through ${slKarak}. ${ownStar ? `${slPlanet} in own star — foreign and seclusion matters carry pure, intensified Moon energy.` : `${nlPlanet}'s ${nlKarak} shapes how foreign matters manifest.`}${occupants.length ? ` ${occupants.join(' and ')} in H12 add their energy to foreign and spiritual matters.` : ''}`
  };

  return stories[house] || `This Bhava is ${promise}. ${slPlanet} and ${nlPlanet} together shape its expression.`;
}

// ═══════════════════════════════════════════════════
// MAIN HOUSE PREDICTION RUNNER
// ═══════════════════════════════════════════════════

function runHousePrediction(houseNum, chartData) {
  const houseInfo = HOUSE_DATA[houseNum];
  const cuspData  = chartData.cusps && chartData.cusps[houseNum];
  const planetSig = chartData.planetSig || {};
  const dba       = chartData.dba || {};
  const rp        = chartData.rp  || {};

  // Guard against missing data
  if (!cuspData || !cuspData.sl || cuspData.sl === '') {
    return {
      house: houseNum, name: houseInfo.name, domain: houseInfo.domain,
      error: 'Sub-lord not entered', subEvents: [],
      houseNature:'Neutral', houseVerdict:'Not Promised',
      totalSupport:0, totalObstruct:0, houseNetScore:0
    };
  }

  const slPlanet = cuspData.sl;
  const cuspSign = cuspData.sign;
  const signData = SIGN_DATA[cuspSign] || null;

  // Get true NL of SL (from planet position)
  const trueNL   = getNLofSL(slPlanet, chartData, cuspData.nl);
  const nlPlanet = trueNL || cuspData.nl;

  const slSig  = planetSig[slPlanet] || [];
  const nlSig  = planetSig[nlPlanet] || [];
  const mdSig  = planetSig[dba.md]   || [];
  const adSig  = planetSig[dba.ad]   || [];
  const pdSig  = planetSig[dba.pd]   || [];
  const dbaLords = [dba.md, dba.ad, dba.pd].filter(Boolean);

  // House-level promise (using corrected scoring)
  const mainPresent   = slSig.includes(houseNum);
  const clusterHits   = houseInfo.cluster.filter(h => slSig.includes(h));
  const obstructHits  = houseInfo.obstruct.filter(h => slSig.includes(h));
  const houseNetScore = (mainPresent ? 3 : 0) + clusterHits.length - obstructHits.length;
  const totalSupport  = mainPresent ? clusterHits.length + 1 : clusterHits.length;
  const totalObstruct = obstructHits.length;

  let houseNature = 'Mixed';
  if (houseNetScore >= 2) houseNature = 'Supportive';
  else if (houseNetScore <= -2) houseNature = 'Obstructive';

  // AD gate check for house verdict
  const adGateOpen = adSig.includes(houseNum) ||
                     houseInfo.cluster.some(h => adSig.includes(h));

  let houseVerdict = 'Not Promised';
  if (mainPresent || clusterHits.length >= 1) {
    if (adGateOpen && houseNetScore >= 0) houseVerdict = 'Active';
    else if (adGateOpen)                   houseVerdict = 'Active with challenges';
    else                                   houseVerdict = 'Promised — awaiting period';
  }

  // Occupying planets
  const occupants = getOccupyingPlanets(houseNum, chartData);

  // Sub-events
  const subEventResults = houseInfo.subEvents.map(seKey => {
    const fullKey = `H${houseNum}.${seKey}`;
    const rule    = SUB_EVENT_RULES[fullKey];
    if (!rule) return null;

    const promise    = checkPromise(fullKey, slSig);
    const dbaResult  = rule.type === 'Life'
      ? { score:0, verdict:'life_reading', adGate:'na' }
      : scoreDBA(fullKey, houseNum, mdSig, adSig, pdSig);
    const rpResult   = rule.type === 'Life'
      ? { rpScore:0, confidence:'na', matchedRPs:[] }
      : scoreRP(fullKey, rp, planetSig, dbaLords);
    const attrs      = deriveAttributes(fullKey, slSig, nlSig, slPlanet, nlPlanet,
                                         cuspSign, chartData, houseNum);
    const sign       = signData;
    const comboKey   = nlPlanet && sign ? `${nlPlanet}_${sign.element}` : null;
    const comboOut   = comboKey ? (COMBO_MAP[comboKey] || null) : null;

    return {
      key:         fullKey,
      name:        seKey.replace(/_/g,' '),
      type:        rule.type,
      promise,
      dba:         dbaResult,
      rp:          rpResult,
      attributes:  attrs,
      combination: comboOut,
      slPlanet, nlPlanet, cuspSign, signData,
      slSig, nlSig
    };
  }).filter(Boolean);

  return {
    house: houseNum, name: houseInfo.name, domain: houseInfo.domain,
    Sanskrit: houseInfo.Sanskrit,
    slPlanet, nlPlanet, cuspSign, signData,
    slSignif: slSig, nlSignif: nlSig,
    mainPresent, totalSupport, totalObstruct,
    houseNetScore, houseNature, houseVerdict,
    adActive: adGateOpen, occupants,
    subEvents: subEventResults
  };
}

// ═══════════════════════════════════════════════════
// FULL CHART RUNNER
// ═══════════════════════════════════════════════════

function runFullChart(chartData) {
  const results = {};
  for (let h = 1; h <= 12; h++) {
    results[h] = runHousePrediction(h, chartData);
  }
  return results;
}

function getChartSummary(results) {
  let supportive=0, mixed=0, obstructive=0, notPromised=0;
  Object.values(results).forEach(r => {
    if (r.error) { notPromised++; return; }
    if (r.houseVerdict === 'Not Promised') notPromised++;
    else if (r.houseNature === 'Supportive') supportive++;
    else if (r.houseNature === 'Obstructive') obstructive++;
    else mixed++;
  });
  return { supportive, mixed, obstructive, notPromised };
}

// ═══════════════════════════════════════════════════
// SESSION STORAGE HELPERS
// ═══════════════════════════════════════════════════

function saveChartData(data)  { sessionStorage.setItem('kp_input',   JSON.stringify(data)); }
function loadChartData()      { const r = sessionStorage.getItem('kp_input');   return r ? JSON.parse(r) : null; }
function saveResults(results) { sessionStorage.setItem('kp_results', JSON.stringify(results)); }
function loadResults()        { const r = sessionStorage.getItem('kp_results'); return r ? JSON.parse(r) : null; }
function clearAll()           { sessionStorage.removeItem('kp_input'); sessionStorage.removeItem('kp_results'); }

// ═══════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════

function getOrdinal(n) {
  const s=['th','st','nd','rd'], v=n%100;
  return n+(s[(v-20)%10]||s[v]||s[0]);
}

function getNatureTilt(score) {
  if (score >= 2) return 'Supportive';
  if (score <= -2) return 'Obstructive';
  return 'Mixed';
}
