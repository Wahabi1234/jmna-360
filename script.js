// Default settings
let settings = {
    users: ['ABDO', 'MOUAD'],
    weekStartDay: 1, // Monday
    userColors: {}
};

// Data storage
let references = {};
let currentDate = new Date();

// Day names
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Color palette for users
const colorPalette = [
    '#cce5ff', '#fff3cd', '#d4edda', '#f8d7da', '#e2e3e5', 
    '#d1ecf1', '#ffeaa7', '#fab1a0', '#a29bfe', '#fd79a8'
];

// File name for data storage
const DATA_FILE_NAME = 'reference-tracking-data.json';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadData();
    updateCurrentDate();
    displayWeek();
    displayUsers();
    updateLegend();
    setupAutoSave();
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
    document.getElementById('lastSaved').textContent = 
        `Last saved: ${new Date().toLocaleTimeString()}`;
}

// File-based data management
function loadSettings() {
    try {
        // In a real file-based system, this would read from a file
        // For this demo, we'll still use localStorage but with improved error handling
        const savedSettings = localStorage.getItem('trackingSettings');
        if (savedSettings) {
            settings = { ...settings, ...JSON.parse(savedSettings) };
            updateStatus('Settings loaded successfully');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        updateStatus('Error loading settings. Using defaults.', true);
    }
    
    assignUserColors();
    document.getElementById('weekStartDay').value = settings.weekStartDay;
}

function saveSettings() {
    try {
        settings.weekStartDay = parseInt(document.getElementById('weekStartDay').value);
        
        // In a real file-based system, this would write to a file
        // For this demo, we'll still use localStorage but with improved error handling
        localStorage.setItem('trackingSettings', JSON.stringify(settings));
        
        updateStatus('Settings saved successfully');
        updateLastSaved();
        displayWeek();
    } catch (error) {
        console.error('Error saving settings:', error);
        updateStatus('Error saving settings', true);
    }
}

function loadData() {
    try {
        // In a real file-based system, this would read from a file
        // For this demo, we'll still use localStorage but with improved error handling
        const savedData = localStorage.getItem('trackingReferences');
        if (savedData) {
            references = JSON.parse(savedData);
            updateStatus('Reference data loaded successfully');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus('Error loading reference data', true);
    }
}

function saveData() {
    try {
        // In a real file-based system, this would write to a file
        // For this demo, we'll still use localStorage but with improved error handling
        localStorage.setItem('trackingReferences', JSON.stringify(references));
        
        updateStatus('Data saved successfully');
        updateLastSaved();
        
        // Create auto-backup every 10 saves (in a real system)
        const saveCount = parseInt(localStorage.getItem('saveCount') || '0') + 1;
        localStorage.setItem('saveCount', saveCount.toString());
        
        if (saveCount % 10 === 0) {
            createAutoBackup();
        }
    } catch (error) {
        console.error('Error saving data:', error);
        updateStatus('Error saving data', true);
    }
}

function createAutoBackup() {
    try {
        const backupData = {
            settings: settings,
            references: references,
            backupDate: new Date().toISOString()
        };
        
        // In a real file-based system, this would create a backup file
        // For this demo, we'll use localStorage
        localStorage.setItem(`backup_${new Date().toISOString().split('T')[0]}`, 
                            JSON.stringify(backupData));
        
        updateStatus('Auto-backup created successfully');
    } catch (error) {
        console.error('Error creating backup:', error);
        updateStatus('Error creating auto-backup', true);
    }
}

function setupAutoSave() {
    // Auto-save every 5 minutes
    setInterval(function() {
        saveData();
        updateStatus('Auto-saved data');
    }, 5 * 60 * 1000);
}

function assignUserColors() {
    settings.users.forEach((user, index) => {
        if (!settings.userColors[user]) {
            settings.userColors[user] = colorPalette[index % colorPalette.length];
        }
    });
}

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
            references[dateKey].forEach(ref => {
                if (ref.user === user) {
                    ref.user = 'AVAILABLE';
                    ref.lastUpdated = new Date().toLocaleString();
                }
            });
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
    displayWeek();
    
    // Clear inputs
    b1Input.value = '';
    remorqueInput.value = '';
    
    updateStatus(`Reference ${b1} - ${remorque} added successfully`);
}

function updateUser(dateKey, refId, newUser) {
    const dayReferences = references[dateKey] || [];
    const refIndex = dayReferences.findIndex(ref => ref.id === refId);
    
    if (refIndex !== -1) {
        references[dateKey][refIndex].user = newUser;
        references[dateKey][refIndex].lastUpdated = new Date().toLocaleString();
        saveData();
        displayWeek();
        
        const ref = references[dateKey][refIndex];
        updateStatus(`Reference ${ref.b1} updated to ${newUser}`);
    }
}

function deleteReference(dateKey, refId) {
    if (confirm('Are you sure you want to delete this reference?')) {
        const dayReferences = references[dateKey] || [];
        const refToDelete = dayReferences.find(ref => ref.id === refId);
        
        references[dateKey] = dayReferences.filter(ref => ref.id !== refId);
        saveData();
        displayWeek();
        
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
                displayUsers();
                updateLegend();
                displayWeek();
                
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
            const backupData = {
                settings: settings,
                references: references,
                backupDate: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(`backup_before_clear_${new Date().toISOString().split('T')[0]}`, 
                                   JSON.stringify(backupData));
            } catch (error) {
                console.error('Error creating backup before clear:', error);
            }
            
            references = {};
            saveData();
            displayWeek();
            updateStatus('All data has been cleared.');
        }
    }
}

// File System API implementation (for modern browsers)
// Note: This will only work in secure contexts (HTTPS or localhost)
async function saveToFile() {
    try {
        const exportData = {
            settings: settings,
            references: references,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        
        // Check if File System Access API is available
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: DATA_FILE_NAME,
                    types: [{
                        description: 'JSON File',
                        accept: {'application/json': ['.json']},
                    }],
                });
                
                const writable = await handle.createWritable();
                await writable.write(dataStr);
                await writable.close();
                
                updateStatus('Data saved to file successfully');
                return true;
            } catch (err) {
                console.error('Error saving to file:', err);
                // Fall back to localStorage if user cancels or there's an error
                localStorage.setItem('trackingReferences', JSON.stringify(references));
                localStorage.setItem('trackingSettings', JSON.stringify(settings));
                updateStatus('Data saved to browser storage (file access failed)');
                return false;
            }
        } else {
            // Fall back to localStorage if File System API is not available
            localStorage.setItem('trackingReferences', JSON.stringify(references));
            localStorage.setItem('trackingSettings', JSON.stringify(settings));
            updateStatus('Data saved to browser storage (file system API not available)');
            return false;
        }
    } catch (error) {
        console.error('Error in saveToFile:', error);
        updateStatus('Error saving data to file', true);
        return false;
    }
}

async function loadFromFile() {
    try {
        // Check if File System Access API is available
        if ('showOpenFilePicker' in window) {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: {'application/json': ['.json']},
                    }],
                    multiple: false,
                });
                
                const file = await fileHandle.getFile();
                const contents = await file.text();
                
                const data = JSON.parse(contents);
                
                if (data.settings) {
                    settings = data.settings;
                    assignUserColors();
                }
                
                if (data.references) {
                    references = data.references;
                }
                
                displayUsers();
                updateLegend();
                displayWeek();
                
                updateStatus('Data loaded from file successfully');
                return true;
            } catch (err) {
                console.error('Error loading from file:', err);
                // Fall back to localStorage if user cancels or there's an error
                loadData();
                updateStatus('Data loaded from browser storage (file access failed)');
                return false;
            }
        } else {
            // Fall back to localStorage if File System API is not available
            loadData();
            updateStatus('Data loaded from browser storage (file system API not available)');
            return false;
        }
    } catch (error) {
        console.error('Error in loadFromFile:', error);
        updateStatus('Error loading data from file', true);
        return false;
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

// Check for unsaved changes before leaving the page
window.addEventListener('beforeunload', function(e) {
    // Save data before leaving
    try {
        localStorage.setItem('trackingReferences', JSON.stringify(references));
        localStorage.setItem('trackingSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving data before unload:', error);
    }
});

// Auto-refresh data from storage every 30 seconds
// This is useful when multiple browser windows are open
setInterval(function() {
    try {
        const savedData = localStorage.getItem('trackingReferences');
        if (savedData) {
            const newReferences = JSON.parse(savedData);
            if (JSON.stringify(newReferences) !== JSON.stringify(references)) {
                references = newReferences;
                displayWeek();
                updateStatus('Data refreshed from storage');
            }
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}, 30000);
