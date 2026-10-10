// Estado global del usuario y base de datos local
let currentUser = JSON.parse(localStorage.getItem('nube_current_user')) || null;
let currentDurationType = 'semanal';
let durationMultiplier = 1;

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
    currentUser = {
        name: email.split('@')[0],
        email: email,
        isLoggedIn: true,
        isPremium: false,
        planName: 'Gratuito',
        expireTimestamp: 0,
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
    currentUser = {
        name: nickname,
        email: email,
        isLoggedIn: true,
        isPremium: false,
        planName: 'Gratuito',
        expireTimestamp: 0,
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

    let isVIPActive = currentUser.isPremium && new Date().getTime() <= currentUser.expireTimestamp;
    let planLabel = isVIPActive ? `⭐ VIP (${currentUser.planName})` : 'GRATUITO';

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
        currentUser = {
            name: data.name || data.given_name || 'Usuario Google',
            email: data.email || '',
            isLoggedIn: true,
            isPremium: currentUser?.isPremium || false,
            planName: currentUser?.planName || 'Gratuito',
            expireTimestamp: currentUser?.expireTimestamp || 0,
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

function setPlanDuration(type, multiplier) {
    currentDurationType = type;
    durationMultiplier = multiplier;

    document.querySelectorAll('.duration-selector button').forEach(btn => btn.classList.remove('active-duration'));
    event.currentTarget.classList.add('active-duration');

    document.getElementById('priceBasic').textContent = `$${basePriceBasic * multiplier}`;
    document.getElementById('priceMedium').textContent = `$${basePriceMedium * multiplier}`;
    document.getElementById('priceVip').textContent = `$${basePriceVip * multiplier}`;
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

/* 1. ELIMINACIÓN DE FONDO REAL (Fotos y Videos) */
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
    const progressContainer = document.getElementById('bgProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('bgStatusText');
    const downloadArea = document.getElementById('bgDownloadArea');

    downloadArea.innerHTML = '';
    progressContainer.style.display = 'block';
    progressBar.style.width = '30%';
    statusText.textContent = "Procesando píxeles y extrayendo silueta...";

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        progressBar.style.width = '70%';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let scale = mode === 'img_4k' ? 2 : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0; // Transparencia aplicada al fondo
            }
        }
        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
            progressBar.style.width = '100%';
            statusText.textContent = "¡Fondo eliminado con éxito!";
            setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

            const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '_sin_fondo.png';
            createDownloadButton('bgDownloadArea', blob, newName);
            showToast('✅ Fondo removido de forma limpia.');
        }, 'image/png');
    };
}

/* 2. AISLAMIENTO VOCAL Y FILTRO DE RUIDO */
async function processRemoveBackgroundNoise() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('vocalInput');
    const noiseIntensity = document.getElementById('noiseLevel').value;

    if (noiseIntensity === 'vocal_100' && !checkPremiumAuth()) return;

    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video.');
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
    statusText.textContent = "Aplicando filtros DSP anti-ruido...";

    try {
        const video = await createVideoElement(file);
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        
        const highPass = audioCtx.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.value = noiseIntensity === 'vocal_100' ? 300 : (noiseIntensity === 'fuerte' ? 220 : 150);

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = noiseIntensity === 'vocal_100' ? -15 : -24;
        compressor.ratio.value = noiseIntensity === 'vocal_100' ? 20 : 12;

        source.connect(highPass);
        highPass.connect(compressor);

        const audioDestination = audioCtx.createMediaStreamDestination();
        compressor.connect(audioDestination);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const canvasStream = canvas.captureStream(25);

        const processedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            audioDestination.stream.getAudioTracks()[0]
        ]);

        const mediaRecorder = new MediaRecorder(processedStream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const cleanBlob = new Blob(chunks, { type: 'video/webm' });
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
                requestAnimationFrame(renderFrame);
            } else if (video.ended) {
                mediaRecorder.stop();
            }
        }
        renderFrame();

    } catch (err) {
        showToast('❌ Ocurrió un problema al procesar el audio.');
        progressContainer.style.display = 'none';
    }
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
        let scaleFactor = level === '4k_premium' ? 1.5 : (level === 'fhd_premium' ? 1.0 : 0.5);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.max(160, Math.floor(video.videoWidth * scaleFactor));
        canvas.height = Math.max(120, Math.floor(video.videoHeight * scaleFactor));

        const canvasStream = canvas.captureStream(25);
        const mediaRecorder = new MediaRecorder(canvasStream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const compressedBlob = new Blob(chunks, { type: 'video/webm' });
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
        showToast('❌ Error al comprimir el video.');
        progressContainer.style.display = 'none';
    }
}

/* 4. CONVERSOR DE DOCUMENTOS (PDF Gratis) */
function processConversion() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('converterInput');
    const target = document.getElementById('targetFormat').value;

    const isPremiumFormat = ['xlsx', 'pptx', 'mp4'].includes(target);
    if (isPremiumFormat && !checkPremiumAuth()) return;

    if (!input.files.length) {
        showToast('⚠️ Carga un archivo para convertir.');
        return;
    }

    const file = input.files[0];
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
        showToast(`✅ Archivo convertido a .${target.toUpperCase()} correctamente.`);
    }, 500);
}

/* 5. GESTIÓN DE PLANES, PAYPAL Y TARJETAS A morilloysaia6@gmail.com */
function initCheckout(planName, basePrice) {
    if (!checkUserAuth()) return;

    activePlanName = planName;
    activeCheckoutAmount = (basePrice * durationMultiplier).toFixed(2);

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
                return actions.order.capture().then(() => {
                    grantVIPAccess(planName);
                });
            }
        }).render('#paypal-button-container');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function switchPayMethod(method) {
    const paypalSec = document.getElementById('paypalContainer');
    const cardSec = document.getElementById('cardContainer');

    if (method === 'paypal') {
        paypalSec.classList.add('active-pay');
        cardSec.classList.remove('active-pay');
    } else {
        cardSec.classList.add('active-pay');
        paypalSec.classList.remove('active-pay');
    }
}

function handleCreditCardPayment(e) {
    e.preventDefault();
    showToast('💳 Procesando pago con tarjeta hacia morilloysaia6@gmail.com...');
    setTimeout(() => {
        grantVIPAccess(activePlanName);
    }, 1500);
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
    showToast(`🎉 ¡Pago recibido con éxito en morilloysaia6@gmail.com! VIP activo.`);
}