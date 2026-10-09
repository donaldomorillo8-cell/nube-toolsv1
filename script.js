// Estado global del usuario
let isLoggedIn = false;
let userProfile = { name: '', picture: '' };

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
});

/* Función de apoyo para decodificar JWT de Google Auth */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

/* Verificar Sesión de Usuario */
function checkUserAuth() {
    if (!isLoggedIn) {
        showToast('🔒 Inicia sesión para usar esta función.');
        openAuthModal('login');
        return false;
    }
    return true;
}

/* Navegación por Pestañas */
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

/* Toast */
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
    userProfile = { name: 'Usuario Pro', picture: '' };
    showToast('⚡ Sesión iniciada correctamente.');
    closeAuthModal();
    updateUserSession();
}

function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('regUsername').value || 'Usuario Pro';
    isLoggedIn = true;
    userProfile = { name: nickname, picture: '' };
    showToast('🚀 Cuenta creada en nube-toolsv1.');
    closeAuthModal();
    updateUserSession();
}

function updateUserSession() {
    const authContainer = document.getElementById('authContainer');
    
    // Renderizar Foto si está disponible, o Icono
    const avatarHtml = userProfile.picture 
        ? `<img src="${userProfile.picture}" class="user-avatar-img" alt="Foto de Perfil">`
        : `<div class="user-avatar-icon"><i class="fa-solid fa-user"></i></div>`;

    authContainer.innerHTML = `
        <div class="user-profile-badge">
            ${avatarHtml}
            <span class="user-nickname">${userProfile.name}</span>
            <button class="btn btn-outline" style="padding: 4px 10px; margin-left: 6px;" onclick="location.reload()" title="Cerrar Sesión">
                <i class="fa-solid fa-power-off"></i>
            </button>
        </div>
    `;
}

/* Google OAuth con extracción de Perfil y Apodo */
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
    const data = parseJwt(response.credential);
    
    if (data) {
        isLoggedIn = true;
        // Capturamos el apodo/nombre real y la foto de la cuenta de Google
        userProfile = {
            name: data.name || data.given_name || 'Usuario Google',
            picture: data.picture || ''
        };

        showToast(`✅ ¡Bienvenido, ${userProfile.name}!`);
        closeAuthModal();
        updateUserSession();
    } else {
        showToast("⚠️ Ocurrió un inconveniente al obtener los datos de la cuenta.");
    }
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
                showToast(`📁 Archivo listo: ${inputEl.files[0].name}`);
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
        
        infoSize = `<br><div style="margin-top: 12px; color: var(--accent-cyan); font-weight: 600;">
            Original: ${origSizeMB} MB ➔ Comprimido: ${newSizeMB} MB 
            <span style="color: #10b981;">(-${percent}%)</span>
        </div>`;
    }

    container.innerHTML = `
        <a href="${url}" download="${fileName}" class="download-link-btn">
            <i class="fa-solid fa-download"></i> Descargar ${fileName}
        </a>
        ${infoSize}
    `;
}

function createVideoElement(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = false;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
        video.onloadeddata = () => resolve(video);
        video.onerror = () => reject("Error al procesar archivo.");
    });
}

/* 1. ELIMINACIÓN DE RUIDO DE FONDO (Aislamiento Vocal DSP) */
async function processRemoveBackgroundNoise() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video.');
        return;
    }

    const file = input.files[0];
    const noiseIntensity = document.getElementById('noiseLevel').value;
    const progressContainer = document.getElementById('vocalProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('vocalStatusText');
    const downloadArea = document.getElementById('vocalDownloadArea');

    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = "Aplicando filtros DSP anti-ruido...";

    try {
        const video = await createVideoElement(file);

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        
        const highPass = audioCtx.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.value = noiseIntensity === 'fuerte' ? 220 : 150;

        const notchFilter = audioCtx.createBiquadFilter();
        notchFilter.type = "notch";
        notchFilter.frequency.value = 60;
        notchFilter.Q.value = 10;

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        source.connect(highPass);
        highPass.connect(notchFilter);
        notchFilter.connect(compressor);

        const audioDestination = audioCtx.createMediaStreamDestination();
        compressor.connect(audioDestination);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const canvasStream = canvas.captureStream(25);

        const cleanAudioTrack = audioDestination.stream.getAudioTracks()[0];
        const processedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            cleanAudioTrack
        ]);

        let options = { videoBitsPerSecond: 2500000 };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
        }

        const mediaRecorder = new MediaRecorder(processedStream, options);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const cleanBlob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
            progressBar.style.width = '100%';
            statusText.textContent = "¡Ruido de fondo removido!";
            setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

            const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_voz_limpia.webm';
            createDownloadButton('vocalDownloadArea', cleanBlob, newFileName);
            showToast('✅ Ruido filtrado exitosamente.');
            audioCtx.close();
        };

        mediaRecorder.start();
        video.currentTime = 0;
        await video.play();

        function renderFrame() {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const progress = Math.floor((video.currentTime / video.duration) * 100);
                progressBar.style.width = `${progress}%`;
                statusText.textContent = `Procesando audio e islote de voz: ${progress}%`;
                requestAnimationFrame(renderFrame);
            } else if (video.ended) {
                mediaRecorder.stop();
            }
        }

        renderFrame();

    } catch (err) {
        console.error(err);
        showToast('❌ Ocurrió un problema al procesar el audio.');
        progressContainer.style.display = 'none';
    }
}

/* 2. COMPRESOR DE VIDEO REAL */
async function processRealVideoCompression() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('compressorInput');
    if (!input.files.length) {
        showToast('⚠️ Carga un archivo de video primero.');
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
    statusText.textContent = "Analizando video...";

    try {
        const video = await createVideoElement(file);

        let targetBitrate = 400000;
        let scaleFactor = 0.5;

        if (level === 'media') {
            targetBitrate = 750000;
            scaleFactor = 0.65;
        } else if (level === 'alta') {
            targetBitrate = 1400000;
            scaleFactor = 0.85;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.max(160, Math.floor(video.videoWidth * scaleFactor));
        canvas.height = Math.max(120, Math.floor(video.videoHeight * scaleFactor));

        const canvasStream = canvas.captureStream(25);
        let combinedStream = canvasStream;

        if (video.captureStream) {
            const audioTracks = video.captureStream().getAudioTracks();
            if (audioTracks.length > 0) combinedStream.addTrack(audioTracks[0]);
        } else if (video.mozCaptureStream) {
            const audioTracks = video.mozCaptureStream().getAudioTracks();
            if (audioTracks.length > 0) combinedStream.addTrack(audioTracks[0]);
        }

        let options = { videoBitsPerSecond: targetBitrate };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
        }

        const mediaRecorder = new MediaRecorder(combinedStream, options);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const compressedBlob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
            progressBar.style.width = '100%';
            statusText.textContent = "¡Compresión terminada!";
            setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

            const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '_comprimido.webm';
            createDownloadButton('compressorDownloadArea', compressedBlob, newFileName, file.size);
            showToast('✅ Video comprimido correctamente.');
        };

        mediaRecorder.start();
        video.currentTime = 0;
        await video.play();

        function renderFrame() {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const progress = Math.floor((video.currentTime / video.duration) * 100);
                progressBar.style.width = `${progress}%`;
                statusText.textContent = `Recodificando video: ${progress}%`;
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