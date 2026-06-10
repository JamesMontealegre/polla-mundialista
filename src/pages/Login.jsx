import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { user, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-wc-dark flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-wc-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-wc-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-sm w-full">
        {/* Logo */}
        <img
          src="/assets/2026_FIFA_World_Cup_emblem_(without_trophy).svg.png"
          alt="Polla Mundialista 2026"
          className="w-60 h-60 mx-auto mb-4 object-contain"
        />

        {/* Title */}
        <h1 className="text-4xl font-black text-white mb-1">POLLA</h1>
        <h2 className="text-3xl font-black text-wc-gold mb-2">
          MUNDIALISTA 2026
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          Predice, compite y demuestra que sabes de futbol
        </p>
        <div className="text-4xl mb-8 -mt-4 flex justify-center gap-2">
          <span>🇺🇸</span>
          <span>🇨🇦</span>
          <span>🇲🇽</span>
        </div>

        {/* Rules toggle */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full bg-gray-900 rounded-2xl border border-gray-700 p-4 mb-8 flex items-center justify-between hover:border-wc-gold transition-colors"
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
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 mb-8 text-left space-y-5 -mt-6">
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
                  grupo
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

        {/* Login button */}
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Entrar con Google
        </button>

        <p className="text-gray-600 text-xs mt-4">
          El Mundial 2026 empieza el 11 de junio hasta el 19 de julio. Asegura
          tu lugar en la polla y disfruta la competencia al máximo con tus
          amigos y familiares. ¡Que gane el mejor predictor!
        </p>
      </div>
    </div>
  );
}
