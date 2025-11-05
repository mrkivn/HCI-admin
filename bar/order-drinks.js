const user = checkAuth('customer');
if (user) {
    document.getElementById('userName').textContent = user.name.split(' ')[0];
}

const drinksMenu = [
    { name: 'Tropical Yakult Splash', price: 120, icon: 'fa-glass-water', description: 'Refreshing tropical blend' },
    { name: 'Energy Bear Spark', price: 130, icon: 'fa-mug-hot', description: 'Energizing fruity drink' },
    { name: 'Bear Fizz Delight', price: 125, icon: 'fa-champagne-glasses', description: 'Fizzy refreshment' },
    { name: 'Classic Sparkle', price: 110, icon: 'fa-wine-glass', description: 'Classic sparkling beverage' },
    { name: 'Sweet Chill', price: 115, icon: 'fa-martini-glass', description: 'Sweet and chilled' },
    { name: 'Grape Fizz', price: 120, icon: 'fa-wine-bottle', description: 'Grape flavored fizz' },
    { name: 'Mojito', price: 150, icon: 'fa-cocktail', description: 'Classic mint mojito' },
    { name: 'Margarita', price: 180, icon: 'fa-martini-glass-citrus', description: 'Premium margarita' }
];

let cart = [];

function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    drinksMenu.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        menuItem.innerHTML = `
            <div class="menu-item-icon">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="menu-item-body">
                <h3>${item.name}</h3>
                <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 10px;">${item.description}</p>
                <div class="menu-item-price">${formatPrice(item.price)}</div>
                
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="decreaseQty(${index})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-display" id="qty-${index}">1</span>
                    <button class="qty-btn" onclick="increaseQty(${index})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <button class="btn btn-primary add-to-cart-btn" onclick="addToCart(${index})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;

        menuGrid.appendChild(menuItem);
    });
}

function increaseQty(index) {
    const qtyElement = document.getElementById(`qty-${index}`);
    let qty = parseInt(qtyElement.textContent);
    if (qty < 99) {
        qtyElement.textContent = qty + 1;
    }
}

function decreaseQty(index) {
    const qtyElement = document.getElementById(`qty-${index}`);
    let qty = parseInt(qtyElement.textContent);
    if (qty > 1) {
        qtyElement.textContent = qty - 1;
    }
}

function addToCart(index) {
    const item = drinksMenu[index];
    const qty = parseInt(document.getElementById(`qty-${index}`).textContent);

    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({
            name: item.name,
            price: item.price,
            quantity: qty
        });
    }

    document.getElementById(`qty-${index}`).textContent = '1';
    updateCart();

    showNotification(`${item.name} added to cart!`, 'success');
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center">Your cart is empty</p>';
        cartSummary.style.display = 'none';
        return;
    }

    cartSummary.style.display = 'block';

    let cartHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">
                        ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(itemTotal)}
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total').textContent = formatPrice(subtotal);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    showNotification('Item removed from cart', 'success');
}

async function loadUserRooms() {
    const selectElement = document.getElementById('tableOrRoom');
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Select table or room...</option>';
    
    try {
        const bookings = await getLocalData('hotelBookings');
        const userBookings = bookings.filter(b => 
            b.customerEmail === user.email && 
            b.roomNumber && 
            (b.status === 'Checked-in' || b.status === 'Confirmed')
        );
        
        const userRooms = [...new Set(userBookings.map(b => b.roomNumber))];
        
        userRooms.forEach(roomNumber => {
            const booking = userBookings.find(b => b.roomNumber === roomNumber);
            const roomType = booking?.roomType || '';
            const option = document.createElement('option');
            option.value = `Room ${roomNumber}`;
            option.textContent = `Room ${roomNumber} ${roomType ? `(${roomType})` : ''}`;
            selectElement.appendChild(option);
        });
        
        const tableOption = document.createElement('option');
        tableOption.value = 'Table';
        tableOption.textContent = 'Table (Restaurant)';
        selectElement.appendChild(tableOption);
        
        if (userRooms.length === 0) {
            const noRoomOption = document.createElement('option');
            noRoomOption.value = '';
            noRoomOption.textContent = 'No rooms available - Use Table option';
            noRoomOption.disabled = true;
            selectElement.appendChild(noRoomOption);
        }
    } catch (error) {
        console.error('Error loading user rooms:', error);
        const tableOption = document.createElement('option');
        tableOption.value = 'Table';
        tableOption.textContent = 'Table (Restaurant)';
        selectElement.appendChild(tableOption);
    }
}

async function placeOrder() {
    const tableOrRoom = document.getElementById('tableOrRoom').value.trim();

    if (!tableOrRoom) {
        showNotification('Please select table or room number', 'error');
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    const placeOrderBtn = document.querySelector('.btn-primary.btn-block');
    showButtonLoading(placeOrderBtn);

    try {
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = {
            id: generateId('ORD'),
            category: 'Drinks',
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            tableOrRoomNumber: tableOrRoom,
            customerEmail: user.email,
            customerName: user.name,
            totalPrice: totalPrice,
            status: 'Pending',
            timestamp: Date.now()
        };

        const orders = await getLocalData('orders');
        orders.push(order);
        await setLocalData('orders', orders);

        document.getElementById('orderId').textContent = order.id;
        document.getElementById('orderModal').classList.add('show');

        cart = [];
        document.getElementById('tableOrRoom').value = '';
        updateCart();
        loadUserRooms();

        showNotification('Order placed successfully!', 'success');
    } catch (error) {
        console.error('Order error:', error);
        showNotification('Failed to place order. Please try again.', 'error');
    } finally {
        hideButtonLoading(placeOrderBtn);
    }
}

function closeModal() {
    document.getElementById('orderModal').classList.remove('show');
}

loadMenu();
loadUserRooms();
