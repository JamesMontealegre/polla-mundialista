import { useState, useRef } from 'react'
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { createWorker } from 'tesseract.js'

const NEQUI_NUMBER = '3219128803'
const ADMIN_NAME = 'James Montealegre'
const EXPECTED_AMOUNT = 30000
const AMOUNT_TOLERANCE = 0 // Monto exacto requerido

// Extract amounts from OCR text (handles $30.000, $30,000, $30.000,00, etc.)
function extractAmounts(text) {
  const amounts = []
  // Pattern: optional $ + digits with dots/commas as separators
  const patterns = [
    /\$\s*([\d.,]+)/g,
    /(?:valor|monto|cuanto|transferencia)[^\d]*([\d.,]+)/gi,
  ]
  for (const regex of patterns) {
    let match
    while ((match = regex.exec(text)) !== null) {
      const raw = match[1]
      // Remove thousand separators and parse
      // Colombian format: 30.000 or 30.000,00
      const cleaned = raw.replace(/\./g, '').replace(/,\d{2}$/, '').replace(/,/g, '')
      const num = parseInt(cleaned, 10)
      if (num && num >= 1000) amounts.push(num)
    }
  }
  return [...new Set(amounts)]
}

// Check if OCR text contains the destination Nequi number or admin name
function extractDestination(text) {
  const normalized = text.replace(/\s+/g, ' ')
  // Check for Nequi number (with or without spaces)
  const nequiClean = text.replace(/\s/g, '')
  const hasNequiNumber = nequiClean.includes(NEQUI_NUMBER) ||
    nequiClean.includes(NEQUI_NUMBER.replace(/(\d{3})(\d{3})(\d{4})/, '$1$2$3'))

  // Check for admin name (case insensitive, partial match)
  const nameParts = ADMIN_NAME.toLowerCase().split(' ')
  const textLower = normalized.toLowerCase()
  const hasName = nameParts.every(part => textLower.includes(part))

  return { hasNequiNumber, hasName, matched: hasNequiNumber || hasName }
}

export default function PaymentModal({ groupId, memberDocId, currentStatus, onUploadComplete, onClose, groupName, adminIds = [], memberName }) {
  const [preview, setPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState(null) // { amountOk, destOk, amount, destType, rawText }
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [nequiCopied, setNequiCopied] = useState(false)
  const fileRef = useRef(null)

  async function handleFileSelect(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar 10MB')
      return
    }

    setError('')
    setScanResult(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      runOCR(ev.target.result)
    }
    reader.readAsDataURL(selected)
  }

  async function runOCR(imageData) {
    setScanning(true)
    setScanProgress(0)
    try {
      const worker = await createWorker('spa', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100))
          }
        },
      })

      const { data: { text } } = await worker.recognize(imageData)
      await worker.terminate()

      // Analyze extracted text
      const amounts = extractAmounts(text)
      const dest = extractDestination(text)

      const minAmount = EXPECTED_AMOUNT - AMOUNT_TOLERANCE
      const maxAmount = EXPECTED_AMOUNT + AMOUNT_TOLERANCE
      const matchingAmount = amounts.find(a => a >= minAmount && a <= maxAmount)
      const amountOk = !!matchingAmount
      const destOk = dest.matched

      // Determine reason for failure
      const closestAmount = amounts.length > 0 ? amounts.reduce((prev, curr) =>
        Math.abs(curr - EXPECTED_AMOUNT) < Math.abs(prev - EXPECTED_AMOUNT) ? curr : prev
      ) : null
      const amountTooHigh = closestAmount && closestAmount > maxAmount
      const amountTooLow = closestAmount && closestAmount < minAmount

      setScanResult({
        amountOk,
        destOk,
        amount: matchingAmount || closestAmount,
        amountTooHigh,
        amountTooLow,
        destType: dest.hasNequiNumber ? 'nequi' : dest.hasName ? 'nombre' : null,
        rawText: text,
      })
    } catch (err) {
      console.error('Error OCR:', err)
      setError('Error al leer la imagen. Intenta con otra captura.')
    }
    setScanning(false)
  }

  async function handleSubmit() {
    if (!scanResult?.amountOk || !scanResult?.destOk) return

    setSending(true)
    setError('')
    try {
      await updateDoc(doc(db, 'groupMembers', memberDocId), {
        paymentStatus: 'uploaded',
        receiptData: {
          amount: scanResult.amount,
          destType: scanResult.destType,
          verified: true,
          submittedAt: new Date().toISOString(),
        },
      })
      // Notificar a cada admin del grupo
      await Promise.all(adminIds.map(adminUid =>
        addDoc(collection(db, 'userNotifications'), {
          userId: adminUid,
          title: groupName || 'Polla',
          message: `Nueva solicitud de aprobación · ${memberName || 'Un participante'} subió su comprobante`,
          type: 'payment',
          read: false,
          createdAt: serverTimestamp(),
        })
      ))
      onUploadComplete()
    } catch (err) {
      console.error('Error enviando datos de pago:', err)
      setError('Error enviando los datos. Intenta de nuevo.')
    }
    setSending(false)
  }

  function resetScan() {
    setPreview(null)
    setScanResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function copyNequi() {
    navigator.clipboard.writeText(NEQUI_NUMBER)
    setNequiCopied(true)
    setTimeout(() => setNequiCopied(false), 2000)
  }

  const status = currentStatus || 'pending'
  const isValid = scanResult?.amountOk && scanResult?.destOk

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl border border-wc-gold max-w-sm w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-wc-gold font-black text-lg text-center mb-1">Pago de Inscripción</h2>
        <p className="text-gray-400 text-xs text-center mb-4">Polla Mundialista 2026</p>

        {status === 'confirmed' ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-green-400 font-bold text-lg mb-1">Pago confirmado</div>
            <p className="text-gray-400 text-sm">Ya puedes hacer tus predicciones. ¡Buena suerte!</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-lg bg-wc-green text-white font-bold text-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Fee breakdown */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm">Cuota de inscripción</span>
                <span className="text-white font-black text-xl">$30.000</span>
              </div>
              <div className="border-t border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Pozo de premios</span>
                  <span className="text-wc-gold font-semibold">$25.000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Uso de la aplicación</span>
                  <span className="text-gray-300 font-semibold">$5.000</span>
                </div>
              </div>
            </div>

            {/* Nequi number */}
            <div className="space-y-3 mb-4">
              <button
                onClick={copyNequi}
                className="w-full bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
              >
                <div className="text-left">
                  <div className="text-gray-400 text-xs">Número Nequi</div>
                  <div className="text-wc-gold font-mono font-bold">{NEQUI_NUMBER}</div>
                </div>
                <span className="text-gray-400 text-sm">{nequiCopied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {status === 'uploaded' ? (
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">⏳</div>
                <div className="text-blue-300 font-bold text-sm mb-1">Comprobante verificado</div>
                <p className="text-gray-400 text-xs">
                  Tu pago está siendo revisado por el administrador. Te habilitaremos para predecir una vez confirmado.
                </p>
              </div>
            ) : (
              <>
                {status === 'rejected' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-3">
                    <div className="text-red-300 font-bold text-sm">Pago rechazado</div>
                    <p className="text-red-400 text-xs mt-0.5">
                      El admin rechazó tu pago. Verifica e intenta con otro comprobante.
                    </p>
                  </div>
                )}

                {/* Upload + OCR verification */}
                <div className="space-y-3">
                  <div className="text-white font-bold text-sm">Verificar comprobante</div>
                  <p className="text-gray-400 text-xs">
                    Sube una captura de tu comprobante de pago. Verificaremos automáticamente el monto y el destino.
                  </p>

                  {preview ? (
                    <div className="space-y-3">
                      <img src={preview} alt="Comprobante" className="w-full rounded-lg border border-gray-600 max-h-48 object-contain bg-white" />

                      {/* Scanning state */}
                      {scanning && (
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                          <div className="text-gray-300 text-sm mb-2">Analizando comprobante...</div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-wc-gold h-2 rounded-full transition-all duration-300"
                              style={{ width: `${scanProgress}%` }}
                            />
                          </div>
                          <div className="text-gray-500 text-xs mt-1">{scanProgress}%</div>
                        </div>
                      )}

                      {/* Scan results */}
                      {scanResult && !scanning && (
                        <div className="space-y-2">
                          {/* Amount check */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${scanResult.amountOk ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                            <span className="text-lg">{scanResult.amountOk ? '✅' : '❌'}</span>
                            <div>
                              <div className={`text-xs font-bold ${scanResult.amountOk ? 'text-green-400' : 'text-red-400'}`}>
                                {scanResult.amountOk
                                  ? 'Monto correcto'
                                  : scanResult.amountTooHigh
                                  ? 'Monto excede el valor esperado'
                                  : scanResult.amountTooLow
                                  ? 'Monto inferior al valor esperado'
                                  : 'Monto no encontrado'}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {scanResult.amount
                                  ? `Detectado: $${scanResult.amount.toLocaleString('es-CO')} — Esperado: $${EXPECTED_AMOUNT.toLocaleString('es-CO')}`
                                  : 'No se detectó un monto válido'}
                              </div>
                            </div>
                          </div>

                          {/* Destination check */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${scanResult.destOk ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                            <span className="text-lg">{scanResult.destOk ? '✅' : '❌'}</span>
                            <div>
                              <div className={`text-xs font-bold ${scanResult.destOk ? 'text-green-400' : 'text-red-400'}`}>
                                Destino {scanResult.destOk ? 'verificado' : 'no encontrado'}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {scanResult.destType === 'nequi'
                                  ? `Nequi ${NEQUI_NUMBER} detectado`
                                  : scanResult.destType === 'nombre'
                                  ? `Nombre "${ADMIN_NAME}" detectado`
                                  : `No se encontró ${NEQUI_NUMBER} ni "${ADMIN_NAME}"`}
                              </div>
                            </div>
                          </div>

                          {isValid ? (
                            <button
                              onClick={handleSubmit}
                              disabled={sending}
                              className="w-full py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50"
                            >
                              {sending ? 'Enviando...' : 'Enviar comprobante verificado'}
                            </button>
                          ) : (
                            <div className="text-center">
                              <p className="text-red-400 text-xs mb-2">
                                El comprobante no cumple con las validaciones. Asegúrate de que el pago sea de $30.000 al Nequi {NEQUI_NUMBER}.
                              </p>
                              <button
                                onClick={resetScan}
                                className="text-wc-gold text-xs underline"
                              >
                                Intentar con otra imagen
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Change image button */}
                      {!scanning && (
                        <button
                          onClick={resetScan}
                          className="w-full py-2 rounded-lg border border-gray-600 text-gray-300 text-xs"
                        >
                          Cambiar imagen
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-4 rounded-xl border-2 border-dashed border-gray-600 text-gray-400 text-sm hover:border-wc-gold hover:text-wc-gold transition-colors"
                    >
                      Seleccionar captura del comprobante
                    </button>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
              </>
            )}

            {/* WhatsApp contact */}
            <a
              href={`https://wa.me/57${NEQUI_NUMBER}?text=Hola%2C%20tengo%20una%20duda%20sobre%20la%20Polla%20Mundialista`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-lg bg-green-700/20 border border-green-700 text-green-400 text-sm hover:bg-green-700/30 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              ¿Tienes dudas? Contacta al administrador
            </a>

            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm"
            >
              Cerrar
            </button>
          </>
        )}
      </div>

    </div>
  )
}
