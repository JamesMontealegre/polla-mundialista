// Sistema de puntuación de la Polla Mundialista
// Marcador exacto: 3 puntos
// Acertar ganador/empate (sin marcador exacto): 1 punto
// Predicción solo resultado: máximo 1 punto

/**
 * Calcula los puntos de una predicción dado el resultado real
 * @param {Object} prediction - { predictionType?: 'score'|'outcome', team1Goals?, team2Goals?, outcome? }
 * @param {Object} result - { team1Goals: number, team2Goals: number }
 * @returns {{ points: number, correctWinner: boolean, correctScore: boolean }}
 */
export function calculatePoints(prediction, result) {
  if (
    result.team1Goals === null || result.team1Goals === undefined ||
    result.team2Goals === null || result.team2Goals === undefined
  ) {
    return { points: 0, correctWinner: false, correctScore: false }
  }

  const realOutcome = getOutcome(result.team1Goals, result.team2Goals)
  const predType = prediction.predictionType || 'score'

  // Predicción solo resultado
  if (predType === 'outcome') {
    const correctWinner = prediction.outcome === realOutcome
    return { points: correctWinner ? 1 : 0, correctWinner, correctScore: false }
  }

  // Predicción de marcador
  if (
    prediction.team1Goals === null || prediction.team1Goals === undefined ||
    prediction.team2Goals === null || prediction.team2Goals === undefined
  ) {
    return { points: 0, correctWinner: false, correctScore: false }
  }

  const predOutcome = getOutcome(prediction.team1Goals, prediction.team2Goals)

  const correctWinner = predOutcome === realOutcome
  const correctScore =
    prediction.team1Goals === result.team1Goals &&
    prediction.team2Goals === result.team2Goals

  let points = 0
  if (correctScore) points = 3
  else if (correctWinner) points = 1

  return { points, correctWinner, correctScore }
}

/**
 * Devuelve el resultado del partido: 'team1' | 'draw' | 'team2'
 */
export function getOutcome(team1Goals, team2Goals) {
  if (team1Goals > team2Goals) return 'team1'
  if (team2Goals > team1Goals) return 'team2'
  return 'draw'
}

/**
 * Recalcula el marcador total de un usuario en un grupo
 * @param {Array} predictions - Lista de predicciones del usuario
 * @param {Object} matchResults - Mapa matchId → { team1Goals, team2Goals, isFinished }
 * @returns {{ totalPoints: number, correctWinners: number, correctScores: number }}
 */
export function calculateTotalScore(predictions, matchResults) {
  let totalPoints = 0
  let correctWinners = 0
  let correctScores = 0

  for (const pred of predictions) {
    const result = matchResults[pred.matchId]
    if (!result || !result.isFinished) continue

    const { points, correctWinner, correctScore } = calculatePoints(
      pred,
      { team1Goals: result.team1Goals, team2Goals: result.team2Goals }
    )

    totalPoints += points
    if (correctWinner) correctWinners++
    if (correctScore) correctScores++
  }

  return { totalPoints, correctWinners, correctScores }
}
