// dashboard-script.js (for dashboard.html)

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

// Summary elements
const totalBookingsCount = document.getElementById('totalBookingsCount');
const activeBookingsCount = document.getElementById('activeBookingsCount');
const upcomingReturnsCount = document.getElementById('upcomingReturnsCount');
const overdueReturnsCount = document.getElementById('overdueReturnsCount');

// List elements
const todayReturnsList = document.getElementById('todayReturnsList');
const next7DaysReturnsList = document.getElementById('next7DaysReturnsList');
const recentBookingsList = document.getElementById('recentBookingsList');

// Helper function to format dates for consistent comparison
function getFormattedDate(dateString) {
    return dateString ? new Date(dateString + 'T00:00:00') : null; // Ensure UTC start of day
}

// Function to determine booking status (reused from bookings-script.js)
function getBookingStatus(booking) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = getFormattedDate(booking.bookingDate);
    const returnDate = getFormattedDate(booking.returnDate);

    if (booking.isReturned) {
        return { text: 'Returned', class: 'status-returned' };
    } else if (returnDate && returnDate < today) {
        return { text: 'Overdue', class: 'status-overdue' };
    } else if (bookingDate && bookingDate <= today && returnDate && returnDate >= today) {
        return { text: 'Active', class: 'status-active' };
    } else if (bookingDate && bookingDate > today) {
        return { text: 'Upcoming', class: 'status-upcoming' };
    } else {
        return { text: 'Unknown', class: 'status-returned' };
    }
}


// Function to display bookings in a given target element
function displayBookingsForDashboard(snapshot, targetElement, isSummaryList = false) {
    targetElement.innerHTML = ''; // Clear previous listings
    if (snapshot.empty) {
        targetElement.innerHTML = '<p>No bookings.</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const booking = doc.data();

        const bookingItemDiv = document.createElement('div');
        bookingItemDiv.classList.add('booking-item');

        const status = getBookingStatus(booking);
        bookingItemDiv.innerHTML += `<span class="booking-status ${status.class}">${status.text}</span>`;

        bookingItemDiv.innerHTML += `<p><strong>Name:</strong> ${booking.customerName}</p>`;
        bookingItemDiv.innerHTML += `<p><strong>Mobile:</strong> ${booking.customerMobile}</p>`;
        // Simplified display for dashboard
        if (!isSummaryList) { // If it's the main recent list, show more detail
            bookingItemDiv.innerHTML += `<p><strong>Address:</strong> ${booking.customerAddress}</p>`;
        }
        bookingItemDiv.innerHTML += `<p><strong>Booked:</strong> ${booking.bookingDate}</p>`;
        bookingItemDiv.innerHTML += `<p><strong>Return:</strong> ${booking.returnDate}</p>`;

        let itemsSummary = [];
        for (const item in booking.items) {
            if (booking.items[item] > 0) {
                itemsSummary.push(`${item.charAt(0).toUpperCase() + item.slice(1)} (${booking.items[item]})`);
            }
        }
        if (itemsSummary.length > 0) {
            bookingItemDiv.innerHTML += `<p><strong>Items:</strong> ${itemsSummary.join(', ')}</p>`;
        } else {
            bookingItemDiv.innerHTML += `<li>No items selected.</li>`;
        }

        // No edit/delete buttons on dashboard lists
        targetElement.appendChild(bookingItemDiv);
    });
}

// Function to fetch and update all dashboard data
function getDashboardDataRealtime() {
    bookingsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        let totalCount = 0;
        let activeCount = 0;
        let upcomingReturnsCount = 0;
        let overdueCount = 0;
        const todayReturns = [];
        const next7DaysReturns = [];
        const recentBookings = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999); // End of 7th day

        snapshot.forEach((doc, index) => {
            const booking = doc.data();
            totalCount++;

            const bookingStatus = getBookingStatus(booking);
            const returnDate = getFormattedDate(booking.returnDate);
            const bookingDate = getFormattedDate(booking.bookingDate);

            // Count Active/Overdue/Upcoming
            if (bookingStatus.text === 'Active') {
                activeCount++;
            } else if (bookingStatus.text === 'Overdue') {
                overdueCount++;
            } else if (bookingStatus.text === 'Upcoming') {
                upcomingReturnsCount++; // General upcoming
            }

            // Specific lists
            if (returnDate) {
                if (returnDate.toDateString() === today.toDateString()) {
                    todayReturns.push(doc);
                } else if (returnDate > today && returnDate <= sevenDaysFromNow) {
                    next7DaysReturns.push(doc);
                }
            }

            // For recent bookings, just take the first few from the ordered snapshot
            if (index < 5) { // Show top 5 recent bookings
                recentBookings.push(doc);
            }
        });

        // Update Summary Counts
        totalBookingsCount.textContent = totalCount;
        activeBookingsCount.textContent = activeCount;
        upcomingReturnsCount.textContent = upcomingReturnsCount;
        overdueReturnsCount.textContent = overdueCount;

        // Display Specific Lists
        displayBookingsForDashboard({ empty: todayReturns.length === 0, forEach: (cb) => todayReturns.forEach(cb) }, todayReturnsList, true);
        displayBookingsForDashboard({ empty: next7DaysReturns.length === 0, forEach: (cb) => next7DaysReturns.forEach(cb) }, next7DaysReturnsList, true);
        displayBookingsForDashboard({ empty: recentBookings.length === 0, forEach: (cb) => recentBookings.forEach(cb) }, recentBookingsList);

    }, (error) => {
        console.error("Error fetching dashboard data: ", error);
        totalBookingsCount.textContent = 'Err';
        activeBookingsCount.textContent = 'Err';
        upcomingReturnsCount.textContent = 'Err';
        overdueReturnsCount.textContent = 'Err';
        todayReturnsList.innerHTML = '<p style="color: red;">Error loading data.</p>';
        next7DaysReturnsList.innerHTML = '<p style="color: red;">Error loading data.</p>';
        recentBookingsList.innerHTML = '<p style="color: red;">Error loading data.</p>';
    });
}

// Initial load of dashboard data
getDashboardDataRealtime();
