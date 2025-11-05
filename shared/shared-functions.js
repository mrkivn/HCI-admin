function showButtonLoading(button, originalText = null) {
    if (!button) return;
    button.disabled = true;
    if (originalText) {
        button.setAttribute('data-original-text', originalText);
    }
    const text = button.getAttribute('data-original-text') || button.textContent;
    button.setAttribute('data-original-text', text);
    button.classList.add('reloading');
    
    // Store original HTML if it exists
    const originalHTML = button.innerHTML;
    if (!button.getAttribute('data-original-html')) {
        button.setAttribute('data-original-html', originalHTML);
    }
    
    button.innerHTML = '<i class="fas fa-spinner"></i> Loading...';
}

function hideButtonLoading(button) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('reloading');
    
    const originalHTML = button.getAttribute('data-original-html');
    const originalText = button.getAttribute('data-original-text');
    
    if (originalHTML) {
        button.innerHTML = originalHTML;
    } else if (originalText) {
        button.textContent = originalText;
    }
}

function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove existing overlay if any
    const existingOverlay = container.querySelector('.loading-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner"><i class="fas fa-spinner fa-3x"></i><p>${message}</p></div>`;
    container.style.position = 'relative';
    container.appendChild(overlay);
    
    // Trigger animation
    setTimeout(() => {
        overlay.style.animation = 'fadeIn 0.3s ease';
    }, 10);
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const overlay = container.querySelector('.loading-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

async function withLoading(asyncFn, button = null) {
    if (button) showButtonLoading(button);
    
    try {
        const result = await asyncFn();
        return result;
    } finally {
        if (button) hideButtonLoading(button);
    }
}

async function withErrorHandling(asyncFn, errorMessage = 'An error occurred') {
    try {
        return await asyncFn();
    } catch (error) {
        console.error(errorMessage, error);
        showNotification(errorMessage, 'error');
        return null;
    }
}

async function initializeData() {
    try {
        await window.firestoreDB.initializeFirestoreData();
    } catch (error) {
        console.error('Failed to initialize Firestore:', error);
        showNotification('Failed to connect to database. Please refresh the page.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
});

function generateId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatPrice(amount) {
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateNights(checkin, checkout) {
    const start = new Date(checkin);
    const end = new Date(checkout);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-PH', options);
}

function formatTime(timeString) {
    if (!timeString) return '';
    return timeString;
}

function timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + ' min ago';
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
    
    const days = Math.floor(hours / 24);
    return days + ' day' + (days > 1 ? 's' : '') + ' ago';
}

function checkAuth(userType = 'customer') {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.type !== userType) {
        window.location.href = userType === 'customer' ? '/login.html' : '/staff-login.html';
        return null;
    }
    return user;
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '/login.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('user'));
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme + '-mode');
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
});

function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

function initAccountDropdown() {
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');
    
    if (accountBtn && accountDropdown) {
        accountBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accountDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!accountBtn.contains(e.target) && !accountDropdown.contains(e.target)) {
                accountDropdown.classList.remove('show');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initAccountDropdown();
    initRevealAnimations();
    applyPageLoadAnimations();
});

async function getFirestoreData(collectionName) {
    try {
        return await window.firestoreDB.getFirestoreData(collectionName);
    } catch (error) {
        console.error(`Error reading ${collectionName} from Firestore:`, error);
        return [];
    }
}

async function setFirestoreData(collectionName, data) {
    try {
        return await window.firestoreDB.setFirestoreData(collectionName, data);
    } catch (error) {
        console.error(`Error writing ${collectionName} to Firestore:`, error);
        return false;
    }
}

async function addFirestoreDocument(collectionName, data) {
    try {
        return await window.firestoreDB.addDocument(collectionName, data);
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        return null;
    }
}

async function updateFirestoreDocument(collectionName, docId, data) {
    try {
        return await window.firestoreDB.updateDocument(collectionName, docId, data);
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return false;
    }
}

async function deleteFirestoreDocument(collectionName, docId) {
    try {
        return await window.firestoreDB.deleteDocument(collectionName, docId);
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return false;
    }
}

const getLocalData = getFirestoreData;
const setLocalData = setFirestoreData;

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function isToday(dateString) {
    return dateString === getTodayDate();
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\+63\s?\d{3}\s?\d{3}\s?\d{4}$/;
    return phoneRegex.test(phone);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function filterByDate(array, dateField, targetDate) {
    return array.filter(item => item[dateField] === targetDate);
}

function countByStatus(array, status) {
    return array.filter(item => item.status === status).length;
}

function sortByTimestamp(array, field = 'timestamp') {
    return array.sort((a, b) => b[field] - a[field]);
}

function calculateTotalRevenue(invoices, dateFilter = null) {
    return invoices
        .filter(inv => inv.paymentStatus === 'Paid')
        .filter(inv => !dateFilter || isToday(new Date(inv.timestamp).toISOString().split('T')[0]))
        .reduce((total, inv) => total + inv.total, 0);
}

/* ============================================
   Reload Animation Functions
   ============================================ */

/**
 * Show reload button with animation
 */
function showReloadButton(container, onClick) {
    const existingBtn = container.querySelector('.reload-btn');
    if (existingBtn) return existingBtn;
    
    const btn = document.createElement('button');
    btn.className = 'reload-btn';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Reload';
    btn.onclick = onClick;
    container.appendChild(btn);
    return btn;
}

/**
 * Animate reload button
 */
function animateReloadButton(button) {
    if (!button) return;
    button.classList.add('reloading');
    const icon = button.querySelector('i');
    if (icon) {
        icon.style.animation = 'spin 1s linear infinite';
    }
}

/**
 * Stop reload button animation
 */
function stopReloadButtonAnimation(button) {
    if (!button) return;
    button.classList.remove('reloading');
    const icon = button.querySelector('i');
    if (icon) {
        icon.style.animation = '';
    }
}

/**
 * Add smooth reload animation to content - DRAMATIC VERSION
 */
function addReloadAnimation(container) {
    if (!container) return;
    container.classList.add('smooth-update', 'updating');
    
    setTimeout(() => {
        container.classList.remove('updating');
        container.classList.add('reload-content');
        // Remove animation class after animation completes
        setTimeout(() => {
            container.classList.remove('reload-content');
        }, 800);
    }, 100);
}

/**
 * Show reload indicator
 */
function showReloadIndicator(container, message = 'Auto-refreshing...') {
    const existing = container.querySelector('.reload-indicator');
    if (existing) return existing;
    
    const indicator = document.createElement('div');
    indicator.className = 'reload-indicator';
    indicator.innerHTML = `<i class="fas fa-sync-alt"></i> <span>${message}</span>`;
    container.appendChild(indicator);
    return indicator;
}

/**
 * Update reload indicator
 */
function updateReloadIndicator(indicator, message, isActive = false) {
    if (!indicator) return;
    const span = indicator.querySelector('span');
    if (span) {
        span.textContent = message;
    }
    if (isActive) {
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
    }
}

/**
 * Hide reload indicator
 */
function hideReloadIndicator(container) {
    const indicator = container.querySelector('.reload-indicator');
    if (indicator) {
        indicator.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
    }
}

/**
 * Wrapper function for reload operations with animation
 */
async function withReloadAnimation(asyncFn, options = {}) {
    const {
        containerId = null,
        button = null,
        showIndicator = false,
        indicatorMessage = 'Loading...',
        smoothUpdate = true
    } = options;
    
    // Show loading states
    if (containerId) {
        showLoading(containerId, indicatorMessage);
    }
    
    if (button) {
        animateReloadButton(button);
    }
    
    if (showIndicator && containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            showReloadIndicator(container.parentElement, indicatorMessage);
        }
    }
    
    try {
        const result = await asyncFn();
        
        // Apply smooth update animation to container
        if (containerId && smoothUpdate) {
            const container = document.getElementById(containerId);
            if (container) {
                addReloadAnimation(container);
            }
        }
        
        return result;
    } finally {
        // Hide loading states
        if (containerId) {
            setTimeout(() => hideLoading(containerId), 300);
        }
        
        if (button) {
            stopReloadButtonAnimation(button);
        }
        
        if (showIndicator && containerId) {
            setTimeout(() => {
                const container = document.getElementById(containerId);
                if (container) {
                    hideReloadIndicator(container.parentElement);
                }
            }, 500);
        }
    }
}

/**
 * Create skeleton loading placeholders
 */
function showSkeletonLoading(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text" style="width: 60%;"></div>
        `;
        container.appendChild(skeleton);
    }
}

/**
 * Remove skeleton loading
 */
function hideSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => {
        skeleton.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => skeleton.remove(), 300);
    });
}

/* ============================================
   Reveal on Scroll & Page Load Animation Logic
   ============================================ */

function initRevealAnimations() {
    const elements = Array.from(document.querySelectorAll('[data-reveal], .reveal'));
    if (elements.length === 0) return;

    // Default variant if none specified
    elements.forEach(el => {
        if (!el.classList.contains('reveal')) el.classList.add('reveal');
        // Allow data-reveal="up|down|left|right|fade"
        const variant = el.getAttribute('data-reveal');
        if (variant && !el.classList.contains(`reveal-${variant}`)) {
            el.classList.add(`reveal-${variant}`);
        }
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // Unobserve once revealed for performance
                obs.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.12
    });

    elements.forEach(el => observer.observe(el));
}

function applyPageLoadAnimations() {
    // Add a subtle fade to common elements on initial load
    const selectors = [
        'h1, h2, h3, .navbar, .card, .stat-card, .service-box, .btn',
        '.table, .modal-content'
    ];
    const targets = document.querySelectorAll(selectors.join(', '));
    targets.forEach((el, idx) => {
        // stagger slightly for first 12 elements
        const delay = Math.min(idx * 40, 240);
        el.style.animationDelay = delay + 'ms';
        el.classList.add('fade-in-on-load');
    });
}
