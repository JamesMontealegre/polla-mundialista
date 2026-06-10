import { useState } from 'react'

export default function GameRules() {
  const [showRules, setShowRules] = useState(false)

  return (
    <div>
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full bg-gray-900 rounded-2xl border border-gray-700 p-4 flex items-center justify-between hover:border-wc-gold transition-colors"
      >
        <span className="text-white font-bold text-sm">Reglas del juego</span>
        <span
          className={`text-gray-400 transition-transform duration-200 ${
            showRules ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>

      {showRules && (
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 mt-2 text-left space-y-5">
          {/* Puntos */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Puntuacion
            </div>
            <div className="space-y-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold w-14 text-right">
                  +3 pts
                </span>
                <span>Marcador exacto (ej: 2-1 y sale 2-1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold w-14 text-right">
                  +1 pt
                </span>
                <span>Acertar ganador o empate sin marcador exacto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold w-14 text-right">
                  0 pts
                </span>
                <span>No acertar resultado</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700" />

          {/* Desempate */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Criterios de desempate
            </div>
            <ol className="space-y-1 text-sm text-gray-300 list-decimal list-inside">
              <li>Mayor cantidad de marcadores exactos</li>
              <li>Mayor cantidad de resultados acertados</li>
              <li>Quien hizo sus predicciones primero (anticipacion)</li>
            </ol>
          </div>

          <div className="border-t border-gray-700" />

          {/* Cuota y premios */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Cuota y premios
            </div>
            <div className="space-y-1.5 text-sm text-gray-300">
              <div>
                Inscripcion:{" "}
                <span className="text-white font-bold">$30.000 COP</span> por
                participante
              </div>
              <div className="pl-4 text-xs text-gray-400">
                $25.000 van al pozo de premios
              </div>
              <div className="pl-4 text-xs text-gray-400">
                $5.000 uso de la aplicacion
              </div>
              <div className="mt-2">Distribucion del pozo:</div>
              <div className="pl-4 text-xs text-gray-400">
                1er lugar: 50% · 2do lugar: 30% · 3er lugar: 20%
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700" />

          {/* Pago */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Pago para habilitarse
            </div>
            <p className="text-sm text-gray-300">
              Debes pagar la cuota por Nequi y subir el comprobante dentro de
              la app. El administrador del grupo revisara y confirmara tu pago
              para habilitarte a predecir.
            </p>
          </div>

          <div className="border-t border-gray-700" />

          {/* Celular */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Registro de celular
            </div>
            <p className="text-sm text-gray-300">
              Una vez dentro de la app, registra tu numero de celular en tu
              perfil. Es obligatorio para recibir el pago de premios si ganas.
            </p>
          </div>

          <div className="border-t border-gray-700" />

          {/* Flexibilidad */}
          <div>
            <div className="text-wc-gold font-bold text-sm mb-2">
              Predicciones flexibles
            </div>
            <p className="text-sm text-gray-300">
              No necesitas llenar todos los partidos de una vez. Tienes hasta
              5 minutos antes del inicio de cada partido para hacer o cambiar
              tu pronostico.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
