document.addEventListener('DOMContentLoaded', function() {
    checkSecurityStatus();
});

async function checkSecurityStatus() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const warnings = [];
    const db = window.firebaseConfig?.db;
    
    if (!db) {
        return;
    }
    
    try {
        const customers = await getLocalData('customers');
        const hasDemoAccount = customers.some(c => 
            c.email === 'customer@test.com' && c.password === 'password123'
        );
        
        if (hasDemoAccount) {
            warnings.push('DEMO ACCOUNTS DETECTED');
        }
        
        const hasPlaintextPasswords = customers.some(c => 
            c.password && c.password.length < 30
        );
        
        if (hasPlaintextPasswords) {
            warnings.push('PLAINTEXT PASSWORDS DETECTED');
        }
        
        if (warnings.length > 0) {
            showSecurityWarning(warnings);
        }
    } catch (error) {
        console.error('Security check failed:', error);
    }
}

function showSecurityWarning(warnings) {
    if (document.getElementById('security-warning-banner')) {
        return;
    }
    
    const warningBanner = document.createElement('div');
    warningBanner.id = 'security-warning-banner';
    warningBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ff0000, #cc0000);
        color: white;
        padding: 15px 20px;
        text-align: center;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
    `;
    
    warningBanner.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <i class="fas fa-exclamation-triangle fa-2x" style="animation: pulse 2s infinite;"></i>
                <div style="flex: 1; min-width: 300px;">
                    <div style="font-size: 1.2em; margin-bottom: 5px;">
                        ⚠️ SECURITY WARNING - ${warnings.join(', ')} ⚠️
                    </div>
                    <div style="font-size: 0.9em; font-weight: normal; opacity: 0.95;">
                        This system is running in DEMO MODE with known credentials.
                        <strong>DO NOT use real passwords or personal information!</strong>
                        See SECURITY_WARNING.md for details.
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Dismiss
                </button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.insertBefore(warningBanner, document.body.firstChild);
    document.body.style.paddingTop = '80px';
}
