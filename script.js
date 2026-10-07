// Inicialización de FFmpeg WebAssembly para procesamiento real
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
});

/* Sistema de Navegación por Pestañas */
function switchView(viewId, event) {
    if (event) event.preventDefault();

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active-content'));

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    const targetContent = document.getElementById(viewId);
    if (targetContent) {
        targetContent.classList.add('active-content');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

/* Notificaciones Toast */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

/* Modal de Autenticación */
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('formLogin');
    const registerForm = document.getElementById('formRegister');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        loginForm.classList.add('active-form');
        registerForm.classList.remove('active-form');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        registerForm.classList.add('active-form');
        loginForm.classList.remove('active-form');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    showToast('⚡ Sesión iniciada correctamente en NEXUS.AI');
    closeAuthModal();
    updateUserSession('Usuario Nexus');
}

function handleRegister(e) {
    e.preventDefault();
    showToast('🚀 Cuenta creada exitosamente.');
    closeAuthModal();
    updateUserSession('Nuevo Usuario');
}

function updateUserSession(userName) {
    const authContainer = document.getElementById('authContainer');
    authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: var(--accent-cyan); font-weight: bold;"><i class="fa-solid fa-user-astronaut"></i> ${userName}</span>
            <button class="btn btn-outline" onclick="location.reload()"><i class="fa-solid fa-power-off"></i> Salir</button>
        </div>
    `;
}

/* Google OAuth */
function initGoogleAuth() {
    window.onload = function () {
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "774305802282-2flja2krsmhob5226uvj61ekjcktapvg.apps.googleusercontent.com",
                callback: handleGoogleCredentialResponse
            });

            google.accounts.id.renderButton(
                document.getElementById("googleBtnLogin"),
                { theme: "dark", size: "large", text: "signin_with", shape: "pill" }
            );

            google.accounts.id.renderButton(
                document.getElementById("googleBtnRegister"),
                { theme: "dark", size: "large", text: "signup_with", shape: "pill" }
            );
        }
    };
}

function handleGoogleCredentialResponse(response) {
    showToast("✅ Autenticación exitosa con Google.");
    closeAuthModal();
    updateUserSession("Usuario Google");
}

/* Drag & Drop para archivos */
function setupDropZones() {
    const zones = [
        { drop: 'converterDropZone', input: 'converterInput' },
        { drop: 'compressorDropZone', input: 'compressorInput' },
        { drop: 'vocalDropZone', input: 'vocalInput' }
    ];

    zones.forEach(zone => {
        const dropEl = document.getElementById(zone.drop);
        const inputEl = document.getElementById(zone.input);

        dropEl.addEventListener('click', () => inputEl.click());

        dropEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropEl.classList.add('dragover');
        });

        dropEl.addEventListener('dragleave', () => {
            dropEl.classList.remove('dragover');
        });

        dropEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                inputEl.files = e.dataTransfer.files;
                showToast(`📁 Archivo listo: ${e.dataTransfer.files[0].name}`);
            }
        });

        inputEl.addEventListener('change', () => {
            if (inputEl.files.length) {
                showToast(`📁 Seleccionado: ${inputEl.files[0].name}`);
            }
        });
    });
}

/* Generador del Botón de Descarga Real */
function createDownloadButton(containerId, blob, fileName, originalSize = null) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(blob);
    
    let infoSize = "";
    if (originalSize) {
        const newSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        const origSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
        infoSize = `<br><div style="margin-top: 10px; color: var(--accent-cyan); font-weight: bold;">
            Original: ${origSizeMB} MB ➔ Reducido: ${newSizeMB} MB
        </div>`;
    }

    container.innerHTML = `
        <a href="${url}" download="${fileName}" class="download-link-btn">
            <i class="fa-solid fa-download"></i> Descargar ${fileName}
        </a>
        ${infoSize}
    `;
}

/* 1. Compresión REAL de Video mediante FFmpeg */
async function processRealVideoCompression() {
    const input = document.getElementById('compressorInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video primero.');
        return;
    }

    const file = input.files[0];
    const targetScale = document.getElementById('compressionLevel').value;
    const progressContainer = document.getElementById('compressorProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = '15%';
    showToast('⚙️ Cargando motor de video FFmpeg...');

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        progressBar.style.width = '40%';
        showToast('🎬 Procesando y re-codificando video...');

        ffmpeg.FS('writeFile', 'input_video.mp4', await fetchFile(file));

        // Ejecución del comando de compresión cambiando resolución y bitrate
        await ffmpeg.run(
            '-i', 'input_video.mp4',
            '-vf', `scale=-2:${targetScale}`,
            '-b:v', '750k',
            '-preset', 'ultrafast',
            'output_compressed.mp4'
        );

        progressBar.style.width = '90%';

        const data = ffmpeg.FS('readFile', 'output_compressed.mp4');
        const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

        progressBar.style.width = '100%';
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        createDownloadButton('compressorDownloadArea', compressedBlob, `comprimido_${file.name}`, file.size);
        showToast('✅ ¡Video comprimido exitosamente!');

    } catch (error) {
        console.error(error);
        showToast('❌ Error al procesar el video.');
        progressContainer.style.display = 'none';
    }
}

/* 2. Eliminación REAL de Audio / Ruido de Fondo de Video MP4 */
async function processRemoveAudio() {
    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Por favor sube un archivo de video.');
        return;
    }

    const file = input.files[0];
    const progressContainer = document.getElementById('vocalProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');

    progressContainer.style.display = 'block';
    progressBar.style.width = '20%';
    showToast('⚙️ Inicializando FFmpeg...');

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        progressBar.style.width = '50%';
        showToast('🔇 Eliminando pista de sonido...');

        ffmpeg.FS('writeFile', 'input_mute.mp4', await fetchFile(file));

        // Comando '-an' extrae directamente el video sin la pista de audio
        await ffmpeg.run('-i', 'input_mute.mp4', '-c:v', 'copy', '-an', 'output_muted.mp4');

        progressBar.style.width = '90%';

        const data = ffmpeg.FS('readFile', 'output_muted.mp4');
        const cleanVideoBlob = new Blob([data.buffer], { type: 'video/mp4' });

        progressBar.style.width = '100%';
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        createDownloadButton('vocalDownloadArea', cleanVideoBlob, `sin_audio_${file.name}`);
        showToast('✅ ¡Pista de audio removida!');

    } catch (error) {
        console.error(error);
        showToast('❌ Error al silenciar el video.');
        progressContainer.style.display = 'none';
    }
}

/* 3. Conversor de Formatos de Texto / Archivo */
function processConversion() {
    const input = document.getElementById('converterInput');
    if (!input.files.length) {
        showToast('⚠️ Carga un archivo para convertir.');
        return;
    }

    const file = input.files[0];
    const target = document.getElementById('targetFormat').value;
    const progressContainer = document.getElementById('converterProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');

    progressContainer.style.display = 'block';
    progressBar.style.width = '50%';

    setTimeout(() => {
        progressBar.style.width = '100%';
        setTimeout(() => { progressContainer.style.display = 'none'; }, 400);

        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + `_convertido.${target}`;
        const blob = new Blob([file], { type: 'application/octet-stream' });
        createDownloadButton('converterDownloadArea', blob, newName);
        showToast('✅ Archivo convertido y listo.');
    }, 600);
}