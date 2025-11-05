const user = checkAuth('staff');
let currentTab = 'upcoming';

async function initializeRoomsData() {
    const rooms = await getLocalData('rooms');
    if (rooms.length === 0) {
        const initialRooms = [];
        
        // Standard rooms: 101-110
        for (let i = 101; i <= 110; i++) {
            initialRooms.push({
                roomNumber: i,
                number: i,
                type: 'Standard',
                price: 2500,
                status: 'Available',
                currentBookingId: null
            });
        }
        
        // Deluxe rooms: 201-220
        for (let i = 201; i <= 220; i++) {
            initialRooms.push({
                roomNumber: i,
                number: i,
                type: 'Deluxe',
                price: 4000,
                status: 'Available',
                currentBookingId: null
            });
        }
        
        // Suite rooms: 301-310
        for (let i = 301; i <= 310; i++) {
            initialRooms.push({
                roomNumber: i,
                number: i,
                type: 'Suite',
                price: 7000,
                status: 'Available',
                currentBookingId: null
            });
        }
        
        await setLocalData('rooms', initialRooms);
    }
}

function switchTab(event, tab) {
    currentTab = tab;
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadBookings();
}

async function loadDashboard() {
    const bookingsList = document.getElementById('bookingsList');
    // Make updating state VERY visible
    if (bookingsList) {
        bookingsList.classList.add('smooth-update', 'updating');
        // Longer delay to see the animation
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    await initializeRoomsData();
    
    const bookings = await getLocalData('hotelBookings');
    const rooms = await getLocalData('rooms');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const arrivalsToday = bookings.filter(b => {
        const checkin = new Date(b.checkin);
        checkin.setHours(0,0,0,0);
        return checkin.getTime() === today.getTime() && (b.status === 'Confirmed' || b.status === 'Pending');
    }).length;
    
    const departuresToday = bookings.filter(b => {
        const checkout = new Date(b.checkout);
        checkout.setHours(0,0,0,0);
        return checkout.getTime() === today.getTime() && b.status === 'Checked-in';
    }).length;
    
    const currentGuests = bookings.filter(b => b.status === 'Checked-in').length;
    
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const cleaningRooms = rooms.filter(r => r.status === 'Cleaning').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;
    
    const occupancyRate = ((occupiedRooms / rooms.length) * 100).toFixed(0);
    
    document.getElementById('arrivalsToday').textContent = arrivalsToday;
    document.getElementById('departurestoday').textContent = departuresToday;
    document.getElementById('currentGuests').textContent = currentGuests;
    document.getElementById('occupancyRate').textContent = occupancyRate + '%';
    
    document.getElementById('availableRooms').textContent = availableRooms;
    document.getElementById('occupiedRooms').textContent = occupiedRooms;
    document.getElementById('cleaningRooms').textContent = cleaningRooms;
    document.getElementById('maintenanceRooms').textContent = maintenanceRooms;
    
    loadBookings();
}

async function refreshDashboard() {
    const reloadBtn = document.getElementById('reloadBtn');
    const bookingsList = document.getElementById('bookingsList');
    
    // Make it VERY obvious - show loading overlay
    if (bookingsList) {
        showLoading('bookingsList', 'Reloading data...');
    }
    
    // Animate button
    if (reloadBtn) {
        reloadBtn.classList.add('reloading');
    }
    
    try {
        await loadDashboard();
        
        // Add dramatic reload animation
        if (bookingsList) {
            bookingsList.classList.add('smooth-update', 'reload-content');
            setTimeout(() => {
                bookingsList.classList.remove('reload-content');
            }, 800);
        }
    } finally {
        if (bookingsList) {
            setTimeout(() => hideLoading('bookingsList'), 400);
        }
        if (reloadBtn) {
            setTimeout(() => reloadBtn.classList.remove('reloading'), 500);
        }
    }
}

async function loadBookings() {
    const bookings = await getLocalData('hotelBookings');
    const container = document.getElementById('bookingsList');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let filtered = [];
    
    switch(currentTab) {
        case 'inhouse':
            // Show all currently checked-in guests
            filtered = bookings.filter(b => b.status === 'Checked-in');
            break;
        case 'upcoming':
            // Show all confirmed bookings (not yet checked in) - this includes all bookings customers made
            filtered = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');
            break;
        default:
            // Default to upcoming
            filtered = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');
            break;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No ${currentTab} bookings found</p>
            </div>
        `;
        return;
    }
    
    // Add fade animation
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';
    }
    
    container.innerHTML = filtered.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <div>
                    <h3>#${booking.id} - ${booking.customerName}</h3>
                    <p class="text-muted">
                        <i class="fas fa-calendar"></i> 
                        ${new Date(booking.checkin).toLocaleDateString()} - ${new Date(booking.checkout).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    ${getStatusBadge(booking.status)}
                </div>
            </div>
            <div class="booking-details">
                <div class="detail-item">
                    <i class="fas fa-bed"></i>
                    <span>${booking.roomType} Room</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <span>${booking.guests} Guest${booking.guests > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-moon"></i>
                    <span>${booking.nights} Night${booking.nights > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span>${formatPrice(booking.totalPrice)}</span>
                </div>
                ${booking.roomNumber ? `
                <div class="detail-item">
                    <i class="fas fa-door-open"></i>
                    <span>Room ${booking.roomNumber}</span>
                </div>
                ` : ''}
            </div>
            <div class="booking-actions">
                ${getActionButtons(booking)}
            </div>
        </div>
    `).join('');
    
    // Animate in the bookings
    if (container) {
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
            container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        }, 10);
    }
}

function getStatusBadge(status) {
    const badges = {
        'Confirmed': '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>',
        'Checked-in': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> In-House</span>',
        'Checked-out': '<span class="badge badge-info"><i class="fas fa-sign-out-alt"></i> Checked-out</span>',
        'Cancelled': '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Cancelled</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

function getActionButtons(booking) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkin = new Date(booking.checkin);
    checkin.setHours(0,0,0,0);
    
    const bookingId = String(booking.id).replace(/'/g, "\\'");
    
    if (booking.status === 'Confirmed' && checkin.getTime() === today.getTime()) {
        return `
            <button class="btn btn-success" onclick="checkInGuest('${bookingId}')">
                <i class="fas fa-door-open"></i> Check-in
            </button>
        `;
    }
    
    if (booking.status === 'Checked-in') {
        return `
            <button class="btn btn-primary" onclick="viewBooking('${bookingId}')">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button class="btn btn-warning" onclick="checkOutGuest('${bookingId}')">
                <i class="fas fa-door-closed"></i> Check-out
            </button>
        `;
    }
    
    return `
        <button class="btn btn-outline" onclick="viewBooking('${bookingId}')">
            <i class="fas fa-eye"></i> View Details
        </button>
    `;
}

async function checkInGuest(bookingId) {
    const bookings = await getLocalData('hotelBookings');
    const rooms = await getLocalData('rooms');
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    const availableRoom = rooms.find(r => 
        r.type === booking.roomType && r.status === 'Available'
    );
    
    if (!availableRoom) {
        alert(`No ${booking.roomType} rooms available for check-in!`);
        return;
    }
    
    if (confirm(`Check-in ${booking.customerName} to Room ${availableRoom.roomNumber}?`)) {
        booking.status = 'Checked-in';
        booking.roomNumber = availableRoom.roomNumber;
        booking.checkinTime = new Date().toISOString();
        
        availableRoom.status = 'Occupied';
        availableRoom.currentBookingId = bookingId;
        
        await setLocalData('hotelBookings', bookings);
        await setLocalData('rooms', rooms);
        
        showNotification(`Guest checked in to Room ${availableRoom.roomNumber}`, 'success');
        loadDashboard();
    }
}

async function checkOutGuest(bookingId) {
    const bookings = await getLocalData('hotelBookings');
    const rooms = await getLocalData('rooms');
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    if (confirm(`Check-out ${booking.customerName} from Room ${booking.roomNumber}?`)) {
        const room = rooms.find(r => r.roomNumber === booking.roomNumber);
        
        booking.status = 'Checked-out';
        booking.checkoutTime = new Date().toISOString();
        
        if (room) {
            room.status = 'Cleaning';
            room.currentBookingId = null;
        }
        
        await setLocalData('hotelBookings', bookings);
        await setLocalData('rooms', rooms);
        
        showNotification(`Guest checked out. Room ${booking.roomNumber} marked for cleaning`, 'success');
        loadDashboard();
    }
}

async function viewBooking(bookingId) {
    const bookings = await getLocalData('hotelBookings');
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    alert(`Booking Details:\n\nID: ${booking.id}\nCustomer: ${booking.customerName}\nEmail: ${booking.customerEmail}\nRoom: ${booking.roomType}\nGuests: ${booking.guests}\nCheck-in: ${new Date(booking.checkin).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkout).toLocaleDateString()}\nTotal: ${formatPrice(booking.totalPrice)}\nStatus: ${booking.status}`);
}

loadDashboard();
