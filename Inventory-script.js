// inventory-script.js (for inventory.html - Manage Inventory)

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
const inventoryCollection = db.collection("inventory");

// Get form elements
const inventoryForm = document.getElementById('inventoryForm');
const inventoryFormTitle = document.getElementById('inventoryFormTitle');
const inventoryItemNameInput = document.getElementById('inventoryItemName');
const inventoryTotalQuantityInput = document.getElementById('inventoryTotalQuantity');
const inventorySubmitBtn = document.getElementById('inventorySubmitBtn');
const cancelInventoryEditBtn = document.getElementById('cancelInventoryEditBtn');
const inventoryMessageElement = document.getElementById('inventoryMessage');
const inventoryList = document.getElementById('inventoryList');

let editingInventoryItemId = null;

// --- Functions ---

// Function to reset the inventory form
function resetInventoryForm() {
    inventoryForm.reset();
    inventorySubmitBtn.textContent = 'Add Item';
    inventoryFormTitle.textContent = 'Add New Item';
    cancelInventoryEditBtn.style.display = 'none';
    editingInventoryItemId = null;
    inventoryMessageElement.textContent = '';
    inventoryTotalQuantityInput.value = 0;
}

// Function to display inventory items
async function displayInventory(snapshot) {
    inventoryList.innerHTML = '';
    if (snapshot.empty) {
        inventoryList.innerHTML = '<p>No items in inventory.</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const item = doc.data();
        const itemId = doc.id;

        const inventoryItemDiv = document.createElement('div');
        inventoryItemDiv.classList.add('booking-item');

        inventoryItemDiv.innerHTML += `<p><strong>Item Name:</strong> ${item.itemName}</p>`;
        inventoryItemDiv.innerHTML += `<p><strong>Total Quantity:</strong> ${item.totalQuantity}</p>`;

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-btn');
        editBtn.addEventListener('click', () => editInventoryItem(itemId, item));
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => deleteInventoryItem(itemId));
        actionsDiv.appendChild(deleteBtn);

        inventoryItemDiv.appendChild(actionsDiv);
        inventoryList.appendChild(inventoryItemDiv);
    });
}

// Function to fetch and listen to real-time updates for inventory
function getInventoryRealtime() {
    const q = inventoryCollection.orderBy("itemName", "asc");

    q.onSnapshot((snapshot) => {
        displayInventory(snapshot);
    }, (error) => {
        console.error("Error fetching real-time inventory: ", error);
        inventoryList.innerHTML = '<p style="color: red;">Error loading inventory.</p>';
    });
}

// Function to populate form for editing an inventory item
function editInventoryItem(id, item) {
    editingInventoryItemId = id;
    inventoryFormTitle.textContent = 'Edit Item';
    inventorySubmitBtn.textContent = 'Update Item';
    cancelInventoryEditBtn.style.display = 'block';

    inventoryItemNameInput.value = item.itemName;
    inventoryTotalQuantityInput.value = item.totalQuantity;

    inventoryMessageElement.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Function to delete an inventory item
async function deleteInventoryItem(id) {
    if (confirm('Are you sure you want to delete this inventory item? This cannot be undone.')) {
        try {
            await inventoryCollection.doc(id).delete();
            inventoryMessageElement.textContent = 'Item deleted successfully!';
            inventoryMessageElement.style.color = 'green';
        } catch (e) {
            console.error("Error deleting document: ", e);
            inventoryMessageElement.textContent = 'Error deleting item. Please try again.';
            inventoryMessageElement.style.color = 'red';
        }
    }
}

// --- Event Listeners ---

// Inventory form submission (Add/Update)
inventoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemName = inventoryItemNameInput.value.trim();
    const totalQuantity = parseInt(inventoryTotalQuantityInput.value);

    if (!itemName || isNaN(totalQuantity) || totalQuantity < 0) {
        inventoryMessageElement.textContent = 'Please enter a valid item name and quantity.';
        inventoryMessageElement.style.color = 'red';
        return;
    }

    const itemData = {
        itemName: itemName,
        totalQuantity: totalQuantity,
        lastUpdated: new Date()
    };

    try {
        if (editingInventoryItemId) {
            const docRef = inventoryCollection.doc(editingInventoryItemId);
            await docRef.update(itemData);
            inventoryMessageElement.textContent = 'Item updated successfully!';
            inventoryMessageElement.style.color = 'green';
        } else {
            const docRef = await inventoryCollection.add(itemData);
            inventoryMessageElement.textContent = `Item added successfully! ID: ${docRef.id}`;
            inventoryMessageElement.style.color = 'green';
        }
        resetInventoryForm();
    } catch (e) {
        console.error("Error adding/updating inventory item: ", e);
        inventoryMessageElement.textContent = 'Error saving item. Please try again.';
        inventoryMessageElement.style.color = 'red';
    }
});

// Cancel Edit button for inventory
cancelInventoryEditBtn.addEventListener('click', resetInventoryForm);

// Initial load of inventory items
getInventoryRealtime();
