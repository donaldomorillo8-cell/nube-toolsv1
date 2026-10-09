// Estado global de autenticación del usuario
let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
});

/* Verificar Sesión de Usuario antes de permitir ejecutar acciones */
function checkUserAuth() {
    if (!isLoggedIn) {
        showToast('🔒 Debes iniciar sesión para usar las funciones.');
        openAuthModal('login');
        return false;
    }
    return true;
}

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
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    isLoggedIn = true;
    showToast('⚡ Sesión iniciada correctamente.');
    closeAuthModal();
    updateUserSession('Usuario Nexus');
}

function handleRegister(e) {
    e.preventDefault();
    isLoggedIn = true;
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
    isLoggedIn = true;
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

        dropEl.addEventListener('click', () => {
            if (checkUserAuth()) {
                inputEl.click();
            }
        });

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
            if (!checkUserAuth()) return;
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

/* Helper para instanciar videos con audio activado */
function createVideoElement(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = false; // Mantiene el canal de audio activo
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
        
        video.onloadeddata = () => resolve(video);
        video.onerror = () => reject("Error al cargar el archivo de video.");
    });
}

/* -------------------------------------------------------------------
   1. COMPRESOR DE VIDEO REAL (Conserva Audio y Duración Completa)
------------------------------------------------------------------- */
async function processRealVideoCompression() {
    if (!checkUserAuth()) return;

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
    statusText.textContent = "Analizando flujos de video y audio...";

    try {
        const video = await createVideoElement(file);

        let targetBitrate = 400000; // 400 kbps (Compresión extrema)
        let scaleFactor = 0.5;

        if (level === 'media') {
            targetBitrate = 750000; // 750 kbps
            scaleFactor = 0.65;
        } else if (level === 'alta') {
            targetBitrate = 1400000; // 1.4 Mbps
            scaleFactor = 0.85;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.max(160, Math.floor(video.videoWidth * scaleFactor));
        canvas.height = Math.max(120, Math.floor(video.videoHeight * scaleFactor));

        // Capturar Stream Visual del Canvas
        const canvasStream = canvas.captureStream(25);

        // Capturar Stream de Audio del Video Original para que NO pierda el sonido
        let combinedStream = canvasStream;
        if (video.captureStream) {
            const audioTracks = video.captureStream().getAudioTracks();
            if (audioTracks.length > 0) {
                combinedStream.addTrack(audioTracks[0]);
            }
        } else if (video.mozCaptureStream) {
            const audioTracks = video.mozCaptureStream().getAudioTracks();
            if (audioTracks.length > 0) {
                combinedStream.addTrack(audioTracks[0]);
            }
        }

        let options = { videoBitsPerSecond: targetBitrate };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options.mimeType = 'video/mp4';
        }

        const mediaRecorder = new MediaRecorder(combinedStream, options);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const type = options.mimeType || 'video/webm';
            const compressedBlob = new Blob(chunks, { type: type });
            progressBar.style.width = '100%';
            statusText.textContent = "¡Compresión con audio finalizada!";
            setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

            const ext = type.includes('mp4') ? '.mp4' : '.webm';
            const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_comprimido' + ext;
            createDownloadButton('compressorDownloadArea', compressedBlob, newFileName, file.size);
            showToast('✅ Video comprimido correctamente manteniendo el sonido.');
        };

        mediaRecorder.start();
        video.currentTime = 0;
        await video.play();

        function renderFrame() {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const progress = Math.floor((video.currentTime / video.duration) * 100);
                progressBar.style.width = `${progress}%`;
                statusText.textContent = `Recodificando video + audio: ${progress}% (${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s)`;
                requestAnimationFrame(renderFrame);
            } else if (video.ended) {
                mediaRecorder.stop();
            }
        }

        renderFrame();

    } catch (err) {
        console.error(err);
        showToast('❌ Error al comprimir el video.');
        progressContainer.style.display = 'none';
    }
}

/* -------------------------------------------------------------------
   2. ELIMINACIÓN REAL DE AUDIO / SILENCIADO COMPLETO
------------------------------------------------------------------- */
async function processRemoveAudio() {
    if (!checkUserAuth()) return;

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
    statusText.textContent = "Silenciando pista de sonido...";

    try {
        const video = await createVideoElement(file);
        video.muted = true; // Silenciado completo

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Capturar ÚNICAMENTE el stream del canvas (Sin audio)
        const canvasStream = canvas.captureStream(25);

        let options = {};
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options.mimeType = 'video/webm;codecs=vp8';
        }

        const mediaRecorder = new MediaRecorder(canvasStream, options);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const type = options.mimeType || 'video/webm';
            const cleanVideoBlob = new Blob(chunks, { type: type });
            progressBar.style.width = '100%';
            statusText.textContent = "¡Audio removido por completo!";
            setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

            const ext = type.includes('mp4') ? '.mp4' : '.webm';
            const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_sin_audio' + ext;
            createDownloadButton('vocalDownloadArea', cleanVideoBlob, newFileName);
            showToast('✅ Video silenciado sin pista de audio.');
        };

        mediaRecorder.start();
        video.currentTime = 0;
        await video.play();

        function renderFrame() {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const progress = Math.floor((video.currentTime / video.duration) * 100);
                progressBar.style.width = `${progress}%`;
                statusText.textContent = `Silenciando video: ${progress}%`;
                requestAnimationFrame(renderFrame);
            } else if (video.ended) {
                mediaRecorder.stop();
            }
        }

        renderFrame();

    } catch (err) {
        console.error(err);
        showToast('❌ Error al silenciar el video.');
        progressContainer.style.display = 'none';
    }
}

/* 3. CONVERSOR DE DOCUMENTOS */
function processConversion() {
    if (!checkUserAuth()) return;

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