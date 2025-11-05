let db = null;
let app = null;

async function initializeFirebase() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyBmAzA5RodILLB61P6teGamSWFP4G12itQ",
            authDomain: "ginhawa-bf29a.firebaseapp.com",
            projectId: "ginhawa-bf29a",
            storageBucket: "ginhawa-bf29a.firebasestorage.app",
            messagingSenderId: "849284832287",
            appId: "1:849284832287:web:2bbb006d6cf3279ac8892a",
            measurementId: "G-7RD49JE59T"
        };
        
        if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
            console.error('Firebase config not set! Please edit firebase-config.js with your Firebase project credentials.');
            return false;
        }

        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Make sure script tags are in your HTML.');
            return false;
        }

        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        try {
            await db.enablePersistence({ synchronizeTabs: true });
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence only enabled in one tab');
            } else if (err.code === 'unimplemented') {
                console.warn('Browser does not support persistence');
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

function getFirestore() {
    if (!db) {
        console.error('Firestore not initialized. Call initializeFirebase() first.');
    }
    return db;
}

window.firebaseConfig = {
    initializeFirebase,
    getFirestore,
    get db() { return db; },
    get app() { return app; }
};
