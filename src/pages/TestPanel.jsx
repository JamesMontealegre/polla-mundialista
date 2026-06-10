import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePoints } from '../utils/scoring'
import { FLAGS, ALL_TEAMS, STAGE_NAMES } from '../data/matches'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'

// Escenarios de prueba para validar scoring
const SCORING_TESTS = [
  {
    label: 'Marcador exacto',
    prediction: { predictionType: 'score', team1Goals: 2, team2Goals: 1 },
    result: { team1Goals: 2, team2Goals: 1 },
    expected: 3,
  },
  {
    label: 'Marcador exacto 0-0',
    prediction: { predictionType: 'score', team1Goals: 0, team2Goals: 0 },
    result: { team1Goals: 0, team2Goals: 0 },
    expected: 3,
  },
  {
    label: 'Acierta ganador, marcador distinto',
    prediction: { predictionType: 'score', team1Goals: 3, team2Goals: 0 },
    result: { team1Goals: 1, team2Goals: 0 },
    expected: 1,
  },
  {
    label: 'Acierta empate, marcador distinto',
    prediction: { predictionType: 'score', team1Goals: 1, team2Goals: 1 },
    result: { team1Goals: 0, team2Goals: 0 },
    expected: 1,
  },
  {
    label: 'Falla todo (predice local, gana visitante)',
    prediction: { predictionType: 'score', team1Goals: 2, team2Goals: 0 },
    result: { team1Goals: 0, team2Goals: 1 },
    expected: 0,
  },
  {
    label: 'Falla todo (predice empate, gana local)',
    prediction: { predictionType: 'score', team1Goals: 1, team2Goals: 1 },
    result: { team1Goals: 3, team2Goals: 0 },
    expected: 0,
  },
  {
    label: 'Solo resultado: acierta ganador',
    prediction: { predictionType: 'outcome', outcome: 'team1' },
    result: { team1Goals: 2, team2Goals: 1 },
    expected: 1,
  },
  {
    label: 'Solo resultado: acierta empate',
    prediction: { predictionType: 'outcome', outcome: 'draw' },
    result: { team1Goals: 1, team2Goals: 1 },
    expected: 1,
  },
  {
    label: 'Solo resultado: falla',
    prediction: { predictionType: 'outcome', outcome: 'team2' },
    result: { team1Goals: 3, team2Goals: 0 },
    expected: 0,
  },
  {
    label: 'Goleada exacta',
    prediction: { predictionType: 'score', team1Goals: 5, team2Goals: 0 },
    result: { team1Goals: 5, team2Goals: 0 },
    expected: 3,
  },
]

// Partido simulado para probar componentes
function createTestMatch(minutesFromNow) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000)
  return {
    id: 'test-match',
    team1: 'Colombia',
    team2: 'Brasil',
    date: date.toISOString(),
    city: 'Ciudad de prueba',
    stage: 'group',
    group: 'D',
    matchday: 1,
  }
}

function TeamAssignmentTest() {
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [assignedMatch, setAssignedMatch] = useState(null)

  const knockoutStages = ['r32', 'r16', 'qf', 'sf', '3rd', 'final']
  const [testStage, setTestStage] = useState('r32')

  const testMatch = useMemo(() => {
    const date = new Date(Date.now() + 60 * 60 * 1000)
    return {
      id: 'test-knockout',
      team1: team1 || 'Por definir',
      team2: team2 || 'Por definir',
      date: date.toISOString(),
      city: 'Ciudad de prueba',
      stage: testStage,
      matchNum: 73,
    }
  }, [team1, team2, testStage])

  // Validation tests
  const validationResults = useMemo(() => {
    const tests = [
      {
        label: 'ALL_TEAMS contiene 48 selecciones',
        passed: ALL_TEAMS.length === 48,
        detail: `${ALL_TEAMS.length} equipos encontrados`,
      },
      {
        label: 'Todos los equipos tienen bandera',
        passed: ALL_TEAMS.every(t => FLAGS[t] != null),
        detail: ALL_TEAMS.filter(t => !FLAGS[t]).join(', ') || 'Todas asignadas',
      },
      {
        label: 'No hay equipos duplicados',
        passed: new Set(ALL_TEAMS).size === ALL_TEAMS.length,
        detail: `${new Set(ALL_TEAMS).size} únicos de ${ALL_TEAMS.length}`,
      },
      {
        label: 'Equipos ordenados alfabéticamente (es)',
        passed: ALL_TEAMS.every((t, i) => i === 0 || t.localeCompare(ALL_TEAMS[i - 1], 'es') >= 0),
        detail: ALL_TEAMS.slice(0, 3).join(', ') + '...',
      },
      {
        label: 'STAGE_NAMES contiene Ronda de 32',
        passed: STAGE_NAMES.r32 === 'Ronda de 32',
        detail: `r32 = "${STAGE_NAMES.r32}"`,
      },
    ]
    return tests
  }, [])

  const allPassed = validationResults.every(t => t.passed)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">4. Asignacion de Equipos (Knockout)</h2>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          allPassed ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {allPassed ? `✅ ${validationResults.length}/${validationResults.length} OK` : `❌`}
        </span>
      </div>

      {/* Automated validations */}
      <div className="space-y-2 mb-6">
        {validationResults.map((test, i) => (
          <div
            key={i}
            className={`bg-gray-900 rounded-lg border p-3 flex items-center justify-between gap-3 ${
              test.passed ? 'border-green-800' : 'border-red-700'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold">{test.label}</div>
              <div className="text-gray-400 text-xs mt-0.5">{test.detail}</div>
            </div>
            <div className={`text-sm font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
              {test.passed ? '✅' : '❌'}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive team selector test */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-4">
        <h3 className="text-white font-bold text-sm">Simulador de asignacion</h3>
        <p className="text-gray-400 text-xs">
          Selecciona equipos de la lista para simular la asignacion de un partido eliminatorio.
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {knockoutStages.map(s => (
            <button
              key={s}
              onClick={() => setTestStage(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                testStage === s ? 'bg-wc-gold text-wc-dark' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {STAGE_NAMES[s]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Equipo 1</label>
            <select
              value={team1}
              onChange={e => setTeam1(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
            >
              <option value="">Por definir</option>
              {ALL_TEAMS.map(t => (
                <option key={t} value={t}>{FLAGS[t]} {t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Equipo 2</label>
            <select
              value={team2}
              onChange={e => setTeam2(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
            >
              <option value="">Por definir</option>
              {ALL_TEAMS.filter(t => t !== team1).map(t => (
                <option key={t} value={t}>{FLAGS[t]} {t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h4 className="text-gray-400 text-xs mb-2 font-semibold uppercase">Preview de la card:</h4>
          <div className="max-w-sm">
            <MatchCard
              match={testMatch}
              prediction={null}
              onPredict={team1 && team2 ? () => {} : null}
              onReset={() => {}}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• El boton "Predecir" solo aparece cuando ambos equipos estan asignados.</p>
          <p>• El selector del admin filtra el equipo ya seleccionado como rival.</p>
          <p>• Las banderas se muestran automaticamente basadas en el nombre del equipo.</p>
        </div>
      </div>
    </section>
  )
}

export default function TestPanel() {
  const navigate = useNavigate()
  const [countdownMinutes, setCountdownMinutes] = useState(3)
  const [simPrediction, setSimPrediction] = useState(null)
  const [simResult, setSimResult] = useState({ team1Goals: '', team2Goals: '' })
  const [showPredModal, setShowPredModal] = useState(false)

  // Ejecutar tests de scoring
  const testResults = useMemo(() => {
    return SCORING_TESTS.map(test => {
      const result = calculatePoints(test.prediction, test.result)
      return {
        ...test,
        actual: result.points,
        passed: result.points === test.expected,
        details: result,
      }
    })
  }, [])

  const allPassed = testResults.every(t => t.passed)
  const passedCount = testResults.filter(t => t.passed).length

  // Partido simulado para countdown
  const countdownMatch = useMemo(() => createTestMatch(countdownMinutes), [countdownMinutes])

  // Partido simulado para scoring visual
  const scoringMatch = useMemo(() => {
    const m = createTestMatch(60)
    if (simResult.team1Goals !== '' && simResult.team2Goals !== '') {
      return { ...m, team1Goals: Number(simResult.team1Goals), team2Goals: Number(simResult.team2Goals) }
    }
    return m
  }, [simResult])

  const formatPred = (pred) => {
    if (pred.predictionType === 'outcome') {
      const labels = { team1: 'Gana Local', team2: 'Gana Visitante', draw: 'Empate' }
      return labels[pred.outcome] || '?'
    }
    return `${pred.team1Goals}-${pred.team2Goals}`
  }

  return (
    <div className="min-h-screen bg-wc-dark">
      {/* Header */}
      <div className="bg-gray-900 border-b border-blue-700 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-blue-400 font-black text-xl">🧪 Panel de Pruebas</h1>
            <p className="text-gray-400 text-xs mt-0.5">Valida scoring, countdown y componentes</p>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-400 text-sm hover:text-white">← Inicio</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* 1. SCORING TESTS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">1. Validacion de Scoring</h2>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              allPassed ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {allPassed ? `✅ ${passedCount}/${testResults.length} OK` : `❌ ${passedCount}/${testResults.length}`}
            </span>
          </div>

          <div className="space-y-2">
            {testResults.map((test, i) => (
              <div
                key={i}
                className={`bg-gray-900 rounded-lg border p-3 flex items-center justify-between gap-3 ${
                  test.passed ? 'border-green-800' : 'border-red-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold">{test.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    Pred: {formatPred(test.prediction)}
                    {' · '}
                    Real: {test.result.team1Goals}-{test.result.team2Goals}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {test.passed ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {test.actual}pts {!test.passed && `(esperado: ${test.expected})`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. COUNTDOWN TEST */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">2. Prueba de Countdown</h2>
          <p className="text-gray-400 text-xs mb-3">
            Simula un partido que inicia en X minutos. El countdown aparece cuando faltan menos de 5 min para el cierre de predicciones (cierre = 5 min antes del partido, o sea 10 min antes si pones 7 min).
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-gray-300 text-sm">Partido inicia en:</label>
            <input
              type="number"
              min="1"
              max="30"
              value={countdownMinutes}
              onChange={e => setCountdownMinutes(Number(e.target.value))}
              className="w-20 text-center bg-gray-800 text-wc-gold rounded-lg py-1.5 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            />
            <span className="text-gray-400 text-sm">minutos</span>
          </div>
          <div className="max-w-sm">
            <MatchCard
              match={countdownMatch}
              prediction={null}
              onPredict={() => {}}
              onReset={() => {}}
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Tip: Pon 7 min para ver el countdown (cierre en 2 min). Pon 4 min para ver "Partido en curso" (ya paso el cierre).
          </p>
        </section>

        {/* 3. PREDICTION + SCORING VISUAL */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">3. Simulador de Prediccion + Resultado</h2>
          <p className="text-gray-400 text-xs mb-4">
            Haz una prediccion y luego ingresa un resultado para ver como se muestra en la card.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Prediction controls */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-3">
              <h3 className="text-white font-bold text-sm">Tu prediccion</h3>
              {simPrediction ? (
                <div className="space-y-2">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-wc-gold font-bold text-lg">
                      {formatPred(simPrediction)}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      Tipo: {simPrediction.predictionType === 'score' ? 'Marcador' : 'Solo resultado'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPredModal(true)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-wc-green text-white"
                    >
                      Cambiar
                    </button>
                    <button
                      onClick={() => setSimPrediction(null)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-gray-600 text-gray-400"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPredModal(true)}
                  className="w-full py-2 rounded-lg text-sm font-semibold bg-wc-gold text-wc-dark"
                >
                  Hacer prediccion
                </button>
              )}
            </div>

            {/* Result controls */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-3">
              <h3 className="text-white font-bold text-sm">Resultado real (simulado)</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-300 mb-1">{FLAGS['Colombia']} COL</div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={simResult.team1Goals}
                    onChange={e => setSimResult(prev => ({ ...prev, team1Goals: e.target.value }))}
                    className="w-full text-center text-xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="-"
                  />
                </div>
                <span className="text-gray-500 font-bold text-xl">-</span>
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-300 mb-1">{FLAGS['Brasil']} BRA</div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={simResult.team2Goals}
                    onChange={e => setSimResult(prev => ({ ...prev, team2Goals: e.target.value }))}
                    className="w-full text-center text-xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="-"
                  />
                </div>
              </div>
              <button
                onClick={() => setSimResult({ team1Goals: '', team2Goals: '' })}
                className="w-full py-1.5 rounded-lg text-xs font-semibold border border-gray-600 text-gray-400"
              >
                Limpiar resultado
              </button>
            </div>
          </div>

          {/* Preview card */}
          <div className="mt-4">
            <h3 className="text-gray-400 text-xs mb-2 font-semibold uppercase">Preview de la card:</h3>
            <div className="max-w-sm">
              <MatchCard
                match={scoringMatch}
                prediction={simPrediction}
                onPredict={() => setShowPredModal(true)}
                onReset={() => setSimPrediction(null)}
              />
            </div>
          </div>

          {/* Points breakdown */}
          {simPrediction && simResult.team1Goals !== '' && simResult.team2Goals !== '' && (
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-700 p-4">
              <h3 className="text-white font-bold text-sm mb-2">Desglose de puntos</h3>
              {(() => {
                const r = calculatePoints(simPrediction, {
                  team1Goals: Number(simResult.team1Goals),
                  team2Goals: Number(simResult.team2Goals),
                })
                return (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resultado correcto (gana/pierde/empata):</span>
                      <span className={r.correctWinner ? 'text-green-400 font-bold' : 'text-red-400'}>
                        {r.correctWinner ? 'Si' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Marcador exacto:</span>
                      <span className={r.correctScore ? 'text-green-400 font-bold' : 'text-red-400'}>
                        {r.correctScore ? 'Si' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                      <span className="text-white font-bold">Total:</span>
                      <span className={`font-black text-lg ${
                        r.points >= 3 ? 'text-green-400' : r.points >= 1 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {r.points} pts
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </section>

        {/* 4. TEAM ASSIGNMENT TEST */}
        <TeamAssignmentTest />

        {/* 5. RULES REFERENCE */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">5. Reglas de Puntuacion</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Marcador exacto</span>
              <span className="text-wc-gold font-bold">3 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Acierta gana/pierde/empata (sin marcador exacto)</span>
              <span className="text-wc-gold font-bold">1 pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Prediccion "Solo resultado" correcta</span>
              <span className="text-wc-gold font-bold">1 pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Falla prediccion</span>
              <span className="text-red-400 font-bold">0 pts</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 text-xs text-gray-500">
              Nota: Los puntos NO son acumulativos. Marcador exacto = 3 pts (no 3+1=4).
            </div>
          </div>
        </section>
      </div>

      {/* Prediction Modal for simulation */}
      {showPredModal && (
        <PredictionModal
          match={scoringMatch}
          existing={simPrediction}
          onSave={(pred) => { setSimPrediction(pred); return Promise.resolve() }}
          onClose={() => setShowPredModal(false)}
        />
      )}
    </div>
  )
}
