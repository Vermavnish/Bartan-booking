// customers-script.js (for customers.html - Customer List)

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

const customerList = document.getElementById('customerList');
const customerMessage = document.getElementById('customerMessage');

// Search elements
const searchCustomerListInput = document.getElementById('searchCustomerList');
const applyCustomerSearchBtn = document.getElementById('applyCustomerSearchBtn');
const clearCustomerSearchBtn = document.getElementById('clearCustomerSearchBtn');

let allCustomersData = []; // Store all fetched customer data for client-side filtering

// Function to display customer information
async function displayCustomers(customersToDisplay) {
    customerList.innerHTML = '';
    if (customersToDisplay.length === 0) {
        customerList.innerHTML = '<p>No customers found.</p>';
        return;
    }

    customersToDisplay.forEach(customer => {
        const customerDiv = document.createElement('div');
        customerDiv.classList.add('booking-item'); // Reuse existing CSS class

        customerDiv.innerHTML += `<p><strong>Name:</strong> ${customer.name}</p>`;
        customerDiv.innerHTML += `<p><strong>Mobile:</strong> ${customer.mobile}</p>`;
        customerDiv.innerHTML += `<p><strong>Address:</strong> ${customer.address}</p>`;

        // Optional: Add a button to view bookings for this customer
        // const viewBookingsBtn = document.createElement('button');
        // viewBookingsBtn.textContent = 'View Bookings';
        // viewBookingsBtn.style.backgroundColor = '#17a2b8';
        // viewBookingsBtn.style.marginTop = '5px';
        // viewBookingsBtn.addEventListener('click', () => {
        //     alert(`Future feature: Show bookings for ${customer.name}`);
        //     // You could redirect to bookings.html with a customer name/mobile filter applied
        //     // window.location.href = `bookings.html?customerSearch=${encodeURIComponent(customer.name)}`;
        // });
        // customerDiv.appendChild(viewBookingsBtn);

        customerList.appendChild(customerDiv);
    });
}

// Function to fetch and process customer data from bookings
async function getCustomerData() {
    try {
        const snapshot = await bookingsCollection.get();
        const customerSet = new Set(); // Use a Set to ensure uniqueness
        allCustomersData = []; // Clear previous data

        snapshot.forEach(doc => {
            const booking = doc.data();
            const customerKey = `${booking.customerName}-${booking.customerMobile}`; // Create a unique key
            if (!customerSet.has(customerKey)) {
                customerSet.add(customerKey);
                allCustomersData.push({
                    name: booking.customerName,
                    mobile: booking.customerMobile,
                    address: booking.customerAddress
                });
            }
        });

        // Sort customers alphabetically by name
        allCustomersData.sort((a, b) => a.name.localeCompare(b.name));

        applyCustomerSearch(); // Display initial list or filtered list
    } catch (error) {
        console.error("Error fetching customer data: ", error);
        customerMessage.textContent = 'Error loading customer data.';
        customerMessage.style.color = 'red';
        customerList.innerHTML = '<p style="color: red;">Error loading customer data.</p>';
    }
}

// Function to apply search filter on customer list
function applyCustomerSearch() {
    const searchTerm = searchCustomerListInput.value.toLowerCase().trim();
    let filteredCustomers = allCustomersData;

    if (searchTerm) {
        filteredCustomers = allCustomersData.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.mobile.includes(searchTerm)
        );
        if (filteredCustomers.length === 0) {
            customerMessage.textContent = 'No customers found matching your search.';
            customerMessage.style.color = 'orange';
        } else {
            customerMessage.textContent = '';
        }
    } else {
        customerMessage.textContent = '';
    }

    displayCustomers(filteredCustomers);
}

// --- Event Listeners ---
applyCustomerSearchBtn.addEventListener('click', applyCustomerSearch);
searchCustomerListInput.addEventListener('input', applyCustomerSearch); // Live search
clearCustomerSearchBtn.addEventListener('click', () => {
    searchCustomerListInput.value = '';
    applyCustomerSearch();
});

// Initial load of customer data
getCustomerData();
