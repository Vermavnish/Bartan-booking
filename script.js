// script.js (for index.html - Booking Form)

// Your web app's Firebase configuration
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

// Get form elements
const bookingForm = document.getElementById('bookingForm');
const formTitle = document.getElementById('formTitle');
const customerNameInput = document.getElementById('customerName');
const customerAddressInput = document.getElementById('customerAddress');
const customerMobileInput = document.getElementById('customerMobile');
const itemCategoryInput = document.getElementById('itemCategory');
const bookingDateInput = document.getElementById('bookingDate');
const returnDateInput = document.getElementById('returnDate');
const messageElement = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Item input references
const itemInputs = {
    bhagona: document.getElementById('bhagona'),
    tap: document.getElementById('tap'),
    balti: document.getElementById('balti'),
    karchhul: document.getElementById('karchhul'),
    tasa: document.getElementById('tasa'),
    kisti: document.getElementById('kisti'),
    karahi: document.getElementById('karahi'),
    kathra: document.getElementById('kathra'),
    chulha: document.getElementById('chulha'),
    buffet: document.getElementById('buffet'),
    drum: document.getElementById('drum'),
    dustbin: document.getElementById('dustbin')
};

let editingBookingId = null; // To store the ID of the booking being edited

// --- Functions ---

// Function to reset the form
function resetForm() {
    bookingForm.reset();
    submitBtn.textContent = 'Add Booking';
    formTitle.textContent = 'New Booking';
    cancelEditBtn.style.display = 'none';
    editingBookingId = null;
    messageElement.textContent = ''; // Clear message
    // Ensure all item quantities are reset to 0
    for (const key in itemInputs) {
        if (itemInputs.hasOwnProperty(key)) {
            itemInputs[key].value = 0;
        }
    }
}

// Function to populate form for editing (called from bookings-script.js)
// This function needs to be globally accessible or passed data
// For a simple multi-page app, using localStorage or URL parameters is common for passing ID.
// For now, we assume `bookings.html` will handle redirection if needed,
// or you'd use a state management pattern.
// Given the "simple" constraint and the current setup, the "Edit" button
// on bookings.html will *redirect* to index.html with parameters
// For a truly seamless edit experience, a single-page application structure would be better.
// For now, we'll keep `editBooking` as a function that can *receive* data if passed.

// When an "Edit" button is clicked on bookings.html, it will redirect to index.html with query parameters.
// This block will check for those parameters on page load.
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    if (bookingId) {
        fetchBookingToEdit(bookingId);
    }
};

async function fetchBookingToEdit(id) {
    try {
        const docRef = bookingsCollection.doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            const booking = doc.data();
            editingBookingId = id;
            formTitle.textContent = 'Edit Booking';
            submitBtn.textContent = 'Update Booking';
            cancelEditBtn.style.display = 'block';

            customerNameInput.value = booking.customerName;
            customerAddressInput.value = booking.customerAddress;
            customerMobileInput.value = booking.customerMobile;
            itemCategoryInput.value = booking.itemCategory || '';
            bookingDateInput.value = booking.bookingDate;
            returnDateInput.value = booking.returnDate;

            for (const item in itemInputs) {
                itemInputs[item].value = booking.items[item] || 0;
            }
            messageElement.textContent = 'Editing existing booking.';
            messageElement.style.color = 'blue';
        } else {
            messageElement.textContent = 'Booking not found for editing.';
            messageElement.style.color = 'red';
        }
    } catch (e) {
        console.error("Error fetching booking for edit: ", e);
        messageElement.textContent = 'Error loading booking for edit.';
        messageElement.style.color = 'red';
    }
}


// --- Event Listeners ---

// Form submission (Add/Update)
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = customerNameInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();
    const customerMobile = customerMobileInput.value.trim();
    const itemCategory = itemCategoryInput.value;
    const bookingDate = bookingDateInput.value;
    const returnDate = returnDateInput.value;

    const items = {};
    for (const key in itemInputs) {
        if (itemInputs.hasOwnProperty(key)) {
            const quantity = parseInt(itemInputs[key].value);
            if (!isNaN(quantity) && quantity > 0) {
                items[key] = quantity;
            }
        }
    }

    if (!customerName || !customerAddress || !customerMobile || !bookingDate || !returnDate) {
        messageElement.textContent = 'Please fill in all required fields (Name, Address, Mobile, Dates).';
        messageElement.style.color = 'red';
        return;
    }

    if (new Date(returnDate) < new Date(bookingDate)) {
        messageElement.textContent = 'Return Date cannot be before Booking Date.';
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
        items: items,
        timestamp: new Date()
    };

    try {
        if (editingBookingId) {
            const docRef = bookingsCollection.doc(editingBookingId);
            await docRef.update(bookingData);
            messageElement.textContent = 'Booking updated successfully!';
            messageElement.style.color = 'green';
        } else {
            const docRef = await bookingsCollection.add(bookingData);
            messageElement.textContent = `Booking added successfully! ID: ${docRef.id}`;
            messageElement.style.color = 'green';
        }
        resetForm();
    } catch (e) {
        console.error("Error saving booking: ", e);
        messageElement.textContent = 'Error saving booking. Please try again.';
        messageElement.style.color = 'red';
    }
});

// Cancel Edit button
cancelEditBtn.addEventListener('click', resetForm);

// No initial data load here as this is the form page.
