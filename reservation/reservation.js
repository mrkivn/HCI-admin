const user = checkAuth('customer');
if (user) {
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    
    // Auto-fill customer information
    document.getElementById('customerName').textContent = user.name;
    document.getElementById('customerEmail').textContent = user.email;
    document.getElementById('customerPhone').textContent = user.phone;
}

let selectedSeating = '';

function initializeReservation() {
    // Set minimum date to today
    const today = getTodayDate();
    document.getElementById('reservationDate').min = today;
    document.getElementById('reservationDate').value = today;

    // Populate time slots (10:00 AM - 10:00 PM, 30-min intervals)
    const timeSelect = document.getElementById('reservationTime');
    const times = [];
    
    for (let hour = 10; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 22 && minute > 0) break; // Stop at 10:00 PM
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = formatTimeDisplay(hour, minute);
            
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = displayTime;
            timeSelect.appendChild(option);
        }
    }
}

// Format time for display
function formatTimeDisplay(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Select seating
function selectSeating(seatingType) {
    // Remove previous selection
    document.querySelectorAll('.seating-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    event.currentTarget.classList.add('selected');

    // Save selection
    selectedSeating = seatingType;
    document.getElementById('seating').value = seatingType;
}

// Submit reservation
async function submitReservation(event) {
    event.preventDefault();

    const date = document.getElementById('reservationDate').value;
    const time = document.getElementById('reservationTime').value;
    const guests = parseInt(document.getElementById('numberOfGuests').value);
    const specialRequests = document.getElementById('specialRequests').value.trim();

    // Validation
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }

    if (!time) {
        showNotification('Please select a time', 'error');
        return;
    }

    if (!selectedSeating) {
        showNotification('Please select a seating preference', 'error');
        return;
    }

    if (guests < 1 || guests > 20) {
        showNotification('Number of guests must be between 1 and 20', 'error');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    showButtonLoading(submitBtn);

    try {
        // Create reservation object
        const reservation = {
            id: generateId('AG'),
            type: 'restaurant',
            date: date,
            time: time,
            seating: selectedSeating,
            guests: guests,
            specialRequests: specialRequests,
            customerEmail: user.email,
            customerName: user.name,
            customerPhone: user.phone,
            status: 'Confirmed',
            reservationDate: Date.now()
        };

        // Save to Firestore
        const restaurantReservations = await getLocalData('restaurantReservations');
        restaurantReservations.push(reservation);
        await setLocalData('restaurantReservations', restaurantReservations);

        // Show confirmation
        showConfirmation(reservation);
        
        showNotification('Reservation confirmed successfully!', 'success');
    } catch (error) {
        console.error('Reservation error:', error);
        showNotification('Failed to save reservation. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitBtn);
    }
}

// Show confirmation
function showConfirmation(reservation) {
    // Hide form, show confirmation
    document.getElementById('reservationForm').classList.remove('active');
    document.getElementById('confirmationView').classList.add('active');

    // Set reservation ID
    document.getElementById('reservationId').textContent = reservation.id;

    // Format time for display
    const timeParts = reservation.time.split(':');
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const displayTime = formatTimeDisplay(hour, minute);

    // Load confirmation details
    const confirmationContainer = document.getElementById('confirmationDetails');
    confirmationContainer.innerHTML = `
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-calendar"></i> Date:</span>
            <span class="summary-value">${formatDate(reservation.date)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-clock"></i> Time:</span>
            <span class="summary-value">${displayTime}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-chair"></i> Seating:</span>
            <span class="summary-value">${reservation.seating}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-users"></i> Guests:</span>
            <span class="summary-value">${reservation.guests}</span>
        </div>
        ${reservation.specialRequests ? `
            <div class="summary-item">
                <span class="summary-label"><i class="fas fa-comment"></i> Special Requests:</span>
                <span class="summary-value">${reservation.specialRequests}</span>
            </div>
        ` : ''}
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-user"></i> Name:</span>
            <span class="summary-value">${reservation.customerName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-envelope"></i> Email:</span>
            <span class="summary-value">${reservation.customerEmail}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label"><i class="fas fa-phone"></i> Phone:</span>
            <span class="summary-value">${reservation.customerPhone}</span>
        </div>
    `;

    // Scroll to top
    window.scrollTo(0, 0);
}

// Make another reservation
function makeAnotherReservation() {
    // Reset form
    document.getElementById('formReservation').reset();
    selectedSeating = '';
    document.querySelectorAll('.seating-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Show form, hide confirmation
    document.getElementById('confirmationView').classList.remove('active');
    document.getElementById('reservationForm').classList.add('active');

    // Reinitialize
    initializeReservation();

    // Scroll to top
    window.scrollTo(0, 0);
}

initializeReservation();
