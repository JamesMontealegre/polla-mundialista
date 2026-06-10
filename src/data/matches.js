// Fixture completo del Mundial 2026
// Fechas y horas en hora Colombia (UTC-5) — ISO 8601 con offset -05:00
// ✓ = confirmado | [est] = estimado (el admin puede ajustar)

export const GROUPS = {
  A: { teams: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'] },
  B: { teams: ['Canadá', 'Bosnia-Herzegovina', 'Catar', 'Suiza'] },
  C: { teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  D: { teams: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  E: { teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  F: { teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  G: { teams: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  H: { teams: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'] },
  I: { teams: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  J: { teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  K: { teams: ['Portugal', 'Rep. Dem. Congo', 'Uzbekistán', 'Colombia'] },
  L: { teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
}

// Banderas emoji por equipo
export const FLAGS = {
  'México': '🇲🇽',
  'Sudáfrica': '🇿🇦',
  'Corea del Sur': '🇰🇷',
  'República Checa': '🇨🇿',
  'Canadá': '🇨🇦',
  'Bosnia-Herzegovina': '🇧🇦',
  'Catar': '🇶🇦',
  'Suiza': '🇨🇭',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'Haití': '🇭🇹',
  'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turquía': '🇹🇷',
  'Alemania': '🇩🇪',
  'Curazao': '🇨🇼',
  'Costa de Marfil': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱',
  'Japón': '🇯🇵',
  'Suecia': '🇸🇪',
  'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪',
  'Egipto': '🇪🇬',
  'Irán': '🇮🇷',
  'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Arabia Saudí': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Irak': '🇮🇶',
  'Noruega': '🇳🇴',
  'Argentina': '🇦🇷',
  'Argelia': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordania': '🇯🇴',
  'Portugal': '🇵🇹',
  'Rep. Dem. Congo': '🇨🇩',
  'Uzbekistán': '🇺🇿',
  'Colombia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croacia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panamá': '🇵🇦',
}

// Fixtures completos — hora Colombia (offset -05:00)
// stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'
export const MATCHES = [
  // ==================== FASE DE GRUPOS ====================
  // --- Jornada 1 ---
  { id: 'M001', matchNum: 1, group: 'A', stage: 'group', matchday: 1, team1: 'México', team2: 'Sudáfrica', date: '2026-06-11T14:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  { id: 'M002', matchNum: 2, group: 'A', stage: 'group', matchday: 1, team1: 'Corea del Sur', team2: 'República Checa', date: '2026-06-11T21:00:00-05:00', venue: 'Estadio Akron', city: 'Zapopan' },
  { id: 'M003', matchNum: 3, group: 'B', stage: 'group', matchday: 1, team1: 'Canadá', team2: 'Bosnia-Herzegovina', date: '2026-06-12T14:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M004', matchNum: 4, group: 'D', stage: 'group', matchday: 1, team1: 'Estados Unidos', team2: 'Paraguay', date: '2026-06-12T20:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M005', matchNum: 5, group: 'D', stage: 'group', matchday: 1, team1: 'Australia', team2: 'Turquía', date: '2026-06-13T11:00:00-05:00', venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'M006', matchNum: 6, group: 'B', stage: 'group', matchday: 1, team1: 'Catar', team2: 'Suiza', date: '2026-06-13T14:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'M007', matchNum: 7, group: 'C', stage: 'group', matchday: 1, team1: 'Brasil', team2: 'Marruecos', date: '2026-06-13T17:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'M008', matchNum: 8, group: 'C', stage: 'group', matchday: 1, team1: 'Haití', team2: 'Escocia', date: '2026-06-13T20:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M009', matchNum: 9, group: 'E', stage: 'group', matchday: 1, team1: 'Alemania', team2: 'Curazao', date: '2026-06-14T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M010', matchNum: 10, group: 'F', stage: 'group', matchday: 1, team1: 'Países Bajos', team2: 'Japón', date: '2026-06-14T15:00:00-05:00', venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'M011', matchNum: 11, group: 'E', stage: 'group', matchday: 1, team1: 'Costa de Marfil', team2: 'Ecuador', date: '2026-06-14T18:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M012', matchNum: 12, group: 'F', stage: 'group', matchday: 1, team1: 'Suecia', team2: 'Túnez', date: '2026-06-14T21:00:00-05:00', venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'M013', matchNum: 13, group: 'H', stage: 'group', matchday: 1, team1: 'España', team2: 'Cabo Verde', date: '2026-06-15T12:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M014', matchNum: 14, group: 'G', stage: 'group', matchday: 1, team1: 'Bélgica', team2: 'Egipto', date: '2026-06-15T17:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  { id: 'M015', matchNum: 15, group: 'H', stage: 'group', matchday: 1, team1: 'Arabia Saudí', team2: 'Uruguay', date: '2026-06-15T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'M016', matchNum: 16, group: 'G', stage: 'group', matchday: 1, team1: 'Irán', team2: 'Nueva Zelanda', date: '2026-06-15T23:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M017', matchNum: 17, group: 'I', stage: 'group', matchday: 1, team1: 'Francia', team2: 'Senegal', date: '2026-06-16T14:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'M018', matchNum: 18, group: 'I', stage: 'group', matchday: 1, team1: 'Irak', team2: 'Noruega', date: '2026-06-16T17:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M019', matchNum: 19, group: 'J', stage: 'group', matchday: 1, team1: 'Argentina', team2: 'Argelia', date: '2026-06-16T20:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'M020', matchNum: 20, group: 'J', stage: 'group', matchday: 1, team1: 'Austria', team2: 'Jordania', date: '2026-06-16T20:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'M021', matchNum: 21, group: 'K', stage: 'group', matchday: 1, team1: 'Portugal', team2: 'Rep. Dem. Congo', date: '2026-06-17T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M022', matchNum: 22, group: 'L', stage: 'group', matchday: 1, team1: 'Ghana', team2: 'Panamá', date: '2026-06-17T17:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'M023', matchNum: 23, group: 'L', stage: 'group', matchday: 1, team1: 'Inglaterra', team2: 'Croacia', date: '2026-06-17T20:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'M024', matchNum: 24, group: 'K', stage: 'group', matchday: 1, team1: 'Uzbekistán', team2: 'Colombia', date: '2026-06-17T21:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },

  // --- Jornada 2 ---
  { id: 'M025', matchNum: 25, group: 'A', stage: 'group', matchday: 2, team1: 'República Checa', team2: 'Sudáfrica', date: '2026-06-18T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M026', matchNum: 26, group: 'B', stage: 'group', matchday: 2, team1: 'Suiza', team2: 'Bosnia-Herzegovina', date: '2026-06-18T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M027', matchNum: 27, group: 'B', stage: 'group', matchday: 2, team1: 'Canadá', team2: 'Catar', date: '2026-06-18T17:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  { id: 'M028', matchNum: 28, group: 'A', stage: 'group', matchday: 2, team1: 'México', team2: 'Corea del Sur', date: '2026-06-18T22:00:00-05:00', venue: 'Estadio Akron', city: 'Zapopan' },
  { id: 'M029', matchNum: 29, group: 'D', stage: 'group', matchday: 2, team1: 'Estados Unidos', team2: 'Australia', date: '2026-06-19T14:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  { id: 'M030', matchNum: 30, group: 'C', stage: 'group', matchday: 2, team1: 'Escocia', team2: 'Marruecos', date: '2026-06-19T17:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M031', matchNum: 31, group: 'C', stage: 'group', matchday: 2, team1: 'Brasil', team2: 'Haití', date: '2026-06-19T20:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M032', matchNum: 32, group: 'D', stage: 'group', matchday: 2, team1: 'Turquía', team2: 'Paraguay', date: '2026-06-19T20:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'M033', matchNum: 33, group: 'F', stage: 'group', matchday: 2, team1: 'Países Bajos', team2: 'Suecia', date: '2026-06-20T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M034', matchNum: 34, group: 'E', stage: 'group', matchday: 2, team1: 'Alemania', team2: 'Costa de Marfil', date: '2026-06-20T15:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M035', matchNum: 35, group: 'F', stage: 'group', matchday: 2, team1: 'Japón', team2: 'Túnez', date: '2026-06-20T18:00:00-05:00', venue: 'Estadio Akron', city: 'Zapopan' },
  { id: 'M036', matchNum: 36, group: 'E', stage: 'group', matchday: 2, team1: 'Ecuador', team2: 'Curazao', date: '2026-06-20T19:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'M037', matchNum: 37, group: 'H', stage: 'group', matchday: 2, team1: 'España', team2: 'Arabia Saudí', date: '2026-06-21T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M038', matchNum: 38, group: 'G', stage: 'group', matchday: 2, team1: 'Bélgica', team2: 'Irán', date: '2026-06-21T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M039', matchNum: 39, group: 'H', stage: 'group', matchday: 2, team1: 'Cabo Verde', team2: 'Uruguay', date: '2026-06-21T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'M040', matchNum: 40, group: 'G', stage: 'group', matchday: 2, team1: 'Egipto', team2: 'Nueva Zelanda', date: '2026-06-21T20:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  { id: 'M041', matchNum: 41, group: 'I', stage: 'group', matchday: 2, team1: 'Francia', team2: 'Irak', date: '2026-06-22T14:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M042', matchNum: 42, group: 'J', stage: 'group', matchday: 2, team1: 'Argentina', team2: 'Austria', date: '2026-06-22T17:00:00-05:00', venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'M043', matchNum: 43, group: 'I', stage: 'group', matchday: 2, team1: 'Noruega', team2: 'Senegal', date: '2026-06-22T19:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  { id: 'M044', matchNum: 44, group: 'J', stage: 'group', matchday: 2, team1: 'Argelia', team2: 'Jordania', date: '2026-06-22T20:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'M045', matchNum: 45, group: 'L', stage: 'group', matchday: 2, team1: 'Panamá', team2: 'Croacia', date: '2026-06-23T11:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M046', matchNum: 46, group: 'K', stage: 'group', matchday: 2, team1: 'Portugal', team2: 'Uzbekistán', date: '2026-06-23T13:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M047', matchNum: 47, group: 'L', stage: 'group', matchday: 2, team1: 'Inglaterra', team2: 'Ghana', date: '2026-06-23T15:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M048', matchNum: 48, group: 'K', stage: 'group', matchday: 2, team1: 'Colombia', team2: 'Rep. Dem. Congo', date: '2026-06-23T22:00:00-05:00', venue: 'Estadio Akron', city: 'Guadalajara' },

  // --- Jornada 3 (partidos simultáneos dentro del mismo grupo) ---
  { id: 'M049', matchNum: 49, group: 'A', stage: 'group', matchday: 3, team1: 'México', team2: 'República Checa', date: '2026-06-24T13:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México', simultaneous: 'M050' },
  { id: 'M050', matchNum: 50, group: 'A', stage: 'group', matchday: 3, team1: 'Sudáfrica', team2: 'Corea del Sur', date: '2026-06-24T13:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', simultaneous: 'M049' },
  { id: 'M051', matchNum: 51, group: 'B', stage: 'group', matchday: 3, team1: 'Canadá', team2: 'Suiza', date: '2026-06-24T17:00:00-05:00', venue: 'BC Place', city: 'Vancouver', simultaneous: 'M052' },
  { id: 'M052', matchNum: 52, group: 'B', stage: 'group', matchday: 3, team1: 'Bosnia-Herzegovina', team2: 'Catar', date: '2026-06-24T17:00:00-05:00', venue: 'AT&T Stadium', city: 'Arlington', simultaneous: 'M051' },
  { id: 'M053', matchNum: 53, group: 'C', stage: 'group', matchday: 3, team1: 'Brasil', team2: 'Escocia', date: '2026-06-24T21:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford', simultaneous: 'M054' },
  { id: 'M054', matchNum: 54, group: 'C', stage: 'group', matchday: 3, team1: 'Marruecos', team2: 'Haití', date: '2026-06-24T21:00:00-05:00', venue: 'Lumen Field', city: 'Seattle', simultaneous: 'M053' },
  { id: 'M055', matchNum: 55, group: 'D', stage: 'group', matchday: 3, team1: 'Estados Unidos', team2: 'Turquía', date: '2026-06-25T13:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles', simultaneous: 'M056' },
  { id: 'M056', matchNum: 56, group: 'D', stage: 'group', matchday: 3, team1: 'Paraguay', team2: 'Australia', date: '2026-06-25T13:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City', simultaneous: 'M055' },
  { id: 'M057', matchNum: 57, group: 'E', stage: 'group', matchday: 3, team1: 'Alemania', team2: 'Ecuador', date: '2026-06-25T17:00:00-05:00', venue: 'NRG Stadium', city: 'Houston', simultaneous: 'M058' },
  { id: 'M058', matchNum: 58, group: 'E', stage: 'group', matchday: 3, team1: 'Costa de Marfil', team2: 'Curazao', date: '2026-06-25T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami', simultaneous: 'M057' },
  { id: 'M059', matchNum: 59, group: 'F', stage: 'group', matchday: 3, team1: 'Países Bajos', team2: 'Túnez', date: '2026-06-25T21:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia', simultaneous: 'M060' },
  { id: 'M060', matchNum: 60, group: 'F', stage: 'group', matchday: 3, team1: 'Japón', team2: 'Suecia', date: '2026-06-25T21:00:00-05:00', venue: 'BMO Field', city: 'Toronto', simultaneous: 'M059' },
  { id: 'M061', matchNum: 61, group: 'G', stage: 'group', matchday: 3, team1: 'Bélgica', team2: 'Nueva Zelanda', date: '2026-06-26T13:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México', simultaneous: 'M062' },
  { id: 'M062', matchNum: 62, group: 'G', stage: 'group', matchday: 3, team1: 'Egipto', team2: 'Irán', date: '2026-06-26T13:00:00-05:00', venue: 'AT&T Stadium', city: 'Arlington', simultaneous: 'M061' },
  { id: 'M063', matchNum: 63, group: 'H', stage: 'group', matchday: 3, team1: 'España', team2: 'Uruguay', date: '2026-06-26T17:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', simultaneous: 'M064' },
  { id: 'M064', matchNum: 64, group: 'H', stage: 'group', matchday: 3, team1: 'Cabo Verde', team2: 'Arabia Saudí', date: '2026-06-26T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami', simultaneous: 'M063' },
  { id: 'M065', matchNum: 65, group: 'I', stage: 'group', matchday: 3, team1: 'Francia', team2: 'Noruega', date: '2026-06-26T21:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford', simultaneous: 'M066' },
  { id: 'M066', matchNum: 66, group: 'I', stage: 'group', matchday: 3, team1: 'Senegal', team2: 'Irak', date: '2026-06-26T21:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles', simultaneous: 'M065' },
  { id: 'M067', matchNum: 67, group: 'J', stage: 'group', matchday: 3, team1: 'Argentina', team2: 'Jordania', date: '2026-06-27T13:00:00-05:00', venue: 'Estadio Akron', city: 'Zapopan', simultaneous: 'M068' },
  { id: 'M068', matchNum: 68, group: 'J', stage: 'group', matchday: 3, team1: 'Argelia', team2: 'Austria', date: '2026-06-27T13:00:00-05:00', venue: 'Lumen Field', city: 'Seattle', simultaneous: 'M067' },
  { id: 'M069', matchNum: 69, group: 'L', stage: 'group', matchday: 3, team1: 'Inglaterra', team2: 'Panamá', date: '2026-06-27T16:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford', simultaneous: 'M070' },
  { id: 'M070', matchNum: 70, group: 'L', stage: 'group', matchday: 3, team1: 'Croacia', team2: 'Ghana', date: '2026-06-27T16:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia', simultaneous: 'M069' },
  { id: 'M071', matchNum: 71, group: 'K', stage: 'group', matchday: 3, team1: 'Portugal', team2: 'Colombia', date: '2026-06-27T19:30:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami', simultaneous: 'M072' },
  { id: 'M072', matchNum: 72, group: 'K', stage: 'group', matchday: 3, team1: 'Rep. Dem. Congo', team2: 'Uzbekistán', date: '2026-06-27T19:30:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', simultaneous: 'M071' },

  // ==================== RONDA DE 32 ====================
  { id: 'R32_01', matchNum: 73, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-04T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_02', matchNum: 74, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-04T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_03', matchNum: 75, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-05T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_04', matchNum: 76, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-05T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_05', matchNum: 77, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-06T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_06', matchNum: 78, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-06T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_07', matchNum: 79, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-07T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_08', matchNum: 80, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-07T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_09', matchNum: 81, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-08T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_10', matchNum: 82, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-08T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_11', matchNum: 83, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-09T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_12', matchNum: 84, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-09T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_13', matchNum: 85, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-10T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_14', matchNum: 86, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-10T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_15', matchNum: 87, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-11T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R32_16', matchNum: 88, stage: 'r32', team1: 'Por definir', team2: 'Por definir', date: '2026-07-11T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },

  // ==================== OCTAVOS DE FINAL ====================
  { id: 'R16_01', matchNum: 89, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-12T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_02', matchNum: 90, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-12T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_03', matchNum: 91, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-13T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_04', matchNum: 92, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-13T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_05', matchNum: 93, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-14T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_06', matchNum: 94, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-14T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_07', matchNum: 95, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-15T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'R16_08', matchNum: 96, stage: 'r16', team1: 'Por definir', team2: 'Por definir', date: '2026-07-15T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },

  // ==================== CUARTOS DE FINAL ====================
  { id: 'QF_01', matchNum: 97, stage: 'qf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-17T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'QF_02', matchNum: 98, stage: 'qf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-17T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'QF_03', matchNum: 99, stage: 'qf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-18T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'QF_04', matchNum: 100, stage: 'qf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-18T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },

  // ==================== SEMIFINALES ====================
  { id: 'SF_01', matchNum: 101, stage: 'sf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-22T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },
  { id: 'SF_02', matchNum: 102, stage: 'sf', team1: 'Por definir', team2: 'Por definir', date: '2026-07-23T18:00:00-05:00', venue: 'Por definir', city: 'Por definir' },

  // ==================== TERCER PUESTO ====================
  { id: '3RD', matchNum: 103, stage: '3rd', team1: 'Por definir', team2: 'Por definir', date: '2026-07-25T14:00:00-05:00', venue: 'Por definir', city: 'Por definir' },

  // ==================== FINAL ====================
  { id: 'FINAL', matchNum: 104, stage: 'final', team1: 'Por definir', team2: 'Por definir', date: '2026-07-19T15:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
]

export const STAGE_NAMES = {
  group: 'Fase de Grupos',
  r32: 'Dieciseisavos de Final',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  '3rd': 'Tercer Puesto',
  final: 'Final',
}

// Lista de las 48 selecciones del Mundial 2026
export const ALL_TEAMS = Object.values(GROUPS).flatMap(g => g.teams).sort((a, b) => a.localeCompare(b, 'es'))

// Verifica si un partido ya comenzó (en hora Colombia)
export function hasMatchStarted(match) {
  const matchDate = new Date(match.date)
  // Cerrar predicciones 5 minutos antes del inicio
  const cutoff = new Date(matchDate.getTime() - 5 * 60 * 1000)
  const now = new Date()
  return now >= cutoff
}

// Determina el ganador de un marcador
export function getWinner(team1Goals, team2Goals, team1, team2) {
  if (team1Goals > team2Goals) return team1
  if (team2Goals > team1Goals) return team2
  return 'Empate'
}
