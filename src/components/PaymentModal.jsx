import { useState, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
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

export default function PaymentModal({ groupId, memberDocId, currentStatus, onUploadComplete, onClose }) {
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
      setError('Solo se permiten imagenes')
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
        <h2 className="text-wc-gold font-black text-lg text-center mb-1">Pago de Inscripcion</h2>
        <p className="text-gray-400 text-xs text-center mb-4">Polla Mundialista 2026</p>

        {status === 'confirmed' ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-green-400 font-bold text-lg mb-1">Pago confirmado</div>
            <p className="text-gray-400 text-sm">Ya puedes hacer tus predicciones. Buena suerte!</p>
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
                <span className="text-gray-300 text-sm">Cuota de inscripcion</span>
                <span className="text-white font-black text-xl">$30.000</span>
              </div>
              <div className="border-t border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Pozo de premios</span>
                  <span className="text-wc-gold font-semibold">$25.000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Uso de la aplicacion</span>
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
                  <div className="text-gray-400 text-xs">Numero Nequi</div>
                  <div className="text-wc-gold font-mono font-bold">{NEQUI_NUMBER}</div>
                </div>
                <span className="text-gray-400 text-sm">{nequiCopied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {status === 'uploaded' ? (
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">⏳</div>
                <div className="text-blue-300 font-bold text-sm mb-1">Comprobante verificado</div>
                <p className="text-gray-400 text-xs">
                  Tu pago esta siendo revisado por el administrador. Te habilitaremos para predecir una vez confirmado.
                </p>
              </div>
            ) : (
              <>
                {status === 'rejected' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-3">
                    <div className="text-red-300 font-bold text-sm">Pago rechazado</div>
                    <p className="text-red-400 text-xs mt-0.5">
                      El admin rechazo tu pago. Verifica e intenta con otro comprobante.
                    </p>
                  </div>
                )}

                {/* Upload + OCR verification */}
                <div className="space-y-3">
                  <div className="text-white font-bold text-sm">Verificar comprobante</div>
                  <p className="text-gray-400 text-xs">
                    Sube una captura de tu comprobante de pago. Verificaremos automaticamente el monto y el destino.
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
                                  : 'No se detecto un monto valido'}
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
                                  : `No se encontro ${NEQUI_NUMBER} ni "${ADMIN_NAME}"`}
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
                                El comprobante no cumple con las validaciones. Asegurate de que el pago sea de $30.000 al Nequi {NEQUI_NUMBER}.
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

            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm"
            >
              Cerrar
            </button>
          </>
        )}
      </div>

    </div>
  )
}
