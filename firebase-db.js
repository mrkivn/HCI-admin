let firestoreInitialized = false;
let initializationPromise = null;

async function waitForFirestore() {
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = new Promise(async (resolve) => {
        if (firestoreInitialized) {
            resolve(true);
            return;
        }
        
        const initialized = await window.firebaseConfig.initializeFirebase();
        if (initialized) {
            firestoreInitialized = true;
            resolve(true);
        } else {
            console.error('Failed to initialize Firestore');
            resolve(false);
        }
    });
    
    return initializationPromise;
}

async function getCollection(collectionName) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        const snapshot = await db.collection(collectionName).get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        return [];
    }
}

async function getDocument(collectionName, docId) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        const doc = await db.collection(collectionName).doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error(`Error getting document ${docId} from ${collectionName}:`, error);
        return null;
    }
}

async function addDocument(collectionName, data) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        const docRef = await db.collection(collectionName).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        return null;
    }
}

async function updateDocument(collectionName, docId, data) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        await db.collection(collectionName).doc(docId).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error(`Error updating document ${docId} in ${collectionName}:`, error);
        return false;
    }
}

async function setDocument(collectionName, docId, data) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        await db.collection(collectionName).doc(docId).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error(`Error setting document ${docId} in ${collectionName}:`, error);
        return false;
    }
}

async function deleteDocument(collectionName, docId) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        await db.collection(collectionName).doc(docId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
        return false;
    }
}

async function queryCollection(collectionName, filters = []) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        let query = db.collection(collectionName);
        
        filters.forEach(([field, operator, value]) => {
            query = query.where(field, operator, value);
        });
        
        const snapshot = await query.get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Error querying ${collectionName}:`, error);
        return [];
    }
}

async function listenToCollection(collectionName, callback) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        return db.collection(collectionName).onSnapshot(snapshot => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        });
    } catch (error) {
        console.error(`Error listening to ${collectionName}:`, error);
        return () => {};
    }
}

async function initializeFirestoreData() {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        const initDoc = await db.collection('_system').doc('initialized').get();
        if (initDoc.exists) {
            return;
        }
        
        const customers = [
            {
                email: 'customer@test.com',
                password: 'password123',
                name: 'Demo Customer',
                phone: '+63 917 123 4567'
            }
        ];
        for (const customer of customers) {
            await db.collection('customers').add(customer);
        }
        
        const staff = [
            { email: 'manager@hotel.com', password: 'admin123', department: 'Manager' },
            { email: 'frontdesk@hotel.com', password: 'front123', department: 'Front Office' },
            { email: 'kitchen@hotel.com', password: 'kitchen123', department: 'Kitchen' },
            { email: 'bar@hotel.com', password: 'bar123', department: 'Bar' },
            { email: 'housekeeping@hotel.com', password: 'clean123', department: 'Housekeeping' },
            { email: 'billing@hotel.com', password: 'bill123', department: 'Billing' },
            { email: 'customerguest@hotel.com', password: 'guest123', department: 'Customer Guest' },
            { email: 'roomfacilities@hotel.com', password: 'room123', department: 'Room Facilities' }
        ];
        for (const staffMember of staff) {
            await db.collection('staff').add(staffMember);
        }
        
        const roomTypes = [
            { type: 'Standard', price: 2500, count: 15 },
            { type: 'Deluxe', price: 4000, count: 10 },
            { type: 'Suite', price: 7000, count: 5 }
        ];
        
        let roomNumber = 101;
        for (const roomType of roomTypes) {
            for (let i = 0; i < roomType.count; i++) {
                await db.collection('rooms').add({
                    number: roomNumber++,
                    type: roomType.type,
                    price: roomType.price,
                    status: 'Available',
                    currentGuest: null
                });
            }
        }
        
        await db.collection('_system').doc('initialized').set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            version: '1.0.0'
        });
    } catch (error) {
        console.error('Error initializing Firestore:', error);
    }
}

async function getFirestoreData(collectionName) {
    return await getCollection(collectionName);
}

async function setFirestoreData(collectionName, data) {
    await waitForFirestore();
    const db = window.firebaseConfig.getFirestore();
    
    try {
        const BATCH_SIZE = 500;
        
        const snapshot = await db.collection(collectionName).get();
        
        const deleteBatches = [];
        if (snapshot.size > 0) {
            let batch = db.batch();
            let operationCount = 0;
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
                operationCount++;
                
                if (operationCount === BATCH_SIZE) {
                    deleteBatches.push(batch.commit());
                    batch = db.batch();
                    operationCount = 0;
                }
            });
            
            if (operationCount > 0) {
                deleteBatches.push(batch.commit());
            }
            
            await Promise.all(deleteBatches);
        }
        
        const addBatches = [];
        if (data && data.length > 0) {
            let batch = db.batch();
            let operationCount = 0;
            
            data.forEach((item) => {
                const docRef = db.collection(collectionName).doc();
                const { id, ...docData } = item;
                batch.set(docRef, docData);
                operationCount++;
                
                if (operationCount === BATCH_SIZE) {
                    addBatches.push(batch.commit());
                    batch = db.batch();
                    operationCount = 0;
                }
            });
            
            if (operationCount > 0) {
                addBatches.push(batch.commit());
            }
            
            await Promise.all(addBatches);
        }
        
        return true;
    } catch (error) {
        console.error(`Error batch updating ${collectionName}:`, error);
        return false;
    }
}

window.firestoreDB = {
    getCollection,
    getDocument,
    addDocument,
    updateDocument,
    setDocument,
    deleteDocument,
    queryCollection,
    listenToCollection,
    initializeFirestoreData,
    getFirestoreData,
    setFirestoreData,
    waitForFirestore
};
