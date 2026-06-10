# ⚽ Polla Mundialista 2026

App de predicciones para el Mundial 2026 🇺🇸🇨🇦🇲🇽 — construida con React + Vite + Firebase.

## ✨ Funcionalidades

- 🔐 Login con Google (Firebase Auth)
- 👥 Grupos privados con enlace de invitación
- 🔮 Predicciones hasta antes del pitazo inicial (hora Colombia)
- 📊 Tabla de posiciones en tiempo real por grupo
- ⚙️ Panel de administrador para actualizar resultados
- 🏆 104 partidos precargados — Fase de Grupos completa + Eliminatoria
- 📱 Diseño responsive, funciona en móvil

## 🏅 Sistema de Puntuación

| Acierto | Puntos |
|---------|--------|
| Aciertas el ganador (o empate) | +0.5 pts |
| Aciertas el marcador exacto | +0.5 pts |
| **Máximo por partido** | **1 pt** |

---

## 🚀 Configuración paso a paso

### Paso 1 — Crear proyecto Firebase

1. Ve a https://console.firebase.google.com
2. Clic en "Añadir proyecto" → Ponle nombre (ej: polla-mundial-2026)
3. Desactiva Google Analytics (opcional) → Crear proyecto

### Paso 2 — Activar Authentication

1. En el menú izquierdo: Authentication → Comenzar
2. Pestaña "Sign-in method" → Google → Activar → Guardar email de soporte → Guardar

### Paso 3 — Crear Firestore Database

1. En el menú: Firestore Database → Crear base de datos
2. Selecciona Modo de producción → Elige ubicación (ej: us-central1) → Listo
3. Pestaña Reglas → Pega el contenido de firestore.rules → Publicar

### Paso 4 — Registrar tu app web

1. En Descripción general del proyecto → clic en el ícono Web </>
2. Registra la app (nombre: polla-mundialista)
3. Firebase te mostrará el objeto firebaseConfig — cópialo

### Paso 5 — Configurar variables de entorno

1. Crea el archivo .env: cp .env.example .env
2. Rellena con los valores de tu firebaseConfig

### Paso 6 — Instalar y ejecutar local

npm install
npm run dev

Abre http://localhost:5173 y haz login con tu cuenta Google.

### Paso 7 — Obtener tu UID de administrador

1. Haz login en la app
2. Ve a Firebase Console → Authentication → Users
3. Copia el UID de tu cuenta
4. Actualiza .env: VITE_ADMIN_UID=aqui-tu-uid
5. Reinicia el servidor

---

## 🌐 Despliegue en Vercel

1. Sube a GitHub:
   git init && git add . && git commit -m "Polla Mundialista 2026"
   gh repo create polla-mundialista --public --push --source=.

2. Ve a vercel.com → New Project → importa tu repo

3. En Environment Variables añade todas las VITE_FIREBASE_* variables + VITE_ADMIN_UID

4. Deploy 🚀

5. Firebase Console → Authentication → Settings → Authorized domains → Agrega tu URL de Vercel

---

## 📱 Cómo usar la app

### Administrador
- Accede a ⚙️ Admin en el navbar
- Cuando termine un partido: clic "Resultado" → ingresa los goles → Guardar
- Los puntos se calculan automáticamente para todos los grupos

### Participante
- Login con Google
- Crear Grupo o Unirse con el código compartido
- Predice partidos antes del pitazo (hora Colombia)
- Mira la Tabla de Posiciones para ver quién va liderando

### Enlace de invitación
https://tu-app.vercel.app/join?code=ABC123

---

Hecho con ❤️ para el Mundial 2026 🏆
