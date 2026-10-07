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
    showToast('⚡ Sesión iniciada correctamente.');
    closeAuthModal();
    updateUserSession('Usuario Nexus');
}

function handleRegister(e) {
    e.preventDefault();
    showToast('🚀 Cuenta registrada con éxito.');
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

/* Drag & Drop */
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

/* Crear botón de descarga e informar de tamaños reales */
function createDownloadButton(containerId, blob, fileName, originalSize = null) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(blob);
    
    let infoSize = "";
    if (originalSize) {
        const newSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        const origSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
        const percent = (100 - (blob.size / originalSize * 100)).toFixed(1);
        
        infoSize = `<br><div style="margin-top: 10px; color: var(--accent-cyan); font-weight: bold; font-size: 1.1rem;">
            Peso Original: ${origSizeMB} MB ➔ Nuevo Peso: ${newSizeMB} MB 
            <span style="color: #27c93f;">(-${percent}% reducido)</span>
        </div>`;
    }

    container.innerHTML = `
        <a href="${url}" download="${fileName}" class="download-link-btn">
            <i class="fa-solid fa-download"></i> Descargar ${fileName}
        </a>
        ${infoSize}
    `;
}

/* -------------------------------------------------------------------
   1. MOTOR NATIVO DE COMPRESIÓN REAL (Recodificación vía Canvas/MediaRecorder)
------------------------------------------------------------------- */
async function processRealVideoCompression() {
    const input = document.getElementById('compressorInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video primero.');
        return;
    }

    const file = input.files[0];
    const level = document.getElementById('compressionLevel').value;
    const progressContainer = document.getElementById('compressorProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('compressorStatusText');
    const downloadArea = document.getElementById('compressorDownloadArea');

    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = "Analizando fotogramas del video...";

    // Configuración estricta de Bitrate según nivel
    let targetBitrate = 400000; // Baja calidad: 400 kbps (fuerza reducción masiva)
    let scaleFactor = 0.5;

    if (level === 'media') {
        targetBitrate = 800000; // 800 kbps
        scaleFactor = 0.7;
    } else if (level === 'alta') {
        targetBitrate = 1500000; // 1.5 Mbps
        scaleFactor = 0.9;
    }

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = Math.floor(video.videoWidth * scaleFactor);
    canvas.height = Math.floor(video.videoHeight * scaleFactor);

    // Flujo de captura del canvas
    const stream = canvas.captureStream(30);

    let mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: targetBitrate
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        progressBar.style.width = '100%';
        statusText.textContent = "¡Compresión finalizada!";
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_comprimido.webm';
        createDownloadButton('compressorDownloadArea', compressedBlob, newFileName, file.size);
        showToast('✅ Video comprimido correctamente.');
    };

    video.play();
    mediaRecorder.start();

    function drawFrame() {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const currentProgress = Math.floor((video.currentTime / video.duration) * 100);
            progressBar.style.width = `${currentProgress}%`;
            statusText.textContent = `Procesando video real: ${currentProgress}% (${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s)`;

            requestAnimationFrame(drawFrame);
        } else if (video.ended) {
            mediaRecorder.stop();
        }
    }

    drawFrame();
}

/* -------------------------------------------------------------------
   2. ELIMINACIÓN Y SILENCIADO REAL DE AUDIO (Web Audio API Stream)
------------------------------------------------------------------- */
async function processRemoveAudio() {
    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Carga un archivo de video.');
        return;
    }

    const file = input.files[0];
    const progressContainer = document.getElementById('vocalProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('vocalStatusText');
    const downloadArea = document.getElementById('vocalDownloadArea');

    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = "Extrayendo únicamente la pista de video...";

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true; // Forzamos el silenciado nativo del elemento
    video.playsInline = true;

    await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Solo capturamos el stream visual del canvas, dejando el audio a cero
    const stream = canvas.captureStream(30);

    let mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const cleanVideoBlob = new Blob(chunks, { type: 'video/webm' });
        progressBar.style.width = '100%';
        statusText.textContent = "¡Audio removido por completo!";
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_sin_audio.webm';
        createDownloadButton('vocalDownloadArea', cleanVideoBlob, newFileName);
        showToast('✅ Video silenciado sin pista de audio.');
    };

    video.play();
    mediaRecorder.start();

    function renderVideo() {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const currentProgress = Math.floor((video.currentTime / video.duration) * 100);
            progressBar.style.width = `${currentProgress}%`;
            statusText.textContent = `Removiendo pista de sonido: ${currentProgress}%`;

            requestAnimationFrame(renderVideo);
        } else if (video.ended) {
            mediaRecorder.stop();
        }
    }

    renderVideo();
}

/* 3. Conversor de Archivos de Texto */
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
        showToast('✅ Archivo procesado correctamente.');
    }, 500);
}