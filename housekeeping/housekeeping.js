const user = checkAuth('customer');
if (user) {
    document.getElementById('userName').textContent = user.name.split(' ')[0];
}

// Submit request
async function submitRequest(event) {
    event.preventDefault();

    const roomNumber = document.getElementById('roomNumber').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Get selected request types
    const checkboxes = document.querySelectorAll('input[name="requestType"]:checked');
    const requestTypes = Array.from(checkboxes).map(cb => cb.value);

    // Validation
    if (!roomNumber) {
        showNotification('Please enter your room number', 'error');
        return;
    }

    if (requestTypes.length === 0) {
        showNotification('Please select at least one request type', 'error');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    showButtonLoading(submitBtn);

    try {
        // Validate room number matches user's booking
        const hotelBookings = await getLocalData('hotelBookings');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeBooking = hotelBookings.find(b => 
            b.customerEmail === user.email &&
            b.roomNumber === parseInt(roomNumber) &&
            (b.status === 'Confirmed' || b.status === 'Checked-in') &&
            new Date(b.checkin) <= today &&
            new Date(b.checkout) > today
        );

        if (!activeBooking) {
            showNotification('Invalid room number. You must have an active booking for this room.', 'error');
            hideButtonLoading(submitBtn);
            return;
        }

        // Create request object
        const request = {
            id: generateId('HK'),
            roomNumber: roomNumber,
            requestType: requestTypes,
            notes: notes,
            customerEmail: user.email,
            customerName: user.name,
            status: 'Pending',
            timestamp: Date.now(),
            assignedTo: null,
            completedAt: null
        };

        // Save to Firestore
        const housekeepingRequests = await getLocalData('housekeepingRequests');
        housekeepingRequests.push(request);
        await setLocalData('housekeepingRequests', housekeepingRequests);

        // Show confirmation
        showConfirmation(request);

        showNotification('Request submitted successfully!', 'success');
    } catch (error) {
        console.error('Housekeeping request error:', error);
        showNotification('Failed to submit request. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitBtn);
    }
}

// Show confirmation
function showConfirmation(request) {
    // Hide form, show confirmation
    document.getElementById('requestForm').classList.remove('active');
    document.getElementById('confirmationView').classList.add('active');

    // Set request ID
    document.getElementById('requestId').textContent = request.id;

    // Load confirmation details
    const confirmationContainer = document.getElementById('confirmationDetails');
    confirmationContainer.innerHTML = `
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-door-open"></i> Room Number:</span>
            <span class="summary-value">${request.roomNumber}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-list"></i> Request Types:</span>
            <span class="summary-value">${request.requestType.join(', ')}</span>
        </div>
        ${request.notes ? `
            <div class="summary-item">
                <span class="summary-label"><i class="fas fa-comment"></i> Notes:</span>
                <span class="summary-value">${request.notes}</span>
            </div>
        ` : ''}
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-user"></i> Guest Name:</span>
            <span class="summary-value">${request.customerName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-clock"></i> Requested:</span>
            <span class="summary-value">${new Date(request.timestamp).toLocaleString()}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-info-circle"></i> Status:</span>
            <span class="summary-value badge badge-warning">Pending</span>
        </div>
    `;

    // Scroll to top
    window.scrollTo(0, 0);
}

// Make another request
function makeAnotherRequest() {
    // Reset form
    document.getElementById('formHousekeeping').reset();
    
    // Show form, hide confirmation
    document.getElementById('confirmationView').classList.remove('active');
    document.getElementById('requestForm').classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}
