let currentUser = JSON.parse(localStorage.getItem('nube_current_user')) || null;
let currentDurationType = 'semanal';

let planPrices = {
    semanal: { basic: 3, medium: 5, vip: 10 },
    mensual: { basic: 7, medium: 12, vip: 22 },
    anual: { basic: 45, medium: 75, vip: 140 }
};

let basePriceBasic = 3;
let basePriceMedium = 5;
let basePriceVip = 10;
let activeCheckoutAmount = '10.00';
let activePlanName = 'Plan VIP';

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
    if (currentUser) {
        updateUserSession();
    }
});

function saveDatabase() {
    localStorage.setItem('nube_current_user', JSON.stringify(currentUser));
}

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

function checkUserAuth() {
    if (!currentUser || !currentUser.isLoggedIn) {
        showToast('🔒 Inicia sesión para usar esta función.');
        openAuthModal('login');
        return false;
    }
    return true;
}

function checkPremiumAuth() {
    if (!checkUserAuth()) return false;
    
    // RECONOCIMIENTO AUTOMÁTICO DE PRIVILEGIOS MÁXIMOS PARA TU CORREO MAESTRO
    if (currentUser.email === 'donaldoyaaia@gmail.com') {
        return true;
    }

    if (!currentUser.isPremium || new Date().getTime() > currentUser.expireTimestamp) {
        currentUser.isPremium = false;
        saveDatabase();
        showToast('⭐ Esta opción requiere una cuenta VIP activa.');
        switchView('pricing');
        return false;
    }
    return true;
}

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

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

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
    const email = document.getElementById('loginEmail').value;
    
    // Asignación automática de privilegios máximos si es la cuenta maestra
    const isMaster = (email === 'donaldoyaaia@gmail.com');

    currentUser = {
        name: email.split('@')[0],
        email: email,
        isLoggedIn: true,
        isPremium: isMaster ? true : false,
        planName: isMaster ? 'VIP Total (Maestro)' : 'Gratuito',
        expireTimestamp: isMaster ? 9999999999999 : 0,
        picture: ''
    };
    saveDatabase();
    showToast('⚡ Sesión iniciada correctamente.');
    closeAuthModal();
    updateUserSession();
}

function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('regUsername').value || 'Usuario Pro';
    const email = document.getElementById('regEmail').value;
    
    const isMaster = (email === 'donaldoyaaia@gmail.com');

    currentUser = {
        name: nickname,
        email: email,
        isLoggedIn: true,
        isPremium: isMaster ? true : false,
        planName: isMaster ? 'VIP Total (Maestro)' : 'Gratuito',
        expireTimestamp: isMaster ? 9999999999999 : 0,
        picture: ''
    };
    saveDatabase();
    showToast('🚀 Cuenta creada en nube-toolsv1.');
    closeAuthModal();
    updateUserSession();
}

function updateUserSession() {
    const authContainer = document.getElementById('authContainer');
    const heroPlanBadge = document.getElementById('heroPlanBadge');

    if (!currentUser || !currentUser.isLoggedIn) return;

    let isMaster = (currentUser.email === 'donaldoyaaia@gmail.com');
    let isVIPActive = isMaster || (currentUser.isPremium && new Date().getTime() <= currentUser.expireTimestamp);
    let planLabel = isVIPActive ? `⭐ VIP TOTAL` : 'GRATUITO';

    if (heroPlanBadge) {
        heroPlanBadge.textContent = planLabel;
    }

    const avatarHtml = currentUser.picture 
        ? `<img src="${currentUser.picture}" class="user-avatar-img" alt="Foto de Perfil">`
        : `<div class="user-avatar-icon"><i class="fa-solid fa-user"></i></div>`;

    authContainer.innerHTML = `
        <div class="user-profile-badge">
            ${avatarHtml}
            <span class="user-nickname">${currentUser.name}</span>
            <button class="btn btn-outline" style="padding: 4px 10px; margin-left: 6px;" onclick="logoutUser()" title="Cerrar Sesión">
                <i class="fa-solid fa-power-off"></i>
            </button>
        </div>
    `;
}

function logoutUser() {
    localStorage.removeItem('nube_current_user');
    currentUser = null;
    location.reload();
}

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
        const userEmail = data.email || '';
        const isMaster = (userEmail === 'donaldoyaaia@gmail.com');

        currentUser = {
            name: data.name || data.given_name || 'Usuario Google',
            email: userEmail,
            isLoggedIn: true,
            isPremium: isMaster ? true : (currentUser?.isPremium || false),
            planName: isMaster ? 'VIP Total (Maestro)' : (currentUser?.planName || 'Gratuito'),
            expireTimestamp: isMaster ? 9999999999999 : (currentUser?.expireTimestamp || 0),
            picture: data.picture || ''
        };
        saveDatabase();
        showToast(`✅ ¡Bienvenido, ${currentUser.name}!`);
        closeAuthModal();
        updateUserSession();
    } else {
        showToast("⚠️ Ocurrió un inconveniente al obtener los datos de la cuenta.");
    }
}

function setPlanDuration(type) {
    currentDurationType = type;
    document.querySelectorAll('.duration-selector button').forEach(btn => btn.classList.remove('active-duration'));
    event.currentTarget.classList.add('active-duration');

    basePriceBasic = planPrices[type].basic;
    basePriceMedium = planPrices[type].medium;
    basePriceVip = planPrices[type].vip;

    document.getElementById('priceBasic').textContent = `$${basePriceBasic}`;
    document.getElementById('priceMedium').textContent = `$${basePriceMedium}`;
    document.getElementById('priceVip').textContent = `$${basePriceVip}`;
}

/* Drag & Drop */
function setupDropZones() {
    const zones = [
        { drop: 'converterDropZone', input: 'converterInput' },
        { drop: 'compressorDropZone', input: 'compressorInput' },
        { drop: 'vocalDropZone', input: 'vocalInput' },
        { drop: 'bgDropZone', input: 'bgInput' }
    ];

    zones.forEach(zone => {
        const dropEl = document.getElementById(zone.drop);
        const inputEl = document.getElementById(zone.input);

        if (!dropEl || !inputEl) return;

        dropEl.addEventListener('click', () => {
            if (checkUserAuth()) inputEl.click();
        });

        dropEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropEl.classList.add('dragover');
        });

        dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));

        dropEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragover');
            if (!checkUserAuth()) return;
            if (e.dataTransfer.files.length) {
                inputEl.files = e.dataTransfer.files;
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        inputEl.addEventListener('change', () => {
            if (inputEl.files.length) {
                const file = inputEl.files[0];
                showToast(`📁 Archivo listo: ${file.name}`);
                const infoId = zone.drop === 'converterDropZone' ? 'converterFileInfo' :
                    zone.drop === 'compressorDropZone' ? 'compressorMetadata' : null;
                const info = infoId && document.getElementById(infoId);
                if (info) {
                    info.textContent = `${file.name} · ${formatBytes(file.size)}`;
                    info.classList.add('has-file');
                }
                if (zone.drop === 'compressorDropZone') inspectVideoFile(file);
                if (zone.drop === 'converterDropZone') {
                    document.getElementById('converterDownloadArea').innerHTML = '';
                    document.getElementById('converterStatusText').textContent = '';
                }
            }
        });
    });
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return 'Tamaño desconocido';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unit = units[0];
    for (let i = 1; size >= 1024 && i < units.length; i++) {
        size /= 1024;
        unit = units[i];
    }
    return `${size.toFixed(size >= 100 ? 0 : 1)} ${unit}`;
}

function inspectVideoFile(file) {
    const info = document.getElementById('compressorMetadata');
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name)) {
        info.textContent = 'Selecciona un archivo de video compatible.';
        return;
    }
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration)
            ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`
            : 'duración no disponible';
        info.textContent = `${file.name} · ${formatBytes(file.size)} · ${video.videoWidth}×${video.videoHeight} · ${duration}`;
        URL.revokeObjectURL(objectUrl);
    };
    video.onerror = () => {
        info.textContent = `${file.name} · ${formatBytes(file.size)} · No se pudo leer la vista previa; FFmpeg intentará analizar el archivo.`;
        URL.revokeObjectURL(objectUrl);
    };
    video.src = objectUrl;
}

function createResultActions(containerId, blob, fileName, isVideo = false) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(blob);
    container.replaceChildren();

    const preview = isVideo ? document.createElement('video') : document.createElement('img');
    preview.src = url;
    if (isVideo) {
        preview.controls = true;
        preview.preload = 'metadata';
    } else {
        preview.alt = 'Vista previa del resultado';
    }
    preview.className = 'result-preview';

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    const openButton = document.createElement('button');
    openButton.className = 'btn btn-outline';
    openButton.type = 'button';
    openButton.innerHTML = '<i class="fa-solid fa-eye"></i> Ver resultado';
    openButton.addEventListener('click', () => window.open(url, '_blank', 'noopener'));

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.className = 'download-link-btn';
    downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Descargar archivo';
    actions.append(openButton, downloadLink);
    container.append(preview, actions);
}

/* 1. RECORTE REAL DE PERSONAS CON MEDIAPIPE */
const selfieSegmentationBase = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/';
let selfieSegmentationScriptPromise = null;

function loadSelfieSegmentationLibrary() {
    if (window.SelfieSegmentation) return Promise.resolve();
    if (!selfieSegmentationScriptPromise) {
        selfieSegmentationScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${selfieSegmentationBase}selfie_segmentation.js`;
            script.crossOrigin = 'anonymous';
            script.onload = () => window.SelfieSegmentation
                ? resolve()
                : reject(new Error('La biblioteca de recorte no se inicializó.'));
            script.onerror = () => reject(new Error('No se pudo descargar el modelo de recorte. Revisa la conexión e inténtalo de nuevo.'));
            document.head.appendChild(script);
        });
    }
    return selfieSegmentationScriptPromise;
}

async function createSelfieSegmenter() {
    await loadSelfieSegmentationLibrary();
    const segmenter = new window.SelfieSegmentation({
        locateFile: file => `${selfieSegmentationBase}${file}`
    });
    await segmenter.setOptions({ modelSelection: 1 });
    return segmenter;
}

function getPersonMask(segmenter, image) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let resultReceived = false;
        let sendFinished = false;
        let result;
        const timeout = setTimeout(() => fail(new Error('El modelo tardó demasiado en analizar el archivo. Prueba con una imagen o video más pequeño.')), 120000);
        const fail = error => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            reject(error);
        };
        const finish = () => {
            if (settled || !resultReceived || !sendFinished) return;
            settled = true;
            clearTimeout(timeout);
            resolve(result);
        };
        segmenter.onResults(results => {
            if (!results || !results.segmentationMask || !results.image) {
                fail(new Error('El modelo no devolvió una máscara válida.'));
                return;
            }
            result = results;
            resultReceived = true;
            finish();
        });
        Promise.resolve(segmenter.send({ image }))
            .then(() => {
                sendFinished = true;
                finish();
            })
            .catch(fail);
    });
}

function estimateMaskCoverage(mask) {
    const sample = document.createElement('canvas');
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext('2d', { willReadFrequently: true });
    context.drawImage(mask, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let foreground = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 128) foreground++;
    }
    return foreground / (sample.width * sample.height);
}

function drawPersonWithMask(context, results, width, height, backgroundColor, edgeBlur = 0.8) {
    context.clearRect(0, 0, width, height);
    context.drawImage(results.image, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.filter = `blur(${edgeBlur}px)`;
    context.drawImage(results.segmentationMask, 0, 0, width, height);
    context.filter = 'none';
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
}

function canvasToPng(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen PNG.')), 'image/png');
    });
}

function waitForMediaEvent(media, eventName, errorMessage) {
    return new Promise((resolve, reject) => {
        const onReady = () => {
            cleanup();
            resolve();
        };
        const onError = () => {
            cleanup();
            reject(new Error(errorMessage));
        };
        const cleanup = () => {
            media.removeEventListener(eventName, onReady);
            media.removeEventListener('error', onError);
        };
        media.addEventListener(eventName, onReady, { once: true });
        media.addEventListener('error', onError, { once: true });
    });
}

function waitForNextVideoFrame(video) {
    return new Promise(resolve => {
        if (video.ended) {
            resolve();
            return;
        }
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            video.removeEventListener('ended', finish);
            resolve();
        };
        video.addEventListener('ended', finish, { once: true });
        if (typeof video.requestVideoFrameCallback === 'function') {
            video.requestVideoFrameCallback(finish);
        } else {
            requestAnimationFrame(finish);
        }
    });
}

async function processPersonImage(file, segmenter, mode, progressBar, statusText) {
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;
        const maxSide = mode === 'img_4k' ? 4096 : 2048;
        const maxPixels = mode === 'img_4k' ? 12000000 : 4800000;
        const scale = Math.min(1, maxSide / Math.max(originalWidth, originalHeight), Math.sqrt(maxPixels / (originalWidth * originalHeight)));
        const width = Math.max(1, Math.round(originalWidth * scale));
        const height = Math.max(1, Math.round(originalHeight * scale));
        const source = document.createElement('canvas');
        source.width = width;
        source.height = height;
        source.getContext('2d').drawImage(image, 0, 0, width, height);

        statusText.textContent = 'Analizando la foto y detectando a la persona…';
        progressBar.style.width = '35%';
        const results = await getPersonMask(segmenter, source);
        if (estimateMaskCoverage(results.segmentationMask) < 0.003) {
            throw new Error('No se detectó una persona clara. Este modelo está diseñado para personas, no para productos u objetos.');
        }

        const output = document.createElement('canvas');
        output.width = width;
        output.height = height;
        const edgeBlur = mode === 'normal' ? 0.7 : 1.2;
        drawPersonWithMask(output.getContext('2d'), results, width, height, 'rgba(0,0,0,0)', edgeBlur);
        const blob = await canvasToPng(output);
        progressBar.style.width = '100%';
        statusText.textContent = `Listo · PNG transparente${scale < 1 ? ` · ${width} × ${height} px` : ''}.`;
        createResultActions('bgDownloadArea', blob, `${getBaseName(file.name)}_sin_fondo.png`, false);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function processPersonVideo(file, segmenter, backgroundColor, mode, progressBar, statusText) {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.src = objectUrl;
    let sourceStream;
    let outputStream;
    let recorder;
    let recordingPromise;

    try {
        const metadataReady = waitForMediaEvent(video, 'loadedmetadata', 'No se pudo abrir el video. Prueba con MP4, MOV o WebM.');
        const firstFrameReady = waitForMediaEvent(video, 'loadeddata', 'El video no contiene un fotograma decodificable.');
        video.load();
        await Promise.all([metadataReady, firstFrameReady]);
        if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
            throw new Error('El video no tiene una duración o dimensiones válidas.');
        }
        if (video.duration < 1) {
            throw new Error('El video debe durar al menos 1 segundo para generar un archivo de salida.');
        }
        if (video.duration > 60) {
            throw new Error('El límite para quitar el fondo a un video es 60 segundos. Recorta el clip y vuelve a intentarlo.');
        }

        const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight), Math.sqrt(2304000 / (video.videoWidth * video.videoHeight)));
        const width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
        const height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
            throw new Error('Este navegador no permite exportar el video procesado. Prueba con Chrome, Edge o Firefox actualizado.');
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = width;
        frameCanvas.height = height;
        const frameContext = frameCanvas.getContext('2d');
        const canvasStream = canvas.captureStream(24);
        outputStream = canvasStream;
        if (typeof video.captureStream === 'function') {
            sourceStream = video.captureStream();
        } else if (typeof video.mozCaptureStream === 'function') {
            sourceStream = video.mozCaptureStream();
        }
        const audioTracks = sourceStream ? sourceStream.getAudioTracks() : [];
        audioTracks.forEach(track => canvasStream.addTrack(track));
        const mimeTypes = audioTracks.length
            ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
            : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
        if (!mimeType) throw new Error('Este navegador no tiene un formato WebM compatible para exportar el video.');

        recorder = new MediaRecorder(canvasStream, { mimeType });
        const chunks = [];
        recordingPromise = new Promise((resolve, reject) => {
            recorder.ondataavailable = event => {
                if (event.data && event.data.size) chunks.push(event.data);
            };
            recorder.onerror = () => reject(new Error('Falló la grabación del video procesado. Prueba con un clip más corto.'));
            recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
        });
        recordingPromise.catch(() => {});

        recorder.start(1000);
        statusText.textContent = `Analizando personas${audioTracks.length ? ' y conservando el audio' : ''}…`;
        await video.play();
        let frameCount = 0;
        let coverageTotal = 0;
        let lastProcessedTime = -1;
        while (!video.ended) {
            await waitForNextVideoFrame(video);
            if (video.ended) break;
            if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime <= lastProcessedTime + 0.001) continue;
            frameContext.clearRect(0, 0, width, height);
            frameContext.drawImage(video, 0, 0, width, height);
            const results = await getPersonMask(segmenter, frameCanvas);
            drawPersonWithMask(context, results, width, height, backgroundColor, mode === 'video_premium' ? 1.6 : 1.1);
            coverageTotal += estimateMaskCoverage(results.segmentationMask);
            frameCount++;
            lastProcessedTime = video.currentTime;
            const percent = Math.max(4, Math.min(97, Math.round((video.currentTime / video.duration) * 100)));
            progressBar.style.width = `${percent}%`;
            statusText.textContent = `Analizando personas · ${percent}% · ${frameCount} ${frameCount === 1 ? 'fotograma' : 'fotogramas'}${scale < 1 ? ' · salida hasta 1080p' : ''}`;
        }
        if (frameCount < Math.max(1, Math.ceil(video.duration / 2))) {
            throw new Error('El equipo no pudo analizar suficientes fotogramas durante la reproducción. Cierra otras pestañas o prueba con un dispositivo más rápido.');
        }
        if (coverageTotal / frameCount < 0.003) {
            throw new Error('No se detectó una persona en el video. Este modelo está diseñado para personas, no para productos u objetos.');
        }
        if (recorder.state !== 'inactive') recorder.stop();
        const blob = await recordingPromise;
        if (!blob.size) throw new Error('No se generó un video de salida.');
        return { blob, hasAudio: audioTracks.length > 0 };
    } finally {
        if (recorder && recorder.state !== 'inactive') {
            try { recorder.stop(); } catch (_) {}
        }
        if (outputStream) outputStream.getTracks().forEach(track => track.stop());
        if (sourceStream) sourceStream.getTracks().forEach(track => track.stop());
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
    }
}

async function processRemoveBackground() {
    if (!checkUserAuth()) return;
    const input = document.getElementById('bgInput');
    const mode = document.getElementById('bgQuality').value;
    if (mode !== 'normal' && !checkPremiumAuth()) return;
    if (!input.files.length) {
        showToast('⚠️ Selecciona una imagen o video.');
        return;
    }

    const file = input.files[0];
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
    if (!isVideo && !isImage) {
        showToast('⚠️ Elige una imagen o un video compatible.');
        return;
    }
    if (isVideo && file.size > 150 * 1024 * 1024) {
        showToast('⚠️ El video supera 150 MB; prueba con un archivo más pequeño.');
        return;
    }

    const progressContainer = document.getElementById('bgProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('bgStatusText');
    const downloadArea = document.getElementById('bgDownloadArea');
    const button = document.querySelector('#bg-remover .tool-controls .btn-primary');
    let segmenter;
    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '3%';
    statusText.classList.remove('error-status');
    statusText.textContent = 'Cargando el modelo de detección de personas…';
    if (button) button.disabled = true;

    try {
        segmenter = await createSelfieSegmenter();
        if (isVideo) {
            const backgroundColor = document.getElementById('bgVideoColor').value || '#101827';
            const result = await processPersonVideo(file, segmenter, backgroundColor, mode, progressBar, statusText);
            progressBar.style.width = '100%';
            statusText.textContent = `Listo · video WebM con el fondo sustituido por el color elegido${result.hasAudio ? ' y el audio conservado' : ''}.`;
            createResultActions('bgDownloadArea', result.blob, `${getBaseName(file.name)}_fondo_nuevo.webm`, true);
        } else {
            await processPersonImage(file, segmenter, mode, progressBar, statusText);
        }
        showToast('✅ Procesamiento terminado. Revisa la vista previa antes de descargar.');
    } catch (error) {
        statusText.textContent = `No se pudo procesar: ${error.message || 'error inesperado.'}`;
        statusText.classList.add('error-status');
        showToast('❌ No se pudo procesar el archivo.');
    } finally {
        if (segmenter && !segmenter.__nubeClosed && typeof segmenter.close === 'function') {
            try { await segmenter.close(); } catch (_) {}
        }
        if (button) button.disabled = false;
        if (!statusText.classList.contains('error-status')) {
            setTimeout(() => { progressContainer.style.display = 'none'; }, 900);
        }
    }
}

/* 2. REDUCCIÓN REAL DE RUIDO EN LA PISTA DE AUDIO CON FFMPEG */
async function processRemoveBackgroundNoise() {
    if (!checkUserAuth()) return;
    const input = document.getElementById('vocalInput');
    const noiseIntensity = document.getElementById('noiseLevel').value;
    if (noiseIntensity === 'vocal_100' && !checkPremiumAuth()) return;
    if (!input.files.length) {
        showToast('⚠️ Selecciona un video con audio.');
        return;
    }

    const file = input.files[0];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const supportedExtensions = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'];
    if (!file.type.startsWith('video/') && !supportedExtensions.includes(extension)) {
        showToast('⚠️ Elige un video MP4, MOV, WEBM, MKV o AVI.');
        return;
    }
    if (file.size > 150 * 1024 * 1024) {
        showToast('⚠️ El video supera 150 MB; prueba con un archivo más pequeño.');
        return;
    }

    const progressContainer = document.getElementById('vocalProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('vocalStatusText');
    const downloadArea = document.getElementById('vocalDownloadArea');
    const button = document.querySelector('#vocal-remover .tool-controls .btn-primary');
    const inputName = `noise_input.${supportedExtensions.includes(extension) ? extension : 'mp4'}`;
    const outputName = 'noise_reduced.mp4';
    const strengths = {
        estandar: { nr: 18, floor: -25, label: 'Moderada' },
        fuerte: { nr: 30, floor: -30, label: 'Fuerte' },
        vocal_100: { nr: 42, floor: -35, label: 'Muy fuerte' }
    };
    const strength = strengths[noiseIntensity] || strengths.estandar;
    let ffmpeg;
    let progressHandler;
    let logHandler;
    let inputWritten = false;
    let outputWritten = false;
    let hasAudioStream = false;

    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '2%';
    statusText.classList.remove('error-status');
    statusText.textContent = 'Preparando el motor de audio y video…';
    if (button) button.disabled = true;

    try {
        ffmpeg = await loadFFmpeg();
        statusText.textContent = 'Leyendo y analizando las pistas del video…';
        const inputData = new Uint8Array(await file.arrayBuffer());
        await ffmpeg.writeFile(inputName, inputData);
        inputWritten = true;
        progressBar.style.width = '8%';

        logHandler = ({ message }) => {
            if (/\bAudio:/i.test(message || '')) hasAudioStream = true;
        };
        ffmpeg.on('log', logHandler);
        progressHandler = ({ progress, time }) => {
            if (!Number.isFinite(progress)) return;
            const percent = Math.max(8, Math.min(95, Math.round(progress * 84) + 8));
            progressBar.style.width = `${percent}%`;
            const seconds = Number.isFinite(time) ? ` · ${Math.max(0, time / 1000000).toFixed(1)} s` : '';
            statusText.textContent = `Reduciendo ruido ${strength.label.toLowerCase()}… ${percent}%${seconds}`;
        };
        ffmpeg.on('progress', progressHandler);
        outputWritten = true;
        const exitCode = await ffmpeg.exec([
            '-y', '-i', inputName,
            '-map', '0:v:0', '-map', '0:a:0',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-af', `afftdn=nr=${strength.nr}:nf=${strength.floor}:tn=1`,
            '-c:a', 'aac', '-b:a', '192k',
            '-movflags', '+faststart',
            outputName
        ]);
        if (exitCode !== 0) {
            if (!hasAudioStream) {
                throw new Error('El video no contiene una pista de audio legible. Selecciona un video con sonido.');
            }
            throw new Error('FFmpeg no pudo procesar las pistas de este archivo. Prueba con un video MP4 o MOV más pequeño.');
        }

        const outputData = await ffmpeg.readFile(outputName);
        const resultBlob = new Blob([outputData], { type: 'video/mp4' });
        if (!resultBlob.size) throw new Error('FFmpeg no generó un archivo de salida.');
        progressBar.style.width = '100%';
        statusText.textContent = `Listo · filtro ${strength.label.toLowerCase()} aplicado al audio; el video se recodificó como MP4.`;
        createResultActions('vocalDownloadArea', resultBlob, `${getBaseName(file.name)}_ruido_reducido.mp4`, true);
        showToast('✅ Se procesó el audio del video.');
    } catch (error) {
        const message = error.message || 'error de procesamiento.';
        const audioHint = /audio|matches no streams|stream map/i.test(message)
            ? ' Asegúrate de que el video tenga una pista de audio.'
            : '';
        statusText.textContent = `No se pudo reducir el ruido: ${message}${audioHint}`;
        statusText.classList.add('error-status');
        showToast('❌ No se pudo procesar el video. Revisa la conexión o prueba con un archivo menor.');
    } finally {
        if (ffmpeg && progressHandler) {
            try { ffmpeg.off('progress', progressHandler); } catch (_) {}
        }
        if (ffmpeg && logHandler) {
            try { ffmpeg.off('log', logHandler); } catch (_) {}
        }
        if (ffmpeg) {
            try {
                if (inputWritten) await ffmpeg.deleteFile(inputName);
                if (outputWritten) await ffmpeg.deleteFile(outputName);
            } catch (_) {
                // La limpieza temporal no afecta al archivo descargable.
            }
        }
        if (button) button.disabled = false;
        if (progressBar.style.width === '100%') {
            setTimeout(() => { progressContainer.style.display = 'none'; }, 900);
        }
    }
}

/* Motor FFmpeg WebAssembly: se carga bajo demanda para no ralentizar la página. */
let ffmpegInstance = null;
let ffmpegLoadPromise = null;
const ffmpegAssetUrls = [];
const ffmpegCdnBase = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd';
const ffmpegCoreBase = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';

async function makeBlobUrl(url, mimeType) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo descargar el motor multimedia (${response.status}).`);
    const blobUrl = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: mimeType }));
    ffmpegAssetUrls.push(blobUrl);
    return blobUrl;
}

async function loadFFmpeg() {
    if (ffmpegInstance) return ffmpegInstance;
    if (!ffmpegLoadPromise) {
        ffmpegLoadPromise = (async () => {
            const wrapperResponse = await fetch(`${ffmpegCdnBase}/ffmpeg.js`);
            if (!wrapperResponse.ok) throw new Error('No se pudo descargar la biblioteca de video.');
            const wrapperSource = await wrapperResponse.text();
            const workerPatch = 'new URL(e.p+e.u(814),e.b)';
            if (!wrapperSource.includes(workerPatch)) {
                throw new Error('La versión del motor de video cambió. Recarga la página e inténtalo de nuevo.');
            }
            const patchedWrapper = wrapperSource.replace(workerPatch, 'r.workerLoadURL');
            const wrapperUrl = URL.createObjectURL(new Blob([patchedWrapper], { type: 'text/javascript' }));
            try {
                await import(wrapperUrl);
            } finally {
                URL.revokeObjectURL(wrapperUrl);
            }
            if (!window.FFmpegWASM?.FFmpeg) {
                throw new Error('El motor de video no pudo inicializarse en este navegador.');
            }

            const ffmpeg = new window.FFmpegWASM.FFmpeg();
            const [workerLoadURL, coreURL, wasmURL] = await Promise.all([
                makeBlobUrl(`${ffmpegCdnBase}/814.ffmpeg.js`, 'text/javascript'),
                makeBlobUrl(`${ffmpegCoreBase}/ffmpeg-core.js`, 'text/javascript'),
                makeBlobUrl(`${ffmpegCoreBase}/ffmpeg-core.wasm`, 'application/wasm')
            ]);
            await ffmpeg.load({ workerLoadURL, coreURL, wasmURL });
            ffmpegInstance = ffmpeg;
            return ffmpeg;
        })();
    }
    try {
        return await ffmpegLoadPromise;
    } catch (error) {
        ffmpegLoadPromise = null;
        throw error;
    }
}

window.addEventListener('pagehide', () => {
    ffmpegAssetUrls.forEach(url => URL.revokeObjectURL(url));
});

function getVideoProfile(level) {
    const profiles = {
        baja: { width: 1280, height: 720, crf: 31, audio: '96k', label: 'Ligero · máximo 720p' },
        media: { width: 1920, height: 1080, crf: 27, audio: '128k', label: 'Equilibrado · máximo 1080p' },
        fhd_premium: { width: 1920, height: 1080, crf: 24, audio: '160k', label: 'Alta calidad · máximo 1080p' },
        '4k_premium': { width: 3840, height: 2160, crf: 27, audio: '160k', label: 'Alta calidad · máximo 4K' }
    };
    return profiles[level] || profiles.media;
}

/* 3. COMPRESOR DE VIDEO REAL */
async function processRealVideoCompression() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('compressorInput');
    const level = document.getElementById('compressionLevel').value;
    if (level.includes('premium') && !checkPremiumAuth()) return;
    if (!input.files.length) {
        showToast('⚠️ Carga un archivo de video primero.');
        return;
    }

    const file = input.files[0];
    const supportedExtensions = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (!file.type.startsWith('video/') && !supportedExtensions.includes(extension)) {
        showToast('⚠️ Elige un archivo de video MP4, MOV, WEBM, MKV o AVI.');
        return;
    }
    if (file.size > 250 * 1024 * 1024) {
        showToast('⚠️ El archivo supera 250 MB; prueba con un video más pequeño para evitar problemas de memoria.');
        return;
    }

    const progressContainer = document.getElementById('compressorProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('compressorStatusText');
    const report = document.getElementById('compressorReport');
    const downloadArea = document.getElementById('compressorDownloadArea');
    const button = document.querySelector('#compressor .tool-controls .btn-primary');
    const profile = getVideoProfile(level);
    const inputName = `input.${supportedExtensions.includes(extension) ? extension : 'mp4'}`;
    const outputName = 'compressed.mp4';
    let ffmpeg = null;
    let progressHandler = null;
    let inputWritten = false;
    let outputWritten = false;

    downloadArea.innerHTML = '';
    report.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '2%';
    statusText.textContent = 'Preparando el motor de video…';
    statusText.classList.remove('error-status');
    if (button) button.disabled = true;

    try {
        ffmpeg = await loadFFmpeg();
        statusText.textContent = 'Analizando el video y cargándolo en el motor…';
        progressBar.style.width = '8%';
        const inputData = new Uint8Array(await file.arrayBuffer());
        await ffmpeg.writeFile(inputName, inputData);
        inputWritten = true;

        const scaleFilter = `scale=w='min(${profile.width},iw)':h='min(${profile.height},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
        progressHandler = ({ progress, time }) => {
            if (!Number.isFinite(progress)) return;
            const percent = Math.max(8, Math.min(95, Math.round(progress * 84) + 8));
            progressBar.style.width = `${percent}%`;
            const seconds = Number.isFinite(time) ? ` · ${Math.max(0, time / 1_000_000).toFixed(1)} s procesados` : '';
            statusText.textContent = `Recodificando video… ${percent}%${seconds}`;
        };
        ffmpeg.on('progress', progressHandler);
        statusText.textContent = `${profile.label}: convirtiendo imagen y audio a MP4…`;
        await ffmpeg.exec([
            '-y', '-i', inputName,
            '-map', '0:v:0', '-map', '0:a?',
            '-vf', scaleFilter,
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(profile.crf),
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', profile.audio,
            '-movflags', '+faststart',
            outputName
        ]);

        outputWritten = true;
        const outputData = await ffmpeg.readFile(outputName);
        const compressedBlob = new Blob([outputData], { type: 'video/mp4' });
        if (!compressedBlob.size) throw new Error('El motor no generó un video de salida.');

        const delta = file.size - compressedBlob.size;
        const savedPercent = Math.round((delta / file.size) * 100);
        const result = delta > 0
            ? `Reducción de ${savedPercent}% (${formatBytes(delta)} menos)`
            : `El nuevo MP4 pesa ${formatBytes(Math.abs(delta))} más (${Math.abs(savedPercent)}%); el original ya estaba más optimizado para este perfil.`;
        report.innerHTML = '';
        const comparison = document.createElement('div');
        comparison.className = 'comparison-grid';
        comparison.innerHTML = `
            <div><span>Original</span><strong>${formatBytes(file.size)}</strong></div>
            <div><span>Resultado MP4</span><strong>${formatBytes(compressedBlob.size)}</strong></div>
            <div class="comparison-result"><span>Resultado</span><strong></strong></div>`;
        comparison.querySelector('.comparison-result strong').textContent = result;
        report.appendChild(comparison);
        createResultActions('compressorDownloadArea', compressedBlob, `${getBaseName(file.name)}_comprimido.mp4`, true);
        progressBar.style.width = '100%';
        statusText.textContent = `Listo · ${profile.label}. El video fue recodificado; revisa el tamaño antes de descargar.`;
        showToast(delta > 0 ? '✅ Video recodificado y reducido.' : '✅ Video recodificado; revisa la comparación de tamaño.');
    } catch (error) {
        statusText.textContent = `No se pudo comprimir: ${error.message || 'error de procesamiento.'}`;
        statusText.classList.add('error-status');
        showToast('❌ No se pudo procesar el video. Revisa tu conexión o prueba con un archivo menor.');
    } finally {
        if (ffmpeg && progressHandler) {
            try { ffmpeg.off('progress', progressHandler); } catch (_) {}
        }
        if (ffmpeg) {
            try {
                if (inputWritten) await ffmpeg.deleteFile(inputName);
                if (outputWritten) await ffmpeg.deleteFile(outputName);
            } catch (_) {
                // La limpieza temporal no afecta al archivo ya descargable.
            }
        }
        if (button) button.disabled = false;
        if (progressBar.style.width !== '100%') progressContainer.style.display = 'none';
    }
}

/* 4. CONVERSOR REAL DE DOCUMENTOS: PDF, DOCX, TXT, HTML y CSV a PDF/DOCX/TXT. */
const documentLibraryPromises = new Map();
const documentCdn = {
    zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
};

function loadBrowserLibrary(key, globalCheck) {
    if (globalCheck()) return Promise.resolve();
    if (documentLibraryPromises.has(key)) return documentLibraryPromises.get(key);
    const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = documentCdn[key];
        script.async = true;
        script.onload = () => globalCheck()
            ? resolve()
            : reject(new Error(`La biblioteca ${key} no quedó disponible.`));
        script.onerror = () => reject(new Error(`No se pudo cargar la biblioteca ${key}; revisa tu conexión.`));
        document.head.appendChild(script);
    });
    documentLibraryPromises.set(key, promise);
    return promise;
}

function getBaseName(fileName) {
    return fileName.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_') || 'documento';
}

function escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function extractDocumentText(file) {
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (extension === 'pdf') {
        await loadBrowserLibrary('pdf', () => Boolean(window.pdfjsLib));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            pages.push(content.items.map(item => item.str).join(' '));
        }
        return pages.join('\n\n');
    }
    if (extension === 'docx') {
        await loadBrowserLibrary('mammoth', () => Boolean(window.mammoth));
        const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        return result.value || '';
    }
    if (['txt', 'text', 'csv'].includes(extension)) {
        return new TextDecoder('utf-8').decode(await file.arrayBuffer()).replace(/^\uFEFF/, '');
    }
    if (['html', 'htm'].includes(extension)) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(await file.text(), 'text/html');
        parsed.querySelectorAll('script,style,template,noscript').forEach(node => node.remove());
        parsed.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
        parsed.querySelectorAll('p,div,li,tr,h1,h2,h3,h4,h5,h6,blockquote').forEach(node => node.append('\n'));
        return (parsed.body.textContent || '').replace(/\u00a0/g, ' ');
    }
    throw new Error('Formato de entrada no compatible. Usa PDF, DOCX, TXT, HTML o CSV.');
}

async function makeDocx(text) {
    await loadBrowserLibrary('zip', () => Boolean(window.JSZip));
    const zip = new window.JSZip();
    const paragraphs = text.split(/\r?\n/).map(line =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    ).join('');
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`);
    return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}

async function makePdf(text) {
    await loadBrowserLibrary('jspdf', () => Boolean(window.jspdf?.jsPDF));
    const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const lineHeight = 15;
    let y = margin;
    const lines = text.split(/\r?\n/).flatMap(line =>
        line ? pdf.splitTextToSize(line, pageWidth - margin * 2) : ['']
    );
    for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
        if (line) pdf.text(line, margin, y);
        y += lineHeight;
    }
    return pdf.output('blob');
}

async function processConversion() {
    if (!checkUserAuth()) return;
    const input = document.getElementById('converterInput');
    const target = document.getElementById('targetFormat').value;
    if (!input.files.length) {
        showToast('⚠️ Carga un documento primero.');
        return;
    }

    const file = input.files[0];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'docx', 'txt', 'text', 'html', 'htm', 'csv'].includes(extension)) {
        showToast('⚠️ Formato no compatible. Usa PDF, DOCX, TXT, HTML o CSV.');
        return;
    }
    const progressContainer = document.getElementById('converterProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('converterStatusText');
    const downloadArea = document.getElementById('converterDownloadArea');
    const button = document.querySelector('#converter .tool-controls .btn-primary');
    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '8%';
    statusText.textContent = 'Leyendo el contenido del documento…';
    statusText.classList.remove('error-status');
    if (button) button.disabled = true;

    try {
        const text = (await extractDocumentText(file)).replace(/\r\n?/g, '\n').trim();
        if (!text) {
            throw new Error('No se encontró texto. Si el PDF es un escaneo o una imagen, necesitas OCR antes de convertirlo.');
        }
        if (text.length > 2_000_000) {
            throw new Error('El documento contiene demasiado texto para procesarlo en una sola conversión.');
        }
        progressBar.style.width = '55%';
        statusText.textContent = `Generando un archivo ${target.toUpperCase()} válido…`;

        let blob;
        if (target === 'docx') blob = await makeDocx(text);
        else if (target === 'pdf') blob = await makePdf(text);
        else if (target === 'txt') blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        else throw new Error('Formato de salida no compatible.');

        const outputName = `${getBaseName(file.name)}_convertido.${target}`;
        createDownloadButton('converterDownloadArea', blob, outputName);
        progressBar.style.width = '100%';
        statusText.textContent = `Conversión terminada · ${formatBytes(blob.size)} · ${outputName}`;
        showToast(`✅ Documento convertido a ${target.toUpperCase()}.`);
    } catch (error) {
        statusText.textContent = `No se pudo convertir: ${error.message || 'error de procesamiento.'}`;
        statusText.classList.add('error-status');
        showToast('❌ No se pudo convertir el documento; revisa el formato y vuelve a intentarlo.');
    } finally {
        if (button) button.disabled = false;
        if (progressBar.style.width !== '100%') progressContainer.style.display = 'none';
    }
}

function createDownloadButton(containerId, blob, fileName) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.className = 'download-link-btn';
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-download';
    const label = document.createElement('span');
    label.textContent = `Descargar ${fileName}`;
    link.append(icon, label);
    container.replaceChildren(link);
}

/* 5. GESTIÓN DE PLANES Y PAYPAL */
function initCheckout(planName, amount) {
    if (!checkUserAuth()) return;

    activePlanName = planName;
    activeCheckoutAmount = amount.toFixed(2);

    document.getElementById('selectedPlanText').textContent = `${planName} (${currentDurationType.toUpperCase()}) - $${activeCheckoutAmount} USD`;
    document.getElementById('paymentModal').classList.add('active');

    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';

    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: activeCheckoutAmount },
                        payee: { email_address: 'morilloysaia6@gmail.com' },
                        description: `Suscripción nube-toolsv1 - ${planName} (${currentDurationType})`
                    }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(details => {
                    if (details.status === 'COMPLETED') {
                        grantVIPAccess(planName);
                    } else {
                        showToast('❌ Su cuenta de PayPal no cuenta con fondos suficientes para realizar esta opción.');
                    }
                }).catch(() => {
                    showToast('❌ Su cuenta de PayPal no cuenta con fondos suficientes para realizar esta opción.');
                });
            }
        }).render('#paypal-button-container');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function grantVIPAccess(planName) {
    let daysToAdd = currentDurationType === 'semanal' ? 7 : (currentDurationType === 'mensual' ? 30 : 365);
    let expireTime = new Date().getTime() + (daysToAdd * 24 * 60 * 60 * 1000);

    currentUser.isPremium = true;
    currentUser.planName = planName;
    currentUser.expireTimestamp = expireTime;
    saveDatabase();

    updateUserSession();
    closePaymentModal();
    showToast(`🎉 ¡Compra confirmada! Cuenta VIP activa.`);
}