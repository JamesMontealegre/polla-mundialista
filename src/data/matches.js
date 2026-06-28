// Fixture completo del Mundial 2026
// Fechas y horas en hora Colombia (UTC-5) — convertidos desde horario ET (UTC-4)
// Fuente: calendario oficial FIFA

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

// Fixtures completos — hora Colombia (UTC-5)
// stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'
export const MATCHES = [
  // ==================== FASE DE GRUPOS ====================

  // --- Jornada 1 ---
  // Jueves 11 de junio
  { id: 'M001', matchNum: 1, group: 'A', stage: 'group', matchday: 1, team1: 'México', team2: 'Sudáfrica', date: '2026-06-11T14:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  { id: 'M002', matchNum: 2, group: 'A', stage: 'group', matchday: 1, team1: 'Corea del Sur', team2: 'República Checa', date: '2026-06-11T21:00:00-05:00', venue: 'Estadio Akron', city: 'Guadalajara' },
  // Viernes 12 de junio
  { id: 'M003', matchNum: 3, group: 'B', stage: 'group', matchday: 1, team1: 'Canadá', team2: 'Bosnia-Herzegovina', date: '2026-06-12T14:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M004', matchNum: 4, group: 'D', stage: 'group', matchday: 1, team1: 'Estados Unidos', team2: 'Paraguay', date: '2026-06-12T20:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  // Sábado 13 de junio
  { id: 'M005', matchNum: 5, group: 'B', stage: 'group', matchday: 1, team1: 'Catar', team2: 'Suiza', date: '2026-06-13T14:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'M006', matchNum: 6, group: 'C', stage: 'group', matchday: 1, team1: 'Brasil', team2: 'Marruecos', date: '2026-06-13T17:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'M007', matchNum: 7, group: 'C', stage: 'group', matchday: 1, team1: 'Haití', team2: 'Escocia', date: '2026-06-13T20:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M008', matchNum: 8, group: 'D', stage: 'group', matchday: 1, team1: 'Australia', team2: 'Turquía', date: '2026-06-13T23:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  // Domingo 14 de junio
  { id: 'M009', matchNum: 9, group: 'E', stage: 'group', matchday: 1, team1: 'Alemania', team2: 'Curazao', date: '2026-06-14T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M010', matchNum: 10, group: 'F', stage: 'group', matchday: 1, team1: 'Países Bajos', team2: 'Japón', date: '2026-06-14T15:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'M011', matchNum: 11, group: 'E', stage: 'group', matchday: 1, team1: 'Costa de Marfil', team2: 'Ecuador', date: '2026-06-14T18:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M012', matchNum: 12, group: 'F', stage: 'group', matchday: 1, team1: 'Suecia', team2: 'Túnez', date: '2026-06-14T21:00:00-05:00', venue: 'Estadio BBVA', city: 'Monterrey' },
  // Lunes 15 de junio
  { id: 'M013', matchNum: 13, group: 'H', stage: 'group', matchday: 1, team1: 'España', team2: 'Cabo Verde', date: '2026-06-15T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M014', matchNum: 14, group: 'G', stage: 'group', matchday: 1, team1: 'Bélgica', team2: 'Egipto', date: '2026-06-15T14:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  { id: 'M015', matchNum: 15, group: 'H', stage: 'group', matchday: 1, team1: 'Arabia Saudí', team2: 'Uruguay', date: '2026-06-15T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'M016', matchNum: 16, group: 'G', stage: 'group', matchday: 1, team1: 'Irán', team2: 'Nueva Zelanda', date: '2026-06-15T20:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  // Martes 16 de junio
  { id: 'M017', matchNum: 17, group: 'I', stage: 'group', matchday: 1, team1: 'Francia', team2: 'Senegal', date: '2026-06-16T14:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'M018', matchNum: 18, group: 'I', stage: 'group', matchday: 1, team1: 'Irak', team2: 'Noruega', date: '2026-06-16T17:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M019', matchNum: 19, group: 'J', stage: 'group', matchday: 1, team1: 'Argentina', team2: 'Argelia', date: '2026-06-16T20:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'M020', matchNum: 20, group: 'J', stage: 'group', matchday: 1, team1: 'Austria', team2: 'Jordania', date: '2026-06-16T23:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  // Miércoles 17 de junio
  { id: 'M021', matchNum: 21, group: 'K', stage: 'group', matchday: 1, team1: 'Portugal', team2: 'Rep. Dem. Congo', date: '2026-06-17T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M022', matchNum: 22, group: 'L', stage: 'group', matchday: 1, team1: 'Inglaterra', team2: 'Croacia', date: '2026-06-17T15:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'M023', matchNum: 23, group: 'L', stage: 'group', matchday: 1, team1: 'Ghana', team2: 'Panamá', date: '2026-06-17T18:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M024', matchNum: 24, group: 'K', stage: 'group', matchday: 1, team1: 'Uzbekistán', team2: 'Colombia', date: '2026-06-17T21:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },

  // --- Jornada 2 ---
  // Jueves 18 de junio
  { id: 'M025', matchNum: 25, group: 'A', stage: 'group', matchday: 2, team1: 'República Checa', team2: 'Sudáfrica', date: '2026-06-18T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M026', matchNum: 26, group: 'B', stage: 'group', matchday: 2, team1: 'Suiza', team2: 'Bosnia-Herzegovina', date: '2026-06-18T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M027', matchNum: 27, group: 'B', stage: 'group', matchday: 2, team1: 'Canadá', team2: 'Catar', date: '2026-06-18T17:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  { id: 'M028', matchNum: 28, group: 'A', stage: 'group', matchday: 2, team1: 'México', team2: 'Corea del Sur', date: '2026-06-18T20:00:00-05:00', venue: 'Estadio Akron', city: 'Guadalajara' },
  // Viernes 19 de junio
  { id: 'M029', matchNum: 29, group: 'D', stage: 'group', matchday: 2, team1: 'Estados Unidos', team2: 'Australia', date: '2026-06-19T14:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  { id: 'M030', matchNum: 30, group: 'C', stage: 'group', matchday: 2, team1: 'Escocia', team2: 'Marruecos', date: '2026-06-19T17:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M031', matchNum: 31, group: 'C', stage: 'group', matchday: 2, team1: 'Brasil', team2: 'Haití', date: '2026-06-19T20:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M032', matchNum: 32, group: 'D', stage: 'group', matchday: 2, team1: 'Turquía', team2: 'Paraguay', date: '2026-06-19T22:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  // Sábado 20 de junio
  { id: 'M033', matchNum: 33, group: 'F', stage: 'group', matchday: 2, team1: 'Países Bajos', team2: 'Suecia', date: '2026-06-20T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M034', matchNum: 34, group: 'E', stage: 'group', matchday: 2, team1: 'Alemania', team2: 'Costa de Marfil', date: '2026-06-20T15:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M035', matchNum: 35, group: 'E', stage: 'group', matchday: 2, team1: 'Ecuador', team2: 'Curazao', date: '2026-06-20T19:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'M036', matchNum: 36, group: 'F', stage: 'group', matchday: 2, team1: 'Túnez', team2: 'Japón', date: '2026-06-20T23:00:00-05:00', venue: 'Estadio BBVA', city: 'Monterrey' },
  // Domingo 21 de junio
  { id: 'M037', matchNum: 37, group: 'H', stage: 'group', matchday: 2, team1: 'España', team2: 'Arabia Saudí', date: '2026-06-21T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'M038', matchNum: 38, group: 'G', stage: 'group', matchday: 2, team1: 'Bélgica', team2: 'Irán', date: '2026-06-21T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'M039', matchNum: 39, group: 'H', stage: 'group', matchday: 2, team1: 'Uruguay', team2: 'Cabo Verde', date: '2026-06-21T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'M040', matchNum: 40, group: 'G', stage: 'group', matchday: 2, team1: 'Nueva Zelanda', team2: 'Egipto', date: '2026-06-21T20:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  // Lunes 22 de junio
  { id: 'M041', matchNum: 41, group: 'J', stage: 'group', matchday: 2, team1: 'Argentina', team2: 'Austria', date: '2026-06-22T12:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'M042', matchNum: 42, group: 'I', stage: 'group', matchday: 2, team1: 'Francia', team2: 'Irak', date: '2026-06-22T16:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'M043', matchNum: 43, group: 'I', stage: 'group', matchday: 2, team1: 'Noruega', team2: 'Senegal', date: '2026-06-22T19:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'M044', matchNum: 44, group: 'J', stage: 'group', matchday: 2, team1: 'Jordania', team2: 'Argelia', date: '2026-06-22T22:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  // Martes 23 de junio
  { id: 'M045', matchNum: 45, group: 'K', stage: 'group', matchday: 2, team1: 'Portugal', team2: 'Uzbekistán', date: '2026-06-23T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  { id: 'M046', matchNum: 46, group: 'L', stage: 'group', matchday: 2, team1: 'Inglaterra', team2: 'Ghana', date: '2026-06-23T15:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'M047', matchNum: 47, group: 'L', stage: 'group', matchday: 2, team1: 'Panamá', team2: 'Croacia', date: '2026-06-23T18:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'M048', matchNum: 48, group: 'K', stage: 'group', matchday: 2, team1: 'Colombia', team2: 'Rep. Dem. Congo', date: '2026-06-23T21:00:00-05:00', venue: 'Estadio Akron', city: 'Guadalajara' },

  // --- Jornada 3 (partidos simultáneos dentro del mismo grupo) ---
  // Miércoles 24 de junio
  { id: 'M049', matchNum: 49, group: 'B', stage: 'group', matchday: 3, team1: 'Suiza', team2: 'Canadá', date: '2026-06-24T14:00:00-05:00', venue: 'BC Place', city: 'Vancouver', simultaneous: 'M050' },
  { id: 'M050', matchNum: 50, group: 'B', stage: 'group', matchday: 3, team1: 'Bosnia-Herzegovina', team2: 'Catar', date: '2026-06-24T14:00:00-05:00', venue: 'Lumen Field', city: 'Seattle', simultaneous: 'M049' },
  { id: 'M051', matchNum: 51, group: 'C', stage: 'group', matchday: 3, team1: 'Escocia', team2: 'Brasil', date: '2026-06-24T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami', simultaneous: 'M052' },
  { id: 'M052', matchNum: 52, group: 'C', stage: 'group', matchday: 3, team1: 'Marruecos', team2: 'Haití', date: '2026-06-24T17:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', simultaneous: 'M051' },
  { id: 'M053', matchNum: 53, group: 'A', stage: 'group', matchday: 3, team1: 'República Checa', team2: 'México', date: '2026-06-24T20:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México', simultaneous: 'M054' },
  { id: 'M054', matchNum: 54, group: 'A', stage: 'group', matchday: 3, team1: 'Sudáfrica', team2: 'Corea del Sur', date: '2026-06-24T20:00:00-05:00', venue: 'Estadio BBVA', city: 'Monterrey', simultaneous: 'M053' },
  // Jueves 25 de junio
  { id: 'M055', matchNum: 55, group: 'E', stage: 'group', matchday: 3, team1: 'Curazao', team2: 'Costa de Marfil', date: '2026-06-25T15:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia', simultaneous: 'M056' },
  { id: 'M056', matchNum: 56, group: 'E', stage: 'group', matchday: 3, team1: 'Ecuador', team2: 'Alemania', date: '2026-06-25T15:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford', simultaneous: 'M055' },
  { id: 'M057', matchNum: 57, group: 'F', stage: 'group', matchday: 3, team1: 'Japón', team2: 'Suecia', date: '2026-06-25T18:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas', simultaneous: 'M058' },
  { id: 'M058', matchNum: 58, group: 'F', stage: 'group', matchday: 3, team1: 'Túnez', team2: 'Países Bajos', date: '2026-06-25T18:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City', simultaneous: 'M057' },
  { id: 'M059', matchNum: 59, group: 'D', stage: 'group', matchday: 3, team1: 'Turquía', team2: 'Estados Unidos', date: '2026-06-25T21:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles', simultaneous: 'M060' },
  { id: 'M060', matchNum: 60, group: 'D', stage: 'group', matchday: 3, team1: 'Paraguay', team2: 'Australia', date: '2026-06-25T21:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara', simultaneous: 'M059' },
  // Viernes 26 de junio
  { id: 'M061', matchNum: 61, group: 'I', stage: 'group', matchday: 3, team1: 'Noruega', team2: 'Francia', date: '2026-06-26T14:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough', simultaneous: 'M062' },
  { id: 'M062', matchNum: 62, group: 'I', stage: 'group', matchday: 3, team1: 'Senegal', team2: 'Irak', date: '2026-06-26T14:00:00-05:00', venue: 'BMO Field', city: 'Toronto', simultaneous: 'M061' },
  { id: 'M063', matchNum: 63, group: 'H', stage: 'group', matchday: 3, team1: 'Cabo Verde', team2: 'Arabia Saudí', date: '2026-06-26T19:00:00-05:00', venue: 'NRG Stadium', city: 'Houston', simultaneous: 'M064' },
  { id: 'M064', matchNum: 64, group: 'H', stage: 'group', matchday: 3, team1: 'Uruguay', team2: 'España', date: '2026-06-26T19:00:00-05:00', venue: 'Estadio Akron', city: 'Guadalajara', simultaneous: 'M063' },
  { id: 'M065', matchNum: 65, group: 'G', stage: 'group', matchday: 3, team1: 'Egipto', team2: 'Irán', date: '2026-06-26T22:00:00-05:00', venue: 'Lumen Field', city: 'Seattle', simultaneous: 'M066' },
  { id: 'M066', matchNum: 66, group: 'G', stage: 'group', matchday: 3, team1: 'Nueva Zelanda', team2: 'Bélgica', date: '2026-06-26T22:00:00-05:00', venue: 'BC Place', city: 'Vancouver', simultaneous: 'M065' },
  // Sábado 27 de junio
  { id: 'M067', matchNum: 67, group: 'L', stage: 'group', matchday: 3, team1: 'Panamá', team2: 'Inglaterra', date: '2026-06-27T16:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford', simultaneous: 'M068' },
  { id: 'M068', matchNum: 68, group: 'L', stage: 'group', matchday: 3, team1: 'Croacia', team2: 'Ghana', date: '2026-06-27T16:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia', simultaneous: 'M067' },
  { id: 'M069', matchNum: 69, group: 'K', stage: 'group', matchday: 3, team1: 'Colombia', team2: 'Portugal', date: '2026-06-27T18:30:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami', simultaneous: 'M070' },
  { id: 'M070', matchNum: 70, group: 'K', stage: 'group', matchday: 3, team1: 'Rep. Dem. Congo', team2: 'Uzbekistán', date: '2026-06-27T18:30:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', simultaneous: 'M069' },
  { id: 'M071', matchNum: 71, group: 'J', stage: 'group', matchday: 3, team1: 'Argelia', team2: 'Austria', date: '2026-06-27T21:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City', simultaneous: 'M072' },
  { id: 'M072', matchNum: 72, group: 'J', stage: 'group', matchday: 3, team1: 'Jordania', team2: 'Argentina', date: '2026-06-27T21:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas', simultaneous: 'M071' },

  // ==================== RONDA DE 32 ====================
  // Domingo 28 de junio
  { id: 'R32_01', matchNum: 73, stage: 'r32', team1: 'Sudáfrica', team2: 'Canadá', date: '2026-06-28T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  // Lunes 29 de junio — hora Colombia: Brasil 12h · Alemania 15:30h · Países Bajos 20h
  { id: 'R32_02', matchNum: 74, stage: 'r32', team1: 'Alemania', team2: 'Paraguay', date: '2026-06-29T15:30:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'R32_03', matchNum: 75, stage: 'r32', team1: 'Países Bajos', team2: 'Marruecos', date: '2026-06-29T20:00:00-05:00', venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'R32_04', matchNum: 76, stage: 'r32', team1: 'Brasil', team2: 'Japón', date: '2026-06-29T12:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  // Martes 30 de junio — hora Colombia: Francia 12h · Costa de Marfil 16h · México 20h
  { id: 'R32_05', matchNum: 77, stage: 'r32', team1: 'Francia', team2: 'Suecia', date: '2026-06-30T12:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'R32_06', matchNum: 78, stage: 'r32', team1: 'Costa de Marfil', team2: 'Noruega', date: '2026-06-30T16:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'R32_07', matchNum: 79, stage: 'r32', team1: 'México', team2: 'Ecuador', date: '2026-06-30T20:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  // Miércoles 1 de julio — hora Colombia: Inglaterra 11h · Bélgica 15h · Estados Unidos 19h
  { id: 'R32_08', matchNum: 80, stage: 'r32', team1: 'Inglaterra', team2: 'Rep. Dem. Congo', date: '2026-07-01T11:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'R32_09', matchNum: 81, stage: 'r32', team1: 'Estados Unidos', team2: 'Bosnia-Herzegovina', date: '2026-07-01T19:00:00-05:00', venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'R32_10', matchNum: 82, stage: 'r32', team1: 'Bélgica', team2: 'Senegal', date: '2026-07-01T15:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  // Jueves 2 de julio — hora Colombia: España 14h · Portugal 18h · Suiza 22h
  { id: 'R32_11', matchNum: 83, stage: 'r32', team1: 'Portugal', team2: 'Croacia', date: '2026-07-02T18:00:00-05:00', venue: 'BMO Field', city: 'Toronto' },
  { id: 'R32_12', matchNum: 84, stage: 'r32', team1: 'España', team2: 'Austria', date: '2026-07-02T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { id: 'R32_13', matchNum: 85, stage: 'r32', team1: 'Suiza', team2: 'Irán', date: '2026-07-02T22:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },
  // Viernes 3 de julio — hora Colombia: Australia 13h · Argentina 17h · Colombia 20:30h
  { id: 'R32_14', matchNum: 86, stage: 'r32', team1: 'Argentina', team2: 'Cabo Verde', date: '2026-07-03T17:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'R32_15', matchNum: 87, stage: 'r32', team1: 'Colombia', team2: 'Ghana', date: '2026-07-03T20:30:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'R32_16', matchNum: 88, stage: 'r32', team1: 'Australia', team2: 'Egipto', date: '2026-07-03T13:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },

  // ==================== OCTAVOS DE FINAL ====================
  // Sábado 4 de julio
  { id: 'R16_01', matchNum: 89, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P74 vs G.P77', date: '2026-07-04T14:00:00-05:00', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { id: 'R16_02', matchNum: 90, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P73 vs G.P75', date: '2026-07-04T18:00:00-05:00', venue: 'NRG Stadium', city: 'Houston' },
  // Domingo 5 de julio
  { id: 'R16_03', matchNum: 91, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P76 vs G.P78', date: '2026-07-05T14:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { id: 'R16_04', matchNum: 92, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P79 vs G.P80', date: '2026-07-05T18:00:00-05:00', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  // Lunes 6 de julio
  { id: 'R16_05', matchNum: 93, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P83 vs G.P84', date: '2026-07-06T14:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  { id: 'R16_06', matchNum: 94, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P81 vs G.P82', date: '2026-07-06T18:00:00-05:00', venue: 'Lumen Field', city: 'Seattle' },
  // Martes 7 de julio
  { id: 'R16_07', matchNum: 95, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P86 vs G.P88', date: '2026-07-07T14:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'R16_08', matchNum: 96, stage: 'r16', team1: 'Por definir', team2: 'Por definir', label: 'G.P85 vs G.P87', date: '2026-07-07T18:00:00-05:00', venue: 'BC Place', city: 'Vancouver' },

  // ==================== CUARTOS DE FINAL ====================
  // Jueves 9 de julio
  { id: 'QF_01', matchNum: 97, stage: 'qf', team1: 'Por definir', team2: 'Por definir', label: 'G.P89 vs G.P90', date: '2026-07-09T14:00:00-05:00', venue: 'Gillette Stadium', city: 'Foxborough' },
  // Viernes 10 de julio
  { id: 'QF_02', matchNum: 98, stage: 'qf', team1: 'Por definir', team2: 'Por definir', label: 'G.P93 vs G.P94', date: '2026-07-10T14:00:00-05:00', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  // Sábado 11 de julio
  { id: 'QF_03', matchNum: 99, stage: 'qf', team1: 'Por definir', team2: 'Por definir', label: 'G.P91 vs G.P92', date: '2026-07-11T14:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'QF_04', matchNum: 100, stage: 'qf', team1: 'Por definir', team2: 'Por definir', label: 'G.P95 vs G.P96', date: '2026-07-11T18:00:00-05:00', venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // ==================== SEMIFINALES ====================
  // Martes 14 de julio
  { id: 'SF_01', matchNum: 101, stage: 'sf', team1: 'Por definir', team2: 'Por definir', label: 'G.P97 vs G.P98', date: '2026-07-14T14:00:00-05:00', venue: 'AT&T Stadium', city: 'Dallas' },
  // Miércoles 15 de julio
  { id: 'SF_02', matchNum: 102, stage: 'sf', team1: 'Por definir', team2: 'Por definir', label: 'G.P99 vs G.P100', date: '2026-07-15T14:00:00-05:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // ==================== TERCER PUESTO ====================
  // Sábado 18 de julio
  { id: '3RD', matchNum: 103, stage: '3rd', team1: 'Por definir', team2: 'Por definir', label: 'P.P101 vs P.P102', date: '2026-07-18T14:00:00-05:00', venue: 'Hard Rock Stadium', city: 'Miami' },

  // ==================== FINAL ====================
  // Domingo 19 de julio
  { id: 'FINAL', matchNum: 104, stage: 'final', team1: 'Por definir', team2: 'Por definir', label: 'G.P101 vs G.P102', date: '2026-07-19T14:00:00-05:00', venue: 'MetLife Stadium', city: 'East Rutherford' },
]

export const STAGE_NAMES = {
  group: 'Fase de Grupos',
  r32: 'Ronda de 32',
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

// Retorna los partidos de la "fecha activa" del torneo y el numero de fecha.
// La fecha cambia ~2 horas antes del primer partido del dia siguiente.
export function getActiveDateMatches() {
  const now = Date.now()
  const TWO_HOURS = 2 * 60 * 60 * 1000

  // Agrupar partidos por fecha calendario (zona Colombia)
  const dateGroups = {}
  for (const match of MATCHES) {
    const d = new Date(match.date)
    const colombiaDate = d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    if (!dateGroups[colombiaDate]) dateGroups[colombiaDate] = []
    dateGroups[colombiaDate].push(match)
  }

  const sortedDates = Object.keys(dateGroups).sort()

  // Fecha activa: la ultima cuyo primer partido esta a ≤2h de empezar o ya empezo
  let activeDate = null
  let activeDateIndex = 0
  for (let i = 0; i < sortedDates.length; i++) {
    const firstMatchTime = Math.min(...dateGroups[sortedDates[i]].map(m => new Date(m.date).getTime()))
    if (now >= firstMatchTime - TWO_HOURS) {
      activeDate = sortedDates[i]
      activeDateIndex = i
    } else {
      break
    }
  }

  // Si nada califica, usar la primera fecha del torneo
  if (!activeDate) {
    activeDate = sortedDates[0] || null
    activeDateIndex = 0
  }
  if (!activeDate) return { matches: [], fechaNumber: 0 }

  return {
    matches: dateGroups[activeDate].sort((a, b) => new Date(a.date) - new Date(b.date)),
    fechaNumber: activeDateIndex + 1,
  }
}
