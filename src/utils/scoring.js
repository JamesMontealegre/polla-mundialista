// Sistema de puntuación de la Polla Mundialista
// +0.5 si acierta el ganador (o empate)
// +0.5 si acierta el resultado exacto
// Máximo 1 punto por partido

/**
 * Calcula los puntos de una predicción dado el resultado real
 * @param {Object} prediction - { team1Goals: number, team2Goals: number }
 * @param {Object} result - { team1Goals: number, team2Goals: number }
 * @returns {{ points: number, correctWinner: boolean, correctScore: boolean }}
 */
export function calculatePoints(prediction, result) {
  if (
    prediction.team1Goals === null || prediction.team1Goals === undefined ||
    prediction.team2Goals === null || prediction.team2Goals === undefined ||
    result.team1Goals === null || result.team1Goals === undefined ||
    result.team2Goals === null || result.team2Goals === undefined
  ) {
    return { points: 0, correctWinner: false, correctScore: false }
  }

  const predOutcome = getOutcome(prediction.team1Goals, prediction.team2Goals)
  const realOutcome = getOutcome(result.team1Goals, result.team2Goals)

  const correctWinner = predOutcome === realOutcome
  const correctScore =
    prediction.team1Goals === result.team1Goals &&
    prediction.team2Goals === result.team2Goals

  let points = 0
  if (correctWinner) points += 0.5
  if (correctScore) points += 0.5

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
      { team1Goals: pred.team1Goals, team2Goals: pred.team2Goals },
      { team1Goals: result.team1Goals, team2Goals: result.team2Goals }
    )

    totalPoints += points
    if (correctWinner) correctWinners++
    if (correctScore) correctScores++
  }

  return { totalPoints, correctWinners, correctScores }
}
