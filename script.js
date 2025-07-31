// Firebase configuration - Replace with YOUR Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Default settings
let settings = {
    users: ['ABDO', 'MOUAD'],
    weekStartDay: 1, // Monday
    userColors: {}
};

// Data storage
let references = {};
let currentDate = new Date();
let isInitialLoad = true;
let lastSyncTime = null;

// Day names
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Color palette for users
const colorPalette = [
    '#cce5ff', '#fff3cd', '#d4edda', '#f8d7da', '#e2e3e5', 
    '#d1ecf1', '#ffeaa7', '#fab1a0', '#a29bfe', '#fd79a8'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateStatus('Initializing system...');
    setupFirebaseSync();
    updateCurrentDate();
    addWeekStatsButton();
});

// Status updates
function updateStatus(message, isError = false) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    
    if (isError) {
        statusMessage.classList.add('status-error');
    } else {
        statusMessage.classList.remove('status-error');
    }
    
    // Clear status after 5 seconds if not an error
    if (!isError) {
        setTimeout(() => {
            statusMessage.textContent = 'System ready';
        }, 5000);
    }
}

function updateLastSaved() {
    const now = new Date();
    lastSyncTime = now;
    document.getElementById('lastSaved').textContent = 
        `Last saved: ${now.toLocaleTimeString()}`;
}

function updateSyncStatus(status) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.textContent = status;
    }
}

// Firebase data management
function loadDataFromFirebase() {
    updateStatus('Loading data from Firebase...');
    
    return database.ref('/').once('value')
        .then((snapshot) => {
            const data = snapshot.val() || {};
            
            if (data.settings) {
                settings = data.settings;
                assignUserColors();
            }
            
            if (data.references) {
                references = data.references;
            }
            
            updateStatus('Data loaded from Firebase successfully');
            displayWeek();
            displayUsers();
            updateLegend();
            updateLastSaved();
            
            return true;
        })
        .catch((error) => {
            console.error('Error loading from Firebase:', error);
            updateStatus('Error loading from Firebase. Using local data.', true);
            loadLocalData(); // Fall back to local storage
            return false;
        });
}

function saveDataToFirebase() {
    updateStatus('Saving data to Firebase...');
    
    const data = {
        settings: settings,
        references: references,
        lastUpdated: new Date().toISOString()
    };
    
    return database.ref('/').set(data)
        .then(() => {
            updateStatus('Data saved to Firebase successfully');
            updateLastSaved();
            return true;
        })
        .catch((error) => {
            console.error('Error saving to Firebase:', error);
            updateStatus('Error saving to Firebase. Saved locally only.', true);
            saveLocalData(); // Fall back to local storage
            return false;
        });
}

function setupFirebaseSync() {
    // Initial load
    loadDataFromFirebase().then(() => {
        isInitialLoad = false;
        
        // Listen for changes
        database.ref('/').on('value', (snapshot) => {
            if (isInitialLoad) return;
            
            const data = snapshot.val() || {};
            const lastUpdate = data.lastUpdated ? new Date(data.lastUpdated) : null;
            
            // Only update if the data is different and not our own update
            if (lastUpdate && (!lastSyncTime || lastUpdate > lastSyncTime)) {
                if (data.settings) {
                    settings = data.settings;
                    assignUserColors();
                }
                
                if (data.references) {
                    references = data.references;
                }
                
                updateStatus('Data updated from Firebase');
                updateSyncStatus('⚡ Synced');
                displayWeek();
                displayUsers();
                updateLegend();
                
                // Update last sync time
                lastSyncTime = new Date();
            }
        });
    });
}

// Local storage as fallback
function loadLocalData() {
    try {
        const savedSettings = localStorage.getItem('trackingSettings');
        const savedReferences = localStorage.getItem('trackingReferences');
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
        
        if (savedReferences) {
            references = JSON.parse(savedReferences);
        }
        
        assignUserColors();
        document.getElementById('weekStartDay').value = settings.weekStartDay;
        updateStatus('Data loaded from local storage');
    } catch (error) {
        console.error('Error loading local data:', error);
        updateStatus('Error loading local data', true);
    }
}

function saveLocalData() {
    try {
        localStorage.setItem('trackingSettings', JSON.stringify(settings));
        localStorage.setItem('trackingReferences', JSON.stringify(references));
        updateLastSaved();
    } catch (error) {
        console.error('Error saving local data:', error);
        updateStatus('Error saving local data', true);
    }
}

// Main data operations
function saveSettings() {
    try {
        settings.weekStartDay = parseInt(document.getElementById('weekStartDay').value);
        saveDataToFirebase();
        displayWeek();
    } catch (error) {
        console.error('Error saving settings:', error);
        updateStatus('Error saving settings', true);
    }
}

function saveData() {
    saveDataToFirebase().catch(() => {
        saveLocalData(); // Fallback
    });
}

function assignUserColors() {
    settings.users.forEach((user, index) => {
        if (!settings.userColors[user]) {
            settings.userColors[user] = colorPalette[index % colorPalette.length];
        }
    });
}

// The rest of your functions remain mostly the same
// Just replace any calls to the old saveData() with the new one

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('hidden');
}

function addUser() {
    const input = document.getElementById('newUserInput');
    const newUser = input.value.trim().toUpperCase();
    
    if (!newUser) {
        updateStatus('Please enter a user name', true);
        return;
    }
    
    if (settings.users.includes(newUser)) {
        updateStatus('User already exists', true);
        return;
    }
    
    settings.users.push(newUser);
    assignUserColors();
    saveSettings();
    displayUsers();
    updateLegend();
    displayWeek();
    input.value = '';
    updateStatus(`User ${newUser} added successfully`);
}

function removeUser(user) {
    if (confirm(`Are you sure you want to remove user "${user}"? This will set all their references to Available.`)) {
        settings.users = settings.users.filter(u => u !== user);
        delete settings.userColors[user];
        
        // Update all references assigned to this user
        Object.keys(references).forEach(dateKey => {
            if (references[dateKey]) {
                references[dateKey].forEach(ref => {
                    if (ref.user === user) {
                        ref.user = 'AVAILABLE';
                        ref.lastUpdated = new Date().toLocaleString();
                    }
                });
            }
        });
        
        saveSettings();
        saveData();
        displayUsers();
        updateLegend();
        displayWeek();
        updateStatus(`User ${user} removed successfully`);
    }
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    settings.users.forEach(user => {
        const userTag = document.createElement('div');
        userTag.className = 'user-tag';
        userTag.style.backgroundColor = settings.userColors[user];
        userTag.innerHTML = `
            <span>${user}</span>
            <button class="remove-user" onclick="removeUser('${user}')" title="Remove user">×</button>
        `;
        usersList.appendChild(userTag);
    });
}

function updateLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = '';
    
    // Available status
    const availableItem = document.createElement('div');
    availableItem.className = 'legend-item';
    availableItem.innerHTML = `
        <div class="legend-color status-available"></div>
        <span>Available</span>
    `;
    legend.appendChild(availableItem);
    
    // User statuses
    settings.users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'legend-item';
        userItem.innerHTML = `
            <div class="legend-color" style="background-color: ${settings.userColors[user]}"></div>
            <span>${user} Working</span>
        `;
        legend.appendChild(userItem);
    });
}

function updateCurrentDate() {
    const dateInput = document.getElementById('currentDate');
    dateInput.value = currentDate.toISOString().split('T')[0];
}

function changeWeek(direction) {
    currentDate.setDate(currentDate.getDate() + (direction * 7));
    updateCurrentDate();
    displayWeek();
}

function goToDate() {
    const dateInput = document.getElementById('currentDate');
    currentDate = new Date(dateInput.value);
    displayWeek();
}

function goToToday() {
    currentDate = new Date();
    updateCurrentDate();
    displayWeek();
}

function getWeekDates(date) {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day - settings.weekStartDay;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        week.push(dayDate);
    }
    
    return week;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function displayWeek() {
    const weekContainer = document.getElementById('weekContainer');
    const weekDates = getWeekDates(currentDate);
    
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    
    weekContainer.innerHTML = `
        <div class="week-header">
            Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}
        </div>
        <div class="days-container" id="daysContainer">
        </div>
    `;
    
    const daysContainer = document.getElementById('daysContainer');
    
    weekDates.forEach(date => {
        const daySection = createDaySection(date);
        daysContainer.appendChild(daySection);
    });
}

function createDaySection(date) {
    const dateKey = formatDate(date);
    const dayReferences = references[dateKey] || [];
    
    const daySection = document.createElement('div');
    daySection.className = 'day-section';
    
    const isToday = formatDate(new Date()) === dateKey;
    const todayIndicator = isToday ? ' 📅' : '';
    
    daySection.innerHTML = `
        <div class="day-header" style="${isToday ? 'background-color: #28a745;' : ''}">
            <span>${dayNames[date.getDay()]}${todayIndicator}</span>
            <span class="day-date">${date.toLocaleDateString()}</span>
        </div>
        <div class="add-reference-form">
            <div class="form-row">
                <input type="text" id="b1-${dateKey}" placeholder="B1 NUMBER">
                <input type="text" id="remorque-${dateKey}" placeholder="REMORQUE">
                <button onclick="addReference('${dateKey}')">➕ Add</button>
            </div>
        </div>
        <div class="references-list">
            ${dayReferences.length > 0 ? createReferencesList(dateKey, dayReferences) : '<div class="no-references">📝 No references for this day</div>'}
        </div>
    `;
    
    return daySection;
}

function createReferencesList(dateKey, dayReferences) {
    let listHTML = '';
    
    dayReferences.forEach(ref => {
        const statusClass = ref.user === 'AVAILABLE' ? 'status-available' : '';
        const statusStyle = ref.user !== 'AVAILABLE' ? `style="background-color: ${settings.userColors[ref.user]}; color: #333;"` : '';
        const statusText = ref.user === 'AVAILABLE' ? '✅ Available' : `🔄 ${ref.user} Working`;
        
        listHTML += `
            <div class="reference-item">
                <div class="reference-info">
                    <div class="reference-numbers">
                        <span class="b1-number">📋 ${ref.b1}</span>
                        <span class="remorque-number">🚛 ${ref.remorque}</span>
                    </div>
                    <div class="reference-status">
                        <div class="status-indicator ${statusClass}" ${statusStyle}>
                            ${statusText}
                        </div>
                        <div class="user-selector">
                            <select class="user-select" onchange="updateUser('${dateKey}', ${ref.id}, this.value)">
                                <option value="AVAILABLE" ${ref.user === 'AVAILABLE' ? 'selected' : ''}>✅ Available</option>
                                ${settings.users.map(user => 
                                    `<option value="${user}" ${ref.user === user ? 'selected' : ''}>${user}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="last-updated">⏰ Updated: ${ref.lastUpdated}</div>
                </div>
                <div class="reference-actions">
                    <button class="delete-btn" onclick="deleteReference('${dateKey}', ${ref.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });
    
    return listHTML;
}

function addReference(dateKey) {
    const b1Input = document.getElementById(`b1-${dateKey}`);
    const remorqueInput = document.getElementById(`remorque-${dateKey}`);
    
    const b1 = b1Input.value.trim();
    const remorque = remorqueInput.value.trim();
    
    if (!b1 || !remorque) {
        updateStatus('Please fill in both B1 NUMBER and REMORQUE fields', true);
        return;
    }
    
    if (!references[dateKey]) {
        references[dateKey] = [];
    }
    
    // Check if reference already exists
    const exists = references[dateKey].some(ref => 
        ref.b1.toLowerCase() === b1.toLowerCase() && 
        ref.remorque.toLowerCase() === remorque.toLowerCase()
    );
    
    if (exists) {
        updateStatus('This reference already exists for this day', true);
        return;
    }
    
    const newReference = {
        id: Date.now(),
        b1: b1,
        remorque: remorque,
        user: 'AVAILABLE',
        lastUpdated: new Date().toLocaleString()
    };
    
    references[dateKey].push(newReference);
    saveData();
    
    // Clear inputs
    b1Input.value = '';
    remorqueInput.value = '';
    
    updateStatus(`Reference ${b1} - ${remorque} added successfully`);
}

function updateUser(dateKey, refId, newUser) {
    if (!references[dateKey]) return;
    
    const refIndex = references[dateKey].findIndex(ref => ref.id === refId);
    
    if (refIndex !== -1) {
        references[dateKey][refIndex].user = newUser;
        references[dateKey][refIndex].lastUpdated = new Date().toLocaleString();
        saveData();
        
        const ref = references[dateKey][refIndex];
        updateStatus(`Reference ${ref.b1} updated to ${newUser}`);
    }
}

function deleteReference(dateKey, refId) {
    if (confirm('Are you sure you want to delete this reference?')) {
        if (!references[dateKey]) return;
        
        const refToDelete = references[dateKey].find(ref => ref.id === refId);
        references[dateKey] = references[dateKey].filter(ref => ref.id !== refId);
        
        saveData();
        
        if (refToDelete) {
            updateStatus(`Reference ${refToDelete.b1} deleted successfully`);
        }
    }
}

function exportData() {
    const exportData = {
        settings: settings,
        references: references,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `reference-tracking-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    updateStatus('Data exported successfully');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                if (importedData.settings) {
                    settings = importedData.settings;
                    assignUserColors();
                }
                if (importedData.references) {
                    references = importedData.references;
                }
                
                saveSettings();
                saveData();
                
                updateStatus('Data imported successfully!');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            updateStatus('Error importing data. Please check the file format.', true);
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        if (confirm('This will delete everything. Are you absolutely sure?')) {
            // Create a backup before clearing
            exportData();
            
            references = {};
            saveData();
            updateStatus('All data has been cleared.');
        }
    }
}

// Function to count references for the current week
function countWeekReferences() {
    const weekDates = getWeekDates(currentDate);
    let totalReferences = 0;
    let availableReferences = 0;
    let assignedReferences = {};
    
    // Initialize counters for each user
    settings.users.forEach(user => {
        assignedReferences[user] = 0;
    });
    
    // Count references
    weekDates.forEach(date => {
        const dateKey = formatDate(date);
        const dayReferences = references[dateKey] || [];
        
        totalReferences += dayReferences.length;
        
        dayReferences.forEach(ref => {
            if (ref.user === 'AVAILABLE') {
                availableReferences++;
            } else if (assignedReferences[ref.user] !== undefined) {
                assignedReferences[ref.user]++;
            }
        });
    });
    
    // Display the counts
    const weekStart = weekDates[0].toLocaleDateString();
    const weekEnd = weekDates[6].toLocaleDateString();
    
    let summaryMessage = `Week of ${weekStart} - ${weekEnd}: `;
    summaryMessage += `Total: ${totalReferences}, Available: ${availableReferences}`;
    
    settings.users.forEach(user => {
        if (assignedReferences[user] > 0) {
            summaryMessage += `, ${user}: ${assignedReferences[user]}`;
        }
    });
    
    updateStatus(summaryMessage);
}

// Add a button to show weekly statistics
function addWeekStatsButton() {
    const dateNavigation = document.querySelector('.date-navigation');
    const statsButton = document.createElement('button');
    statsButton.textContent = '📊 Week Stats';
    statsButton.style.backgroundColor = '#17a2b8';
    statsButton.onclick = countWeekReferences;
    dateNavigation.appendChild(statsButton);
}
