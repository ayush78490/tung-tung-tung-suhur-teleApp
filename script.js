// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
if (!tg) {
    console.error("Telegram Web App SDK not loaded");
    alert("Telegram Web App SDK failed to load");
}
tg.expand();
console.log("Telegram Web App SDK version:", tg.version);

if (tg.version >= "6.1") {
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#14f195');
    tg.setBackgroundColor('#f5f5f5');
} else {
    console.warn("Skipping unsupported features for SDK version", tg.version);
}

document.body.className = tg.colorScheme;
tg.onEvent('themeChanged', () => {
    document.body.className = tg.colorScheme;
});

let score = 0;
let walletConnected = false;
let publicKey = null;
let provider = null;

const connectWalletBtn = document.getElementById('connect-wallet');
const walletSection = document.getElementById('wallet-section');
const gameSection = document.getElementById('game-section');
const walletAddress = document.getElementById('wallet-address');
const scoreDisplay = document.getElementById('score-display');
const coin = document.getElementById('coin');
const logoutBtn = document.getElementById('logout-btn');
const telegramLogin = document.getElementById('telegram-login');
const qrLoginBtn = document.getElementById('qr-login');

async function initProvider() {
    if ('phantom' in window) {
        provider = window.phantom.solana;
        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open('https://phantom.app/', '_blank');
    throw new Error("Phantom wallet not installed");
}

connectWalletBtn.addEventListener('click', async () => {
    try {
        provider = await initProvider();
        const response = await provider.connect();
        publicKey = response.publicKey.toString();
        
        localStorage.setItem('solanaWallet', publicKey);
        
        const telegramUser = JSON.parse(localStorage.getItem('telegramUser'));
        
        if (telegramUser) {
            await associateAccounts(telegramUser.id, publicKey);
        }
        
        walletAddress.textContent = `Connected: ${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`;
        walletSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        
        tg.sendData(JSON.stringify({
            type: 'wallet_connected',
            address: publicKey,
            telegramId: telegramUser?.id
        }));
        
        walletConnected = true;
    } catch (error) {
        console.error("Wallet connection error:", error);
        tg.showAlert("Failed to connect wallet: " + error.message);
    }
});

async function associateAccounts(telegramId, walletAddress) {
    try {
        const response = await fetch('https://your-backend.com/api/associate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId, walletAddress }),
        });
        if (!response.ok) throw new Error('Failed to associate accounts');
    } catch (error) {
        console.error('Association error:', error);
    }
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('telegramUser');
    localStorage.removeItem('solanaWallet');
    
    if (provider?.disconnect) {
        provider.disconnect();
    }
    
    score = 0;
    publicKey = null;
    provider = null;
    walletConnected = false;
    
    gameSection.classList.add('hidden');
    walletSection.classList.add('hidden');
    telegramLogin.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    scoreDisplay.textContent = 'Score: 0';
});

coin.addEventListener('click', () => {
    if (!walletConnected) return;
    
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    
    coin.style.transform = 'scale(0.95)';
    setTimeout(() => coin.style.transform = 'scale(1)', 100);
    
    if (score % 10 === 0) {
        tg.sendData(JSON.stringify({
            type: 'score_update',
            address: publicKey,
            score: score
        }));
    }
});

function onTelegramAuth(user) {
    console.log("Telegram Auth User:", JSON.stringify(user, null, 2));
    console.log("Telegram Auth Attempt - Bot: @tungTungtung7849_bot, Domain: https://tung-tung-tung-suhur-tele-app.vercel.app/");
    if (!user) {
        console.error("No user data received from Telegram Login Widget");
        tg.showAlert("Telegram login failed: No user data received");
        return;
    }
    if (!validateAuthData(user)) {
        console.error("Invalid auth data:", JSON.stringify(user, null, 2));
        tg.showAlert("Invalid authentication: " + JSON.stringify(user));
        return;
    }
    
    localStorage.setItem('telegramUser', JSON.stringify(user));
    telegramLogin.classList.add('hidden');
    walletSection.classList.remove('hidden');
    tg.showAlert(`Logged in as ${user.first_name} ${user.last_name || ''}`);
}

function validateAuthData(authData) {
    const requiredFields = ['id', 'first_name', 'auth_date'];
    return requiredFields.every(field => authData[field]);
}

qrLoginBtn.addEventListener('click', () => {
    tg.showQRLogin({
        bot_id: '@tungTungtung7849_bot',
        onAuth: onTelegramAuth
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("App loaded at: https://tung-tung-tung-suhur-tele-app.vercel.app/");
    const telegramUser = localStorage.getItem('telegramUser');
    const solanaWallet = localStorage.getItem('solanaWallet');
    
    if (telegramUser) {
        telegramLogin.classList.add('hidden');
        walletSection.classList.remove('hidden');
    }
    
    if (solanaWallet) {
        publicKey = solanaWallet;
        walletAddress.textContent = `Connected: ${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`;
        walletSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        walletConnected = true;
    }
});

tg.onEvent('viewportChanged', tg.expand);
tg.ready();