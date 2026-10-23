// A star's names from its SIMBAD record. The canonical name is SIMBAD's main identifier when that is
// a name; a Bayer designation with a component letter written out ("* alf Cen A" is Alpha Centauri
// A, the component the record is); otherwise SIMBAD's shortest name; otherwise the main identifier.
// Writing out a designation spells the record's own words; it adds no information.

const GREEK: Record<string, string> = {
  alf: 'Alpha', bet: 'Beta', gam: 'Gamma', del: 'Delta', eps: 'Epsilon', zet: 'Zeta', eta: 'Eta', tet: 'Theta', iot: 'Iota', kap: 'Kappa',
  lam: 'Lambda', 'mu.': 'Mu', 'nu.': 'Nu', ksi: 'Xi', omi: 'Omicron', 'pi.': 'Pi', rho: 'Rho', sig: 'Sigma', tau: 'Tau', ups: 'Upsilon',
  phi: 'Phi', chi: 'Chi', psi: 'Psi', ome: 'Omega',
};

/** The IAU constellation abbreviations and their genitives. */
const GENITIVE: Record<string, string> = {
  And: 'Andromedae', Ant: 'Antliae', Aps: 'Apodis', Aqr: 'Aquarii', Aql: 'Aquilae', Ara: 'Arae', Ari: 'Arietis', Aur: 'Aurigae', Boo: 'Boötis',
  Cae: 'Caeli', Cam: 'Camelopardalis', Cnc: 'Cancri', CVn: 'Canum Venaticorum', CMa: 'Canis Majoris', CMi: 'Canis Minoris', Cap: 'Capricorni',
  Car: 'Carinae', Cas: 'Cassiopeiae', Cen: 'Centauri', Cep: 'Cephei', Cet: 'Ceti', Cha: 'Chamaeleontis', Cir: 'Circini', Col: 'Columbae',
  Com: 'Comae Berenices', CrA: 'Coronae Australis', CrB: 'Coronae Borealis', Crv: 'Corvi', Crt: 'Crateris', Cru: 'Crucis', Cyg: 'Cygni',
  Del: 'Delphini', Dor: 'Doradus', Dra: 'Draconis', Equ: 'Equulei', Eri: 'Eridani', For: 'Fornacis', Gem: 'Geminorum', Gru: 'Gruis',
  Her: 'Herculis', Hor: 'Horologii', Hya: 'Hydrae', Hyi: 'Hydri', Ind: 'Indi', Lac: 'Lacertae', Leo: 'Leonis', LMi: 'Leonis Minoris',
  Lep: 'Leporis', Lib: 'Librae', Lup: 'Lupi', Lyn: 'Lyncis', Lyr: 'Lyrae', Men: 'Mensae', Mic: 'Microscopii', Mon: 'Monocerotis',
  Mus: 'Muscae', Nor: 'Normae', Oct: 'Octantis', Oph: 'Ophiuchi', Ori: 'Orionis', Pav: 'Pavonis', Peg: 'Pegasi', Per: 'Persei',
  Phe: 'Phoenicis', Pic: 'Pictoris', Psc: 'Piscium', PsA: 'Piscis Austrini', Pup: 'Puppis', Pyx: 'Pyxidis', Ret: 'Reticuli', Sge: 'Sagittae',
  Sgr: 'Sagittarii', Sco: 'Scorpii', Scl: 'Sculptoris', Sct: 'Scuti', Ser: 'Serpentis', Sex: 'Sextantis', Tau: 'Tauri', Tel: 'Telescopii',
  Tri: 'Trianguli', TrA: 'Trianguli Australis', Tuc: 'Tucanae', UMa: 'Ursae Majoris', UMi: 'Ursae Minoris', Vel: 'Velorum', Vir: 'Virginis',
  Vol: 'Volantis', Vul: 'Vulpeculae',
};

/** "* alf Cen A" as "Alpha Centauri A"; "* omi02 Eri" as "Omicron2 Eridani"; null when it is not a Bayer designation. */
export const bayerInWords = (id: string): { words: string; component: string | null } | null => {
  const m = id.match(/^\*\s+([a-z]{2,3}\.?)(0?\d)?\s+([A-Za-z]{3})(?:\s+([A-Z]))?$/);
  if (!m) return null;
  const greek = GREEK[m[1] as string];
  const con = GENITIVE[m[3] as string];
  if (!greek || !con) return null;
  const sup = m[2] ? String(Number(m[2])) : '';
  return { words: `${greek}${sup} ${con}${m[4] ? ` ${m[4]}` : ''}`, component: m[4] ?? null };
};

const clean = (id: string) => id.replace(/^\*+\s+/, '').replace(/^V\*\s+/, '').replace(/\s+/g, ' ').trim();

export const starNames = (mainId: string, idents: readonly string[]): { canonical: string; aliases: string[] } => {
  const names = [...new Set(idents.filter((i) => i.startsWith('NAME ')).map((i) => i.slice(5).trim()))].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const bayer = bayerInWords(mainId) ?? idents.map(bayerInWords).find((b) => b !== null) ?? null;
  let canonical: string;
  if (mainId.startsWith('NAME ')) canonical = mainId.slice(5).trim();
  else if (bayer?.component) canonical = bayer.words;
  else if (names[0]) canonical = names[0];
  else if (bayer) canonical = bayer.words;
  else canonical = clean(mainId);
  const aliases = [...new Set([...names, bayer?.words, clean(mainId), ...idents.filter((i) => i.startsWith('* ')).map(clean)].filter((x): x is string => !!x && x !== canonical))];
  return { canonical, aliases };
};
