export default function GameRules({ isPaid = true }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 text-left space-y-5">
      {/* Puntuación */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Puntuación
        </div>
        <div className="space-y-1.5 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold font-mono w-16 text-right shrink-0">
              +3 pts
            </span>
            <span>Marcador exacto (ej.: 2-1 y sale 2-1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold font-mono w-16 text-right shrink-0">
              +1 pts
            </span>
            <span>Acertar ganador o empate sin marcador exacto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold font-mono w-16 text-right shrink-0">
              0 pts
            </span>
            <span>No acertar resultado</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Criterios de desempate */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Criterios de desempate
        </div>
        <ol className="space-y-1 text-sm text-gray-300 list-decimal list-inside">
          <li>Mayor cantidad de marcadores exactos</li>
          <li>Mayor cantidad de resultados acertados</li>
          <li>Quien hizo sus predicciones primero (anticipación)</li>
        </ol>
      </div>

      <div className="border-t border-gray-700" />

      {/* Cuota y premios (pago) / Premios (gratuito) */}
      {isPaid ? (
        <div>
          <div className="text-wc-gold font-bold text-sm mb-2">
            Cuota y premios
          </div>
          <div className="space-y-1.5 text-sm text-gray-300">
            <div>
              Inscripción:{" "}
              <span className="text-white font-bold">$30.000 COP</span> por
              participante
            </div>
            <div className="pl-4 text-xs text-gray-400">
              $25.000 van al pozo de premios
            </div>
            <div className="pl-4 text-xs text-gray-400">
              $5.000 uso de la aplicación
            </div>
            <div className="mt-2">Distribución del pozo:</div>
            <div className="pl-4 text-xs text-gray-400">
              1.er lugar: 50% · 2.do lugar: 30% · 3.er lugar: 20%
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-wc-gold font-bold text-sm mb-2">
            Premios
          </div>
          <p className="text-sm text-gray-300">
            Este grupo tiene fines recreativos y de entretenimiento.
            Los premios, reconocimientos o incentivos quedan a
            consideración de la persona organizadora. Lo importante
            es disfrutar del Mundial y competir sanamente con amigos
            y familiares.
          </p>
        </div>
      )}

      {/* Pago (solo grupos de pago) */}
      {isPaid && (
        <>
          <div className="border-t border-gray-700" />
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Pago para habilitarse
            </div>
            <p className="text-sm text-gray-300">
              Debes pagar la cuota por Nequi y subir el comprobante dentro de
              la aplicación. El administrador del grupo revisará y confirmará
              tu pago para habilitarte a predecir.
            </p>
          </div>
        </>
      )}

      {isPaid && (
        <>
          <div className="border-t border-gray-700" />

          {/* Celular */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Registro de celular
            </div>
            <p className="text-sm text-gray-300">
              Una vez dentro de la aplicación, registra tu número de celular
              en tu perfil. Es obligatorio para recibir el pago de premios
              si ganas.
            </p>
          </div>
        </>
      )}

      <div className="border-t border-gray-700" />

      {/* Predicciones flexibles */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Predicciones flexibles
        </div>
        <p className="text-sm text-gray-300">
          No necesitas llenar todos los partidos de una vez. Puedes hacer
          o cambiar tu pronóstico en cualquier momento, pero las predicciones
          se cierran 5 minutos antes del inicio de cada partido. Verás un
          contador regresivo cuando se acerque el cierre. Una vez agotado
          el tiempo, la predicción se bloquea automáticamente.
        </p>
      </div>
    </div>
  )
}
