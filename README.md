# CarpiTech – agente flotante (Windows + Android)

Una burbuja que siempre queda arriba de las demás apps, conversa por voz y texto, sabe de Formosa, de IA y de la materia *Fundamentos para la Construcción de Prompt*, y puede ver tu pantalla **solo cuando activás el botón del ojo**.

## Cómo está armado
- `agents/carpitech/` → quién es el agente (`agent.json`) y lo que sabe (`knowledge/*.md`).
- `config.json` → la URL de tu servidor y el modo de voz.
- `shared-ui/` → la pantalla de chat (la misma para PC y celular).
- `desktop/` → app de Windows (Electron). `android/` → app de Android (Kotlin).
- `worker/worker.js` → servidor intermedio que guarda las claves (las apps nunca las llevan adentro).
- `.github/workflows/release.yml` → compila el `.exe` y el `.apk` en la nube.

## Pasos para publicarlo

### 1. Servidor en Cloudflare (gratis)
1. Creá una cuenta en cloudflare.com → **Workers & Pages** → **Create** → **Hello World** → nombre `carpitech-worker` → **Deploy**.
2. Tocá **Edit code**, borrá todo, pegá el contenido de `worker/worker.js` y **Deploy**.
3. En **Settings → Variables and Secrets** agregá como *Secret*:
   - `ANTHROPIC_API_KEY` = tu clave de la API de Anthropic (console.anthropic.com).
   - `ELEVENLABS_API_KEY` = tu clave de ElevenLabs (**opcional**, pero hace falta para hablarle por voz).
4. Copiá la URL del worker (algo como `https://carpitech-worker.TU-USUARIO.workers.dev`).

### 2. Configurar la URL
Abrí `config.json` y reemplazá `PEGAR_AQUI_LA_URL_DE_TU_WORKER_DE_CLOUDFLARE` por esa URL. Si cargaste la clave de ElevenLabs, cambiá `"voiceOut": "system"` por `"voiceOut": "elevenlabs"` para una voz más natural.

### 3. Subir a GitHub
1. Creá un repositorio nuevo, por ejemplo `carpitech-app` (no lo mezcles con la versión web anterior).
2. Subí **todo el contenido** de esta carpeta, incluida la carpeta oculta `.github`. Si el navegador no la sube, en GitHub tocá *Add file → Create new file*, escribí `.github/workflows/release.yml` como nombre y pegá el contenido.
3. En **Settings → Actions → General → Workflow permissions** elegí **Read and write permissions**.

### 4. Compilar
En **Releases → Draft a new release → Choose a tag**, escribí `v1.0.0`, **Create new tag** y **Publish release**. Andá a la pestaña **Actions** y esperá 10 a 15 minutos. Si algo falla, abrí el paso en rojo, copiá el error y pasámelo.

### 5. Links de descarga
- Windows: `https://github.com/USUARIO/REPO/releases/latest/download/AgenteFlotante-Setup.exe`
- Android: `https://github.com/USUARIO/REPO/releases/latest/download/AgenteFlotante.apk`

## Uso
- **Windows:** abrí el programa. `Ctrl+Mayús+Espacio` muestra u oculta la burbuja. El botón **–** la minimiza; arrastrá la burbuja para moverla.
- **Android:** abrí la app, tocá **Activar la burbuja** y aceptá los permisos (sobre otras apps, micrófono, captura). Tocá la burbuja para abrir y cerrar el chat.
- **🎤** activa la voz continua: hablá y hacé una pausa. **👁** deja que vea tu pantalla; mientras está encendido aparece un aviso. **🔊** silencia la voz.

## Avisos
- Los instaladores no están firmados: Windows muestra SmartScreen («Más información → Ejecutar de todas formas») y Android pide permitir instalar apps desconocidas.
- Cuidá tus claves: nunca las pegues en `config.json`. Poné un límite de gasto en tu cuenta de Anthropic y, si querés, una regla de límite de peticiones en Cloudflare, porque cualquiera con la URL del worker podría usarlo.
- Agregar conocimiento: poné archivos `.md` en `agents/carpitech/knowledge/`. Para un agente nuevo, copiá la carpeta `agents/carpitech`, cambiale el nombre y editá su `agent.json`.
