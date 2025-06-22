// bookings-script.js (for bookings.html - View All Bookings)

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

const bookingsList = document.getElementById('bookingsList');
const bookingsMessageElement = document.getElementById('bookingsMessage');

// Filter elements
const searchCustomerInput = document.getElementById('searchCustomer');
const bookingDateStartInput = document.getElementById('bookingDateStart');
const bookingDateEndInput = document.getElementById('bookingDateEnd');
const returnDateStartInput = document.getElementById('returnDateStart');
const returnDateEndInput = document.getElementById('returnDateEnd');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Helper function to format dates for consistent comparison
function getFormattedDate(dateString) {
    return dateString ? new Date(dateString + 'T00:00:00') : null; // Ensure UTC start of day
}

// Function to format a Firestore Timestamp object into a readable string
function formatTimestamp(timestamp) {
    if (timestamp && timestamp.toDate) { // Check if it's a Firestore Timestamp
        const date = timestamp.toDate(); // Convert to JavaScript Date object
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return date.toLocaleDateString('en-IN', options); // 'en-IN' for Indian date format
    }
    return 'N/A'; // If timestamp is not available or not a valid format
}

// Function to determine booking status
function getBookingStatus(booking) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const bookingDate = getFormattedDate(booking.bookingDate);
    const returnDate = getFormattedDate(booking.returnDate);

    if (booking.isReturned) { // Assuming a field `isReturned: true` if you mark them
        return { text: 'Returned', class: 'status-returned' };
    } else if (returnDate && returnDate < today) {
        return { text: 'Overdue', class: 'status-overdue' };
    } else if (bookingDate && bookingDate <= today && returnDate && returnDate >= today) {
        return { text: 'Active', class: 'status-active' };
    } else if (bookingDate && bookingDate > today) {
        return { text: 'Upcoming', class: 'status-upcoming' };
    } else {
        return { text: 'Unknown', class: 'status-returned' }; // Default or fallback
    }
}


// Function to display bookings
async function displayBookings(snapshot) {
    bookingsList.innerHTML = ''; // Clear previous listings
    if (snapshot.empty) {
        bookingsList.innerHTML = '<p>No bookings found matching filters.</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const booking = doc.data();
        const bookingId = doc.id;

        const bookingItemDiv = document.createElement('div');
        bookingItemDiv.classList.add('booking-item');

        const status = getBookingStatus(booking);
        bookingItemDiv.innerHTML += `<span class="booking-status ${status.class}">${status.text}</span>`;

        bookingItemDiv.innerHTML += `<p><strong>Name:</strong> ${booking.customerName}</p>`;
        bookingItemDiv.innerHTML += `<p><strong>Mobile:</strong> ${booking.customerMobile}</p>`;
        bookingItemDiv.innerHTML += `<p><strong>Address:</strong> ${booking.customerAddress}</p>`;
        if (booking.itemCategory) {
            bookingItemDiv.innerHTML += `<p><strong>Category:</strong> ${booking.itemCategory}</p>`;
        }
        bookingItemDiv.innerHTML += `<p><strong>Booking Date:</strong> ${booking.bookingDate}</p>`;
        bookingItemDiv.innerHTML += `<p><strong>Return Date:</strong> ${booking.returnDate}</p>`;

        // Add the timestamp display here
        bookingItemDiv.innerHTML += `<p><strong>Booked On:</strong> ${formatTimestamp(booking.timestamp)}</p>`;


        let itemsHtml = '<p><strong>Items:</strong></p><ul>';
        let hasItems = false;
        for (const item in booking.items) {
            if (booking.items[item] > 0) {
                itemsHtml += `<li>${item.charAt(0).toUpperCase() + item.slice(1)}: ${booking.items[item]}</li>`;
                hasItems = true;
            }
        }
        if (!hasItems) {
            itemsHtml += `<li>No items selected.</li>`;
        }
        itemsHtml += '</ul>';
        bookingItemDiv.innerHTML += itemsHtml;

        // Actions (Edit/Delete buttons)
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-btn');
        editBtn.addEventListener('click', () => {
            // Redirect to index.html with booking ID for editing
            window.location.href = `index.html?id=${bookingId}`;
        });
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => deleteBooking(bookingId));
        actionsDiv.appendChild(deleteBtn);

        // Optional: Add a "Mark as Returned" button if you want that functionality
        // if (!booking.isReturned && status.text !== 'Upcoming') {
        //     const returnBtn = document.createElement('button');
        //     returnBtn.textContent = 'Mark as Returned';
        //     returnBtn.style.backgroundColor = '#17a2b8'; // Info blue
        //     returnBtn.addEventListener('click', () => markBookingAsReturned(bookingId));
        //     actionsDiv.appendChild(returnBtn);
        // }


        bookingItemDiv.appendChild(actionsDiv);
        bookingsList.appendChild(bookingItemDiv);
    });
}

// Function to delete a booking
async function deleteBooking(id) {
    if (confirm('Are you sure you want to delete this booking? This cannot be undone.')) {
        try {
            await bookingsCollection.doc(id).delete();
            bookingsMessageElement.textContent = 'Booking deleted successfully!';
            bookingsMessageElement.style.color = 'green';
            // onSnapshot listener will automatically re-render
        } catch (e) {
            console.error("Error deleting document: ", e);
            bookingsMessageElement.textContent = 'Error deleting booking. Please try again.';
            bookingsMessageElement.style.color = 'red';
        }
    }
}

// Optional: Function to mark as returned
/*
async function markBookingAsReturned(id) {
    if (confirm('Are you sure you want to mark this booking as returned?')) {
        try {
            const docRef = bookingsCollection.doc(id);
            await docRef.update({ isReturned: true, returnTimestamp: new Date() });
            bookingsMessageElement.textContent = 'Booking marked as returned!';
            bookingsMessageElement.style.color = 'green';
        } catch (e) {
            console.error("Error marking booking as returned: ", e);
            bookingsMessageElement.textContent = 'Error marking booking as returned. Please try again.';
            messageElement.style.color = 'red';
        }
    }
}
*/


// Function to fetch and listen to real-time updates for bookings with filters
function getBookingsRealtimeWithFilters() {
    let queryRef = bookingsCollection.orderBy("timestamp", "desc"); // Default sort by latest

    const searchTerm = searchCustomerInput.value.toLowerCase();
    const bookingDateStart = bookingDateStartInput.value;
    const bookingDateEnd = bookingDateEndInput.value;
    const returnDateStart = returnDateStartInput.value;
    const returnDateEnd = returnDateEndInput.value;

    queryRef.onSnapshot((snapshot) => {
        let filteredDocs = snapshot.docs;

        // Client-side filtering for text search
        if (searchTerm) {
            filteredDocs = filteredDocs.filter(doc => {
                const booking = doc.data();
                const nameMatch = booking.customerName.toLowerCase().includes(searchTerm);
                const mobileMatch = booking.customerMobile.includes(searchTerm);
                return nameMatch || mobileMatch;
            });
        }

        // Client-side filtering for date ranges
        if (bookingDateStart) {
            const start = getFormattedDate(bookingDateStart);
            filteredDocs = filteredDocs.filter(doc => getFormattedDate(doc.data().bookingDate) >= start);
        }
        if (bookingDateEnd) {
            const end = getFormattedDate(bookingDateEnd);
            filteredDocs = filteredDocs.filter(doc => getFormattedDate(doc.data().bookingDate) <= end);
        }
        if (returnDateStart) {
            const start = getFormattedDate(returnDateStart);
            filteredDocs = filteredDocs.filter(doc => getFormattedDate(doc.data().returnDate) >= start);
        }
        if (returnDateEnd) {
            const end = getFormattedDate(returnDateEnd);
            filteredDocs = filteredDocs.filter(doc => getFormattedDate(doc.data().returnDate) <= end);
        }


        // Create a new snapshot-like object from filteredDocs to pass to displayBookings
        const filteredSnapshot = {
            empty: filteredDocs.length === 0,
            forEach: (callback) => filteredDocs.forEach(callback)
        };

        displayBookings(filteredSnapshot);
    }, (error) => {
        console.error("Error fetching real-time bookings: ", error);
        bookingsList.innerHTML = '<p style="color: red;">Error loading bookings.</p>';
    });
}


// --- Event Listeners ---
applyFiltersBtn.addEventListener('click', getBookingsRealtimeWithFilters);
clearFiltersBtn.addEventListener('click', () => {
    searchCustomerInput.value = '';
    bookingDateStartInput.value = '';
    bookingDateEndInput.value = '';
    returnDateStartInput.value = '';
    returnDateEndInput.value = '';
    getBookingsRealtimeWithFilters(); // Re-fetch with cleared filters
});


// Initial load of bookings
getBookingsRealtimeWithFilters();
