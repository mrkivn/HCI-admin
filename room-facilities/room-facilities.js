const user = checkAuth('staff');

let currentTab = 'all';
let allRooms = [];
let allBookings = [];

// Load dashboard
async function loadDashboard() {
    allRooms = await getLocalData('rooms');
    allBookings = await getLocalData('hotelBookings');
    updateStats();
    loadRooms();
}

// Update stats
async function updateStats() {
    const rooms = await getLocalData('rooms');
    
    const total = rooms.length;
    const available = rooms.filter(r => r.status === 'Available').length;
    const occupied = rooms.filter(r => r.status === 'Occupied').length;
    const cleaning = rooms.filter(r => r.status === 'Cleaning').length;

    document.getElementById('totalRooms').textContent = total;
    document.getElementById('availableRooms').textContent = available;
    document.getElementById('occupiedRooms').textContent = occupied;
    document.getElementById('cleaningRooms').textContent = cleaning;
}

// Switch tab
function switchTab(evt, tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    
    applyFilters();
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchRoom = document.getElementById('searchRoom').value.toLowerCase();
    
    let filteredRooms = [...allRooms];
    
    if (currentTab !== 'all') {
        const tabStatusMap = {
            'available': 'Available',
            'occupied': 'Occupied',
            'cleaning': 'Cleaning'
        };
        filteredRooms = filteredRooms.filter(r => r.status === tabStatusMap[currentTab]);
    }
    
    if (statusFilter !== 'all') {
        filteredRooms = filteredRooms.filter(r => r.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredRooms = filteredRooms.filter(r => r.type === typeFilter);
    }
    
    if (searchRoom) {
        filteredRooms = filteredRooms.filter(r => 
            r.number.toString().includes(searchRoom)
        );
    }
    
    displayRooms(filteredRooms);
}

// Load and display rooms
function loadRooms() {
    applyFilters();
}

// Display rooms
function displayRooms(rooms) {
    const container = document.getElementById('roomsGrid');
    
    if (rooms.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No rooms found.</p>';
        return;
    }
    
    rooms.sort((a, b) => a.number - b.number);
    
    container.innerHTML = '';
    rooms.forEach(room => {
        const card = createRoomCard(room);
        container.appendChild(card);
    });
}

// Create room card
function createRoomCard(room) {
    const div = document.createElement('div');
    div.className = `room-card ${room.status.toLowerCase()}`;
    
    const guestInfo = getGuestInfoForRoom(room.number);
    
    div.innerHTML = `
        <div class="room-card-header">
            <div>
                <div class="room-number"><i class="fas fa-door-closed"></i> Room ${room.number}</div>
                <div class="room-type">${room.type}</div>
            </div>
            <span class="room-status ${room.status.toLowerCase()}">${room.status}</span>
        </div>
        <div class="room-info">
            <div class="room-info-item">
                <span class="info-label">Price per night</span>
                <span class="info-value">${formatPrice(room.price)}</span>
            </div>
            <div class="room-info-item">
                <span class="info-label">Type</span>
                <span class="info-value">${room.type}</span>
            </div>
        </div>
        ${guestInfo ? `
            <div class="guest-info">
                <h4><i class="fas fa-user"></i> Current Guest</h4>
                <div class="guest-detail">
                    <span class="label">Name:</span>
                    <span class="value">${guestInfo.customerName}</span>
                </div>
                <div class="guest-detail">
                    <span class="label">Email:</span>
                    <span class="value">${guestInfo.customerEmail}</span>
                </div>
                <div class="guest-detail">
                    <span class="label">Phone:</span>
                    <span class="value">${guestInfo.customerPhone}</span>
                </div>
                <div class="guest-detail">
                    <span class="label">Check-in:</span>
                    <span class="value">${formatDate(guestInfo.checkin)}</span>
                </div>
                <div class="guest-detail">
                    <span class="label">Check-out:</span>
                    <span class="value">${formatDate(guestInfo.checkout)}</span>
                </div>
                <div class="guest-detail">
                    <span class="label">Booking ID:</span>
                    <span class="value">${guestInfo.id}</span>
                </div>
            </div>
        ` : ''}
        <div class="room-actions">
            <button class="btn btn-primary btn-sm" onclick="viewRoomDetails(${room.number})">
                <i class="fas fa-eye"></i> View Details
            </button>
            ${room.status !== 'Occupied' ? `
                <button class="btn btn-success btn-sm" onclick="openAssignCustomerModal(${room.number})">
                    <i class="fas fa-user-plus"></i> Assign Customer
                </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="changeRoomStatus(${room.number})">
                <i class="fas fa-sync"></i> Change Status
            </button>
        </div>
    `;
    
    return div;
}

// Get guest info for a room
function getGuestInfoForRoom(roomNumber) {
    const booking = allBookings.find(b => 
        b.roomNumber === roomNumber && b.status === 'Checked-in'
    );
    return booking || null;
}

// View room details in modal
function viewRoomDetails(roomNumber) {
    const room = allRooms.find(r => r.number === roomNumber);
    if (!room) return;
    
    const guestInfo = getGuestInfoForRoom(roomNumber);
    const modal = document.getElementById('roomModal');
    const modalBody = document.getElementById('roomModalBody');
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h3><i class="fas fa-door-open"></i> Room Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="label">Room Number</div>
                    <div class="value">${room.number}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Room Type</div>
                    <div class="value">${room.type}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Price per Night</div>
                    <div class="value">${formatPrice(room.price)}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Status</div>
                    <div class="value">
                        <span class="room-status ${room.status.toLowerCase()}">${room.status}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${guestInfo ? `
            <div class="detail-section">
                <h3><i class="fas fa-user-circle"></i> Guest Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">Guest Name</div>
                        <div class="value">${guestInfo.customerName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Email</div>
                        <div class="value">${guestInfo.customerEmail}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Phone</div>
                        <div class="value">${guestInfo.customerPhone}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Booking ID</div>
                        <div class="value">${guestInfo.id}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-calendar-alt"></i> Booking Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">Check-in Date</div>
                        <div class="value">${formatDate(guestInfo.checkin)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Check-out Date</div>
                        <div class="value">${formatDate(guestInfo.checkout)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Number of Nights</div>
                        <div class="value">${guestInfo.nights}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Number of Guests</div>
                        <div class="value">${guestInfo.guests}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Destination</div>
                        <div class="value">${guestInfo.destination}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Total Price</div>
                        <div class="value">${formatPrice(guestInfo.totalPrice)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Payment Method</div>
                        <div class="value">${guestInfo.paymentMethod}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Booking Status</div>
                        <div class="value">${guestInfo.status}</div>
                    </div>
                </div>
            </div>
        ` : '<p class="text-muted">No guest currently occupying this room.</p>'}
        
        <div class="status-actions">
            ${room.status === 'Available' ? `
                <button class="btn btn-warning" onclick="updateRoomStatus(${room.number}, 'Cleaning'); closeRoomModal();">
                    <i class="fas fa-broom"></i> Mark as Cleaning
                </button>
            ` : ''}
            ${room.status === 'Cleaning' ? `
                <button class="btn btn-success" onclick="updateRoomStatus(${room.number}, 'Available'); closeRoomModal();">
                    <i class="fas fa-check"></i> Mark as Available
                </button>
            ` : ''}
            ${room.status === 'Occupied' ? `
                <button class="btn btn-info" disabled>
                    <i class="fas fa-info-circle"></i> Room Currently Occupied
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="closeRoomModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    modal.classList.add('show');
}

// Close room modal
function closeRoomModal() {
    const modal = document.getElementById('roomModal');
    modal.classList.remove('show');
}

// Change room status dialog
function changeRoomStatus(roomNumber) {
    const room = allRooms.find(r => r.number === roomNumber);
    if (!room) return;
    
    if (room.status === 'Occupied') {
        showNotification('Cannot change status of occupied room. Guest must check out first.', 'error');
        return;
    }
    
    const newStatus = room.status === 'Available' ? 'Cleaning' : 'Available';
    updateRoomStatus(roomNumber, newStatus);
}

// Update room status
async function updateRoomStatus(roomNumber, newStatus) {
    const rooms = await getLocalData('rooms');
    const roomIndex = rooms.findIndex(r => r.number === roomNumber);
    
    if (roomIndex === -1) return;
    
    rooms[roomIndex].status = newStatus;
    await setLocalData('rooms', rooms);
    
    showNotification(`Room ${roomNumber} status updated to ${newStatus}`, 'success');
    
    allRooms = rooms;
    updateStats();
    loadRooms();
}

// Assign Customer Modal Functions
let selectedRoomForAssignment = null;

function openAssignCustomerModal(roomNumber) {
    const room = allRooms.find(r => r.number === roomNumber);
    if (!room) return;
    
    if (room.status === 'Occupied') {
        showNotification('This room is already occupied', 'error');
        return;
    }
    
    selectedRoomForAssignment = roomNumber;
    
    // Populate room info
    document.getElementById('selectedRoom').value = `Room ${roomNumber} - ${room.type} (${formatPrice(room.price)}/night)`;
    
    // Load customers
    loadCustomersDropdown();
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('checkinDate').value = formatDateForInput(today);
    document.getElementById('checkoutDate').value = formatDateForInput(tomorrow);
    
    // Reset form
    document.getElementById('customerSelect').value = '';
    document.getElementById('numberOfGuests').value = '1';
    document.getElementById('destination').value = '';
    document.getElementById('paymentMethod').value = 'Cash';
    document.getElementById('selectedCustomerInfo').style.display = 'none';
    document.getElementById('bookingSummary').style.display = 'none';
    
    // Show modal
    document.getElementById('assignCustomerModal').classList.add('show');
    
    // Add event listeners
    setupAssignmentEventListeners();
}

function closeAssignCustomerModal() {
    document.getElementById('assignCustomerModal').classList.remove('show');
    selectedRoomForAssignment = null;
}

async function loadCustomersDropdown() {
    const customers = await getLocalData('customers');
    const select = document.getElementById('customerSelect');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select a Customer --</option>';
    
    customers.forEach((customer, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${customer.name} (${customer.email})`;
        select.appendChild(option);
    });
}

function setupAssignmentEventListeners() {
    const customerSelect = document.getElementById('customerSelect');
    const checkinDate = document.getElementById('checkinDate');
    const checkoutDate = document.getElementById('checkoutDate');
    const numberOfGuests = document.getElementById('numberOfGuests');
    
    // Remove existing listeners by cloning elements
    const newCustomerSelect = customerSelect.cloneNode(true);
    customerSelect.parentNode.replaceChild(newCustomerSelect, customerSelect);
    
    newCustomerSelect.addEventListener('change', function() {
        updateCustomerInfo();
        calculateBookingSummary();
    });
    
    [checkinDate, checkoutDate, numberOfGuests].forEach(el => {
        el.addEventListener('change', calculateBookingSummary);
        el.addEventListener('input', calculateBookingSummary);
    });
}

async function updateCustomerInfo() {
    const customerIndex = document.getElementById('customerSelect').value;
    const infoDiv = document.getElementById('selectedCustomerInfo');
    const displayDiv = document.getElementById('customerInfoDisplay');
    
    if (customerIndex === '') {
        infoDiv.style.display = 'none';
        return;
    }
    
    const customers = await getLocalData('customers');
    const customer = customers[customerIndex];
    
    displayDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="label">Name</div>
                <div class="value">${customer.name}</div>
            </div>
            <div class="detail-item">
                <div class="label">Email</div>
                <div class="value">${customer.email}</div>
            </div>
            <div class="detail-item">
                <div class="label">Phone</div>
                <div class="value">${customer.phone || 'N/A'}</div>
            </div>
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

function calculateBookingSummary() {
    const customerIndex = document.getElementById('customerSelect').value;
    const checkinDate = document.getElementById('checkinDate').value;
    const checkoutDate = document.getElementById('checkoutDate').value;
    const numberOfGuests = document.getElementById('numberOfGuests').value;
    
    const summaryDiv = document.getElementById('bookingSummary');
    const displayDiv = document.getElementById('summaryDisplay');
    
    if (!customerIndex || !checkinDate || !checkoutDate) {
        summaryDiv.style.display = 'none';
        return;
    }
    
    const room = allRooms.find(r => r.number === selectedRoomForAssignment);
    if (!room) return;
    
    // Calculate nights
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
        summaryDiv.style.display = 'none';
        showNotification('Check-out date must be after check-in date', 'error');
        return;
    }
    
    const totalPrice = room.price * nights;
    
    displayDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="label">Room Type</div>
                <div class="value">${room.type}</div>
            </div>
            <div class="detail-item">
                <div class="label">Price per Night</div>
                <div class="value">${formatPrice(room.price)}</div>
            </div>
            <div class="detail-item">
                <div class="label">Number of Nights</div>
                <div class="value">${nights}</div>
            </div>
            <div class="detail-item">
                <div class="label">Number of Guests</div>
                <div class="value">${numberOfGuests}</div>
            </div>
            <div class="detail-item">
                <div class="label"><strong>Total Price</strong></div>
                <div class="value"><strong>${formatPrice(totalPrice)}</strong></div>
            </div>
        </div>
    `;
    
    summaryDiv.style.display = 'block';
}

async function confirmAssignment() {
    const customerIndex = document.getElementById('customerSelect').value;
    const checkinDate = document.getElementById('checkinDate').value;
    const checkoutDate = document.getElementById('checkoutDate').value;
    const numberOfGuests = document.getElementById('numberOfGuests').value;
    const destination = document.getElementById('destination').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Validation
    if (!customerIndex) {
        showNotification('Please select a customer', 'error');
        return;
    }
    if (!checkinDate || !checkoutDate) {
        showNotification('Please select check-in and check-out dates', 'error');
        return;
    }
    if (!destination) {
        showNotification('Please enter a destination', 'error');
        return;
    }
    
    const room = allRooms.find(r => r.number === selectedRoomForAssignment);
    const customers = await getLocalData('customers');
    const customer = customers[customerIndex];
    
    // Calculate nights and total price
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
        showNotification('Check-out date must be after check-in date', 'error');
        return;
    }
    
    const totalPrice = room.price * nights;
    
    // Create booking
    const booking = {
        id: generateId('BOOK'),
        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone || 'N/A',
        roomType: room.type,
        roomNumber: room.number,
        checkin: checkinDate,
        checkout: checkoutDate,
        nights: nights,
        guests: parseInt(numberOfGuests),
        destination: destination,
        totalPrice: totalPrice,
        paymentMethod: paymentMethod,
        status: 'Checked-in',
        bookingDate: new Date().toISOString().split('T')[0],
        checkinDate: new Date().toISOString()
    };
    
    // Save booking
    const bookings = await getLocalData('hotelBookings');
    bookings.push(booking);
    await setLocalData('hotelBookings', bookings);
    
    // Update room status to Occupied
    updateRoomStatus(selectedRoomForAssignment, 'Occupied');
    
    showNotification(`Customer ${customer.name} successfully assigned to Room ${selectedRoomForAssignment}`, 'success');
    
    // Reload data
    allBookings = bookings;
    loadDashboard();
    
    closeAssignCustomerModal();
}

// Helper function to format date for input
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const roomModal = document.getElementById('roomModal');
    const assignModal = document.getElementById('assignCustomerModal');
    
    if (event.target === roomModal) {
        closeRoomModal();
    }
    if (event.target === assignModal) {
        closeAssignCustomerModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
