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
            <span>Marcador exacto (ej.: pronosticas 2-1 y el resultado es 2-1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold font-mono w-16 text-right shrink-0">
              +1 pt
            </span>
            <span>Acertar ganador o empate sin marcador exacto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold font-mono w-16 text-right shrink-0">
              0 pts
            </span>
            <span>No acertar el resultado</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Si apuestas por marcador y no aciertas el marcador exacto, pero el equipo
          que elegiste como ganador efectivamente gana, sumas +1 punto. Tu pronóstico
          se contabiliza como resultado acertado, no como marcador exacto.
        </p>
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Columnas de la tabla</p>
          <div className="flex items-start gap-2">
            <span className="text-white font-bold font-mono w-8 shrink-0">PG</span>
            <span className="text-gray-300">Partidos ganados — número de veces que acertaste el ganador o el empate.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 font-bold font-mono w-8 shrink-0">PE</span>
            <span className="text-gray-300">Partidos exactos — veces que acertaste el marcador exacto (+3 pts cada uno).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 font-bold font-mono w-8 shrink-0">NP</span>
            <span className="text-gray-300">No participación — partidos terminados en los que no dejaste ningún pronóstico.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-bold font-mono w-8 shrink-0">AN</span>
            <span className="text-gray-300">Anticipación — veces que fuiste el primero en acertar el resultado de un partido (+1 pt cada vez).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-wc-gold font-bold font-mono w-8 shrink-0">P</span>
            <span className="text-gray-300">Puntos totales acumulados en la polla.</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Tipos de pronóstico */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Tipos de pronóstico
        </div>
        <div className="text-sm text-gray-300 space-y-1.5">
          <p>
            Para cada partido puedes elegir <span className="text-white font-semibold">un solo criterio</span> de
            pronóstico:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>
              <span className="text-white font-semibold">Marcador exacto:</span> indicas
              el resultado con goles (ej.: 2-1). Si aciertas sumas +3, si fallas el
              marcador pero aciertas el ganador sumas +1.
            </li>
            <li>
              <span className="text-white font-semibold">Solo resultado:</span> eliges
              únicamente quién gana o si hay empate. El máximo que puedes sumar es +1.
            </li>
          </ul>
          <p className="text-xs text-gray-400 mt-1">
            No es necesario marcar ambos criterios; elige el que prefieras para cada partido.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Predicciones flexibles */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Predicciones flexibles
        </div>
        <p className="text-sm text-gray-300">
          No necesitas realizar todos los pronósticos de una vez. Puedes hacer
          o cambiar tu pronóstico en cualquier momento, siempre y cuando lo hagas
          antes de que el partido comience. La opción de predecir desaparece
          5 minutos antes del inicio del encuentro y, una vez agotado el tiempo,
          la predicción se bloquea automáticamente.
        </p>
      </div>

      <div className="border-t border-gray-700" />

      {/* Anticipación */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          Anticipación
        </div>
        <p className="text-sm text-gray-300">
          Por cada partido, la persona que haya acertado el resultado y lo haya
          pronosticado primero (según la fecha y hora del pronóstico) recibe
          <span className="text-blue-400 font-semibold"> +1 punto de anticipación</span>.
          Solo una persona por partido puede obtener este punto. Si nadie acierta,
          el punto no se otorga. La anticipación se refleja en la pestaña
          «Tabla» y sirve como criterio de desempate.
        </p>
      </div>

      <div className="border-t border-gray-700" />

      {/* No participación */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-2">
          No participación
        </div>
        <p className="text-sm text-gray-300">
          Si un partido finaliza y no registraste ningún pronóstico, se te suma
          <span className="text-red-400 font-semibold"> +1 de no participación (NP)</span>.
          Este indicador es importante: ante un empate en puntos, el participante
          con menor cantidad de partidos sin pronosticar tendrá ventaja sobre
          quien tenga más ausencias. Mantente al día con tus pronósticos para
          no perder posiciones.
        </p>
      </div>

      <div className="border-t border-gray-700" />

      {/* Puntos extra */}
      <div>
        <div className="text-wc-gold font-bold text-sm mb-3">
          Puntos extra
        </div>
        <div className="space-y-3">
          {/* Subtítulo: Predicción de la final */}
          <div>
            <div className="text-white font-semibold text-sm mb-1.5">
              Predicción de la final
            </div>
            <div className="text-sm text-gray-300 space-y-1.5">
              <p>
                En la pestaña <span className="text-white font-semibold">«Puntos extra»</span> puedes
                seleccionar los dos equipos que crees que llegarán a la final del Mundial.
                Si aciertas ambos finalistas, sumarás puntos bonus al final de la polla.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-bold font-mono w-16 text-right shrink-0">
                  +15 pts
                </span>
                <span>Acertar los dos finalistas (sin importar el orden)</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                La participación es opcional. Las predicciones de finalistas se cierran el
                28 de junio a las 12:00 AM y se revelan al iniciar los dieciseisavos de final.
                Este bonus es independiente del pronóstico regular del partido final.
              </p>
            </div>
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
          <li>Menor cantidad de partidos sin participar</li>
          <li>Mayor cantidad de puntos de anticipación</li>
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
    </div>
  )
}
