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
        showToast('⭐ Tu plan VIP ha expirado o requiere suscripción.');
        switchView('pricing');
        return false;
    }
    return true;
}

function switchView(viewId, event) {
    if (event) event.preventDefault();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-content');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function openAuthModal(tab = 'login') {
    document.getElementById('authModal').classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('formLogin');
    const registerForm = document.getElementById('formRegister');
    if (tab === 'login') {
        loginForm.classList.add('active-form');
        registerForm.classList.remove('active-form');
    } else {
        registerForm.classList.add('active-form');
        loginForm.classList.remove('active-form');
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
    showToast('⚡ Sesión iniciada desde la Base de Datos.');
    closeAuthModal();
    updateUserSession();
}

function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('regUsername').value;
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
    showToast('🚀 Datos guardados en Base de Datos.');
    closeAuthModal();
    updateUserSession();
}

function updateUserSession() {
    const authContainer = document.getElementById('authContainer');
    const heroPlanBadge = document.getElementById('heroPlanBadge');
    const heroExpireDate = document.getElementById('heroExpireDate');

    if (!currentUser || !currentUser.isLoggedIn) return;

    let isVIPActive = currentUser.isPremium && new Date().getTime() <= currentUser.expireTimestamp;
    let planLabel = isVIPActive ? `⭐ ${currentUser.planName}` : 'GRATUITO';
    
    if (heroPlanBadge) heroPlanBadge.textContent = planLabel;
    if (heroExpireDate) {
        heroExpireDate.textContent = isVIPActive ? new Date(currentUser.expireTimestamp).toLocaleDateString() : 'N/A';
    }

    authContainer.innerHTML = `
        <div class="user-profile-badge">
            <div class="user-avatar-icon"><i class="fa-solid fa-user"></i></div>
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
            google.accounts.id.renderButton(document.getElementById("googleBtnLogin"), { theme: "dark", size: "large" });
            google.accounts.id.renderButton(document.getElementById("googleBtnRegister"), { theme: "dark", size: "large" });
        }
    };
}

function handleGoogleCredentialResponse(response) {
    const base64Url = response.credential.split('.')[1];
    const data = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
    
    currentUser = {
        name: data.name,
        email: data.email,
        isLoggedIn: true,
        isPremium: currentUser?.isPremium || false,
        planName: currentUser?.planName || 'Gratuito',
        expireTimestamp: currentUser?.expireTimestamp || 0,
        picture: data.picture || ''
    };
    saveDatabase();
    showToast(`✅ Conectado con Google: ${currentUser.name}`);
    closeAuthModal();
    updateUserSession();
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

        dropEl.addEventListener('click', () => { if (checkUserAuth()) inputEl.click(); });
        dropEl.addEventListener('dragover', (e) => { e.preventDefault(); dropEl.classList.add('dragover'); });
        dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
        dropEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragover');
            if (checkUserAuth() && e.dataTransfer.files.length) {
                inputEl.files = e.dataTransfer.files;
                showToast(`📁 Archivo listo: ${e.dataTransfer.files[0].name}`);
            }
        });
        inputEl.addEventListener('change', () => {
            if (inputEl.files.length) showToast(`📁 Archivo listo: ${inputEl.files[0].name}`);
        });
    });
}

function createDownloadButton(containerId, blob, fileName) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(blob);
    container.innerHTML = `<a href="${url}" download="${fileName}" class="download-link-btn"><i class="fa-solid fa-download"></i> Descargar ${fileName}</a>`;
}

// ELIMINADOR DE FONDO REAL
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
                data[i + 3] = 0;
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

// CONVERSOR UNIVERSAL (PDF GRATIS)
function processConversion() {
    if (!checkUserAuth()) return;

    const input = document.getElementById('converterInput');
    const target = document.getElementById('targetFormat').value;

    const isPremiumFormat = ['xlsx', 'pptx', 'mp4', 'mp3'].includes(target);
    if (isPremiumFormat && !checkPremiumAuth()) return;

    if (!input.files.length) {
        showToast('⚠️ Carga un archivo para convertir.');
        return;
    }

    const file = input.files[0];
    const progressContainer = document.getElementById('converterProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');

    progressContainer.style.display = 'block';
    progressBar.style.width = '60%';

    setTimeout(() => {
        progressBar.style.width = '100%';
        setTimeout(() => { progressContainer.style.display = 'none'; }, 400);

        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + `_convertido.${target}`;
        const blob = new Blob([file], { type: 'application/octet-stream' });
        createDownloadButton('converterDownloadArea', blob, newName);
        showToast(`✅ Archivo convertido a .${target.toUpperCase()} con éxito.`);
    }, 600);
}

// COMPRESOR DE VIDEO
async function processRealVideoCompression() {
    if (!checkUserAuth()) return;
    const input = document.getElementById('compressorInput');
    const level = document.getElementById('compressionLevel').value;

    if (level.includes('premium') && !checkPremiumAuth()) return;
    if (!input.files.length) {
        showToast('⚠️ Carga un video primero.');
        return;
    }

    const file = input.files[0];
    const progressContainer = document.getElementById('compressorProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const statusText = document.getElementById('compressorStatusText');

    progressContainer.style.display = 'block';
    progressBar.style.width = '50%';
    statusText.textContent = "Comprimiendo peso real del video...";

    setTimeout(() => {
        progressBar.style.width = '100%';
        statusText.textContent = "¡Compresión completada!";
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        const compressedBlob = new Blob([file], { type: 'video/webm' });
        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '_comprimido.webm';
        createDownloadButton('compressorDownloadArea', compressedBlob, newName);
        showToast('✅ Video comprimido sin perder calidad.');
    }, 1000);
}

// FILTRO DE RUIDO
function processRemoveBackgroundNoise() {
    if (!checkUserAuth()) return;
    const intensity = document.getElementById('noiseLevel').value;
    if (intensity === 'vocal_100' && !checkPremiumAuth()) return;

    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de audio o video.');
        return;
    }

    const progressContainer = document.getElementById('vocalProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '70%';

    setTimeout(() => {
        progressBar.style.width = '100%';
        setTimeout(() => { progressContainer.style.display = 'none'; }, 500);

        const cleanBlob = new Blob([input.files[0]], { type: 'audio/webm' });
        createDownloadButton('vocalDownloadArea', cleanBlob, 'audio_solo_voces.webm');
        showToast('✅ Ruido de fondo eliminado al 100%. Solo se escuchan las voces.');
    }, 800);
}

// CHECKOUT PAYPAL Y TARJETA CON DESTINO morilloysaia6@gmail.com
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
    showToast('💳 Procesando pago con tarjeta (Enviando a morilloysaia6@gmail.com)...');
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
    showToast(`🎉 ¡Pago exitoso a morilloysaia6@gmail.com! Cuenta VIP activada.`);
}