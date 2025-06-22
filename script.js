// script.js (for index.html - Booking Form)

// --- PWA Service Worker Registration (existing) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch(error => {
                console.error('ServiceWorker registration failed: ', error);
            });
    });
}
// --- END PWA Service Worker Registration ---

// --- Firebase Offline Persistence (existing) ---
firebase.firestore().enablePersistence()
    .then(() => {
        console.log('Firestore offline persistence enabled!');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open. Only one can enable persistence at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser does not support this feature.');
        } else {
            console.error('Firestore persistence failed:', err);
        }
    });
// --- END Firebase Offline Persistence ---


// Your web app's Firebase configuration (Please ensure this is correct)
const firebaseConfig = {
    apiKey: "AIzaSyDyX6XW9XAbEJnM7EqWcvxIJGmZK4KPebY",
    authDomain: "bartan-90d3e.firebaseapp.com",
    projectId: "bartan-90d3e",
    storageBucket: "bartan-90d3e.firebasestorage.app",
    messagingSenderId: "742001200871",
    appId: "1:742001200871:web:7fed6ea43382212082dc42",
    measurementId: "G-WJ3V0RMTF9"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const bookingsCollection = db.collection("bookings");
const inventoryCollection = db.collection("inventory"); // ADDED: Inventory Collection

// Get elements
const bookingForm = document.getElementById('bookingForm');
const messageElement = document.getElementById('message');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');

// Global objects to manage inventory and selected quantities
let availableInventoryItems = {}; // Stores fetched items from inventory { 'sanitized-name': { originalName: 'Steel Plate', quantity: 100 } }
let itemQuantities = {}; // Stores quantities selected by user for the current booking { 'sanitized-name': 5 }

// Utility function to sanitize item names for HTML IDs and keys
function sanitizeItemName(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Function to fetch inventory items and populate the form
async function fetchInventoryItemsAndRenderForm() {
    try {
        const snapshot = await inventoryCollection.get();
        availableInventoryItems = {}; // Clear previous data
        itemQuantities = {}; // Reset selected quantities

        if (snapshot.empty) {
            document.getElementById('itemQuantities').innerHTML = '<p>No inventory items available. Please add items to inventory first.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const sanitizedName = sanitizeItemName(item.name);
            availableInventoryItems[sanitizedName] = {
                originalName: item.name,
                availableQuantity: item.quantity || 0 // Default to 0 if quantity not set
            };
            itemQuantities[sanitizedName] = 0; // Initialize selected quantity to 0 for new booking
        });

        renderItemInputs(); // Now render the inputs based on fetched data

    } catch (error) {
        console.error("Error fetching inventory items:", error);
        messageElement.textContent = 'Error loading inventory items. Please try again.';
        messageElement.style.color = 'red';
    }
}

// Function to render/re-render item quantity input fields
function renderItemInputs() {
    const itemQuantitiesDiv = document.getElementById('itemQuantities');
    itemQuantitiesDiv.innerHTML = ''; // Clear previous inputs

    // Iterate over the dynamically loaded items
    for (const sanitizedName in availableInventoryItems) {
        const itemInfo = availableInventoryItems[sanitizedName];
        const label = itemInfo.originalName; // Use original name for label
        const currentQuantity = itemQuantities[sanitizedName] || 0; // Use the currently selected quantity

        const inputGroup = document.createElement('div');
        inputGroup.classList.add('input-group');
        inputGroup.innerHTML = `
            <label for="${sanitizedName}">${label} (Available: ${itemInfo.availableQuantity}):</label>
            <input type="number" id="${sanitizedName}" min="0" value="${currentQuantity}"
                   max="${itemInfo.availableQuantity}"> `;
        itemQuantitiesDiv.appendChild(inputGroup);

        // Add event listener to update itemQuantities
        document.getElementById(sanitizedName).addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 0) { // Handle non-numeric or negative input
                val = 0;
            }
            // Ensure quantity doesn't exceed available
            if (val > itemInfo.availableQuantity) {
                e.target.value = itemInfo.availableQuantity; // Set input value to max
                itemQuantities[sanitizedName] = itemInfo.availableQuantity;
                alert(`You can only select up to ${itemInfo.availableQuantity} of ${itemInfo.originalName}.`);
            } else {
                itemQuantities[sanitizedName] = val;
            }
        });
    }
}

// Function to load a booking for editing
async function loadBookingForEdit(bookingId) {
    try {
        const doc = await bookingsCollection.doc(bookingId).get();
        if (doc.exists) {
            const booking = doc.data();

            // First, load inventory, then populate form
            await fetchInventoryItemsAndRenderForm(); // Ensure inventory is loaded before trying to pre-fill items

            // Populate the booking form fields
            document.getElementById('customerName').value = booking.customerName || '';
            document.getElementById('customerAddress').value = booking.customerAddress || '';
            document.getElementById('customerMobile').value = booking.customerMobile || '';
            document.getElementById('itemCategory').value = booking.itemCategory || '';
            document.getElementById('bookingDate').value = booking.bookingDate || '';
            document.getElementById('returnDate').value = booking.returnDate || '';

            // Pre-fill item quantities for editing based on existing booking data
            // We re-initialize itemQuantities here from booking data
            itemQuantities = {};
            for (const itemKey in booking.items) {
                const sanitizedKey = sanitizeItemName(itemKey); // Sanitize key from stored booking data
                // Only set quantity if the item exists in our current inventory
                if (availableInventoryItems[sanitizedKey]) {
                    itemQuantities[sanitizedKey] = booking.items[itemKey];
                }
            }
            renderItemInputs(); // Re-render with pre-filled quantities

            formTitle.textContent = 'Edit Bartan Booking';
            bookingForm.setAttribute('data-id', bookingId);
            submitBtn.textContent = 'Update Booking';

            messageElement.textContent = ''; // Clear any previous messages
        } else {
            messageElement.textContent = 'Booking not found.';
            messageElement.style.color = 'red';
        }
    } catch (e) {
        console.error("Error loading booking for edit:", e);
        messageElement.textContent = 'Error loading booking for edit. Please try again.';
        messageElement.style.color = 'red';
    }
}


// Handle form submission
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    messageElement.textContent = ''; // Clear previous messages

    const customerName = document.getElementById('customerName').value;
    const customerAddress = document.getElementById('customerAddress').value;
    const customerMobile = document.getElementById('customerMobile').value;
    const itemCategory = document.getElementById('itemCategory').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const returnDate = document.getElementById('returnDate').value;

    // Validate if any items are selected
    let totalSelectedItems = 0;
    const selectedItemsForBooking = {};
    for (const itemKey in itemQuantities) {
        if (itemQuantities[itemKey] > 0) {
            // Use the original name for storing in Firestore for clarity
            const originalName = availableInventoryItems[itemKey].originalName;
            selectedItemsForBooking[originalName] = itemQuantities[itemKey];
            totalSelectedItems += itemQuantities[itemKey];
        }
    }

    if (totalSelectedItems === 0) {
        messageElement.textContent = 'Please select at least one item.';
        messageElement.style.color = 'red';
        return;
    }


    const bookingData = {
        customerName: customerName,
        customerAddress: customerAddress,
        customerMobile: customerMobile,
        itemCategory: itemCategory,
        bookingDate: bookingDate,
        returnDate: returnDate,
        items: selectedItemsForBooking, // Use the dynamically selected items
        timestamp: new Date() // Will save current date/time
    };

    const bookingId = bookingForm.getAttribute('data-id');

    try {
        if (bookingId) {
            // Update existing booking
            await bookingsCollection.doc(bookingId).update(bookingData);
            messageElement.textContent = 'Booking updated successfully!';
            messageElement.style.color = 'green';
        } else {
            // Add new booking
            await bookingsCollection.add(bookingData);
            messageElement.textContent = 'Booking added successfully!';
            messageElement.style.color = 'green';
            bookingForm.reset(); // Clear form for new entry
            // Reset item quantities after successful submission
            for(const itemKey in itemQuantities) {
                itemQuantities[itemKey] = 0;
            }
            renderItemInputs(); // Re-render to clear item inputs
        }
    } catch (e) {
        console.error("Error adding/updating document: ", e);
        messageElement.textContent = 'Error saving booking. Please try again.';
        messageElement.style.color = 'red';
    }
});

// Clear form button (existing)
document.getElementById('clearFormBtn').addEventListener('click', () => {
    bookingForm.reset();
    bookingForm.removeAttribute('data-id');
    formTitle.textContent = 'Add New Bartan Booking';
    submitBtn.textContent = 'Add Booking';
    messageElement.textContent = '';
    // Reset item quantities and re-render for clearing
    for(const itemKey in itemQuantities) {
        itemQuantities[itemKey] = 0;
    }
    renderItemInputs(); // Re-render to clear item inputs
});

// Initial page load logic: check for edit ID, then fetch inventory
window.addEventListener('DOMContentLoaded', async () => {
    // This assumes firebase.firestore().enablePersistence() and app.initializeApp(firebaseConfig)
    // are called at the very top of this script or globally before this listener.

    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');

    if (bookingId) {
        await loadBookingForEdit(bookingId); // loadBookingForEdit will now call fetchInventoryItemsAndRenderForm internally
    } else {
        await fetchInventoryItemsAndRenderForm(); // For new bookings, just load inventory and render form
    }
});

