const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

/**
 * Cloud Function: sendPushOnNotification
 *
 * Se activa automaticamente cuando se crea un documento en userNotifications.
 * Busca los FCM tokens del usuario destino y envia un push notification.
 *
 * Flujo:
 *   Admin envia notificacion (escribe en userNotifications)
 *     → Esta funcion se activa
 *       → Lee FCM tokens del usuario
 *         → Envia push via FCM
 */
exports.sendPushOnNotification = onDocumentCreated(
  'userNotifications/{docId}',
  async (event) => {
    const data = event.data.data()
    const { userId, title, message, type } = data

    if (!userId || !title) {
      console.log('Documento sin userId o title, saltando push')
      return
    }

    // Buscar todos los FCM tokens de este usuario
    const tokensSnap = await db
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .get()

    if (tokensSnap.empty) {
      console.log(`Sin FCM tokens para usuario ${userId}`)
      return
    }

    const tokens = tokensSnap.docs.map((doc) => doc.data().token)

    // Construir payload de notificacion
    const payload = {
      notification: {
        title: title,
        body: message || '',
        icon: '/icon-192.png',
      },
      data: {
        type: type || 'info',
        notificationId: event.data.id,
      },
      tokens: tokens,
    }

    // Enviar a todos los dispositivos del usuario
    const response = await getMessaging().sendEachForMulticast(payload)

    // Limpiar tokens invalidos automaticamente
    const tokensToDelete = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          tokensToDelete.push(tokensSnap.docs[idx].ref)
        }
      }
    })

    if (tokensToDelete.length > 0) {
      const batch = db.batch()
      tokensToDelete.forEach((ref) => batch.delete(ref))
      await batch.commit()
      console.log(`Limpiados ${tokensToDelete.length} tokens invalidos`)
    }

    console.log(
      `Push enviado a usuario ${userId}: ${response.successCount} exitosos, ${response.failureCount} fallidos`
    )
  }
)
