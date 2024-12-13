const themes = {
    phi: {
        '--primary-100': '#FFA500',
        '--primary-200': '#dd8900',
        '--primary-300': '#904a00',
        '--accent-100': '#FFD700',
        '--accent-200': '#917800',
        '--text-100': '#000000',
        '--text-200': '#2c2c2c',
        '--bg-100': '#F9E6D3',
        '--bg-200': '#efdcc9',
        '--bg-300': '#c6b4a2',
        '--graph-line': '#FFA500',
        '--graph-fill': 'rgba(255, 165, 0, 0.2)',
        '--graph-zero': '#904a00'
    },
    inferno: {
        '--primary-100': '#FF4500',
        '--primary-200': '#ff7b3a',
        '--primary-300': '#ffe49a',
        '--accent-100': '#FFA500',
        '--accent-200': '#904a00',
        '--text-100': '#FFFFFF',
        '--text-200': '#e0e0e0',
        '--bg-100': '#2C0C0C',
        '--bg-200': '#3c1b1c',
        '--bg-300': '#573233',
        '--graph-line': '#FF4500',
        '--graph-fill': 'rgba(255, 69, 0, 0.2)',
        '--graph-zero': '#FFA500'
    },
    beta: {
        '--primary-100': '#007bff',
        '--primary-200': '#0056b3',
        '--primary-300': '#003d80',
        '--accent-100': '#007bff',
        '--accent-200': '#003d80',
        '--text-100': '#FFFFFF',
        '--text-200': '#e0e0e0',
        '--bg-100': '#000000',
        '--bg-200': '#1a1a1a',
        '--bg-300': '#333333',
        '--graph-line': '#4BC0C0',
        '--graph-fill': 'rgba(75, 192, 192, 0.2)',
        '--graph-zero': '#FFFFFF'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let phiChart;

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCaewNUV7i50S4DYMVgzBLVg2Rc8dJpmLk",
        authDomain: "phi-of-t.firebaseapp.com",
        projectId: "phi-of-t",
        storageBucket: "phi-of-t.appspot.com",
        messagingSenderId: "134964093529",
        appId: "1:134964093529:web:9537a8951d77d4ceac8748"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const firestore = firebase.firestore();

    // DOM Elements
    const signInButton = document.getElementById('sign-in-button');
    const signOutButton = document.getElementById('sign-out-button');
    const registerButton = document.getElementById('register-button');
    const submitPhiButton = document.getElementById('submit-phi');
    const phiForm = document.getElementById('phi-form');
    const signInForm = document.getElementById('sign-in-form');
    const registerForm = document.getElementById('register-form');
    const submitSignInButton = document.getElementById('submit-sign-in');
    const submitRegisterButton = document.getElementById('submit-register');
    const popupOverlay = document.getElementById('popup-overlay');
    const closeButtons = document.querySelectorAll('.close-popup');
    const enterPhiButton = document.getElementById('enter-phi-button');
    const backArrow = document.querySelector('.back-arrow');
    const userEmailDisplay = document.getElementById('user-email');
    const viewPhiButton = document.getElementById('view-phi-button');
    const phiChartContainer = document.getElementById('phi-chart-container');
    const mainContent = document.getElementById('app');
    const timeFrameSelect = document.getElementById('time-frame-select');
    const phiChartElement = document.getElementById('phiChart');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const phiValueInput = document.getElementById('phi-value');

    // Settings panel elements
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const themeInputs = document.querySelectorAll('input[name="theme"]');

    // Add Enter key handler for phi value input
    phiValueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            submitPhiValue();
        }
    });

    // Auth state observer
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            signInButton.style.display = 'none';
            registerButton.style.display = 'none';
            signOutButton.style.display = 'block';
            enterPhiButton.style.display = 'block';
            userEmailDisplay.style.display = 'block';
            userEmailDisplay.textContent = user.email;
            phiForm.style.display = 'none';
            signInForm.style.display = 'none';
            registerForm.style.display = 'none';
            popupOverlay.style.display = 'none';
            viewPhiButton.style.display = 'block';
            settingsButton.style.display = 'block';
            
            // Load saved theme
            firestore.collection('user-settings').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists && doc.data().theme) {
                        const savedTheme = doc.data().theme;
                        document.querySelector(`input[value="${savedTheme}"]`).checked = true;
                        applyTheme(savedTheme);
                    }
                });

            // First load the focuses
            await loadUserFocuses(user.uid);
            
            // Then try to restore the last focus
            const lastFocus = localStorage.getItem('lastFocus');
            if (lastFocus && focusSelect) {
                // Check if the focus option exists before setting it
                const options = Array.from(focusSelect.options);
                if (options.some(option => option.value === lastFocus)) {
                    focusSelect.value = lastFocus;
                } else {
                    localStorage.removeItem('lastFocus');
                }
            }

            // Update average Phi
            await fetchAndDisplayAveragePhi();
        } else {
            signInButton.style.display = 'block';
            registerButton.style.display = 'block';
            signOutButton.style.display = 'none';
            userEmailDisplay.style.display = 'none';
            enterPhiButton.style.display = 'none';
            phiForm.style.display = 'none';
            phiChartContainer.style.display = 'none';
            viewPhiButton.style.display = 'none';
            mainContent.style.display = 'flex';
            settingsButton.style.display = 'none';
            document.getElementById('focus-section').style.display = 'none';
        }
    });

    // Event Listeners
    signInButton.addEventListener('click', () => {
        signInForm.style.display = 'block';
        popupOverlay.style.display = 'flex';
    });

    registerButton.addEventListener('click', () => {
        registerForm.style.display = 'block';
        popupOverlay.style.display = 'flex';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            signInForm.style.display = 'none';
            registerForm.style.display = 'none';
            popupOverlay.style.display = 'none';
        });
    });

    signOutButton.addEventListener('click', () => {
        firebase.auth().signOut();
    });

    submitSignInButton.addEventListener('click', signInWithEmailAndPassword);
    submitRegisterButton.addEventListener('click', registerWithEmailAndPassword);
    submitPhiButton.addEventListener('click', async () => {
        const phiValue = parseFloat(phiValueInput.value);
        
        // Validate the input value
        if (phiValue < -20 || phiValue > 20 || isNaN(phiValue)) {
            alert("For our purposes, Phi is a real number that runs from -20 to 20");
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to submit Phi values');
            return;
        }

        try {
            await firestore.collection('phi-values').add({
                phi: phiValue,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                uid: user.uid
            });

            // Add flash animation
            phiForm.classList.add('submit-flash');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                phiForm.classList.remove('submit-flash');
                phiValueInput.value = '';
                phiForm.style.display = 'none';
                // Don't hide the main content
                mainContent.style.display = 'flex';
                // Update the chart if it's visible
                if (phiChartContainer.style.display === 'block') {
                    updateChartTimeframe(parseInt(timeFrameSelect.value));
                }
            }, 300); // Match animation duration

        } catch (error) {
            console.error('Error submitting Phi value:', error);
            alert('Error submitting value');
        }
    });

    enterPhiButton.addEventListener('click', () => {
        phiForm.style.display = 'block';
        mainContent.style.display = 'flex';
        enterPhiButton.style.display = 'none';
        phiValueInput.focus();  // Automatically focus the input field
    });

    backArrow.addEventListener('click', () => {
        phiForm.style.display = 'none';
        enterPhiButton.style.display = 'block';
    });

    viewPhiButton.addEventListener('click', () => {
        displayPhiValues();
        phiChartContainer.style.display = 'block';
        mainContent.style.display = 'flex';
    });

    // Chart back button handler
    const chartBackButton = document.createElement('button');
    chartBackButton.className = 'back-arrow';
    chartBackButton.innerHTML = '←';
    phiChartContainer.querySelector('.window-header').appendChild(chartBackButton);

    chartBackButton.addEventListener('click', () => {
        phiChartContainer.style.display = 'none';
        mainContent.style.display = 'flex';
    });

    // Auth functions
    function signInWithEmailAndPassword() {
        const email = emailInput.value;
        const password = passwordInput.value;
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                signInForm.style.display = 'none';
                popupOverlay.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error signing in:', error);
            });
    }

    function registerWithEmailAndPassword() {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                registerForm.style.display = 'none';
                popupOverlay.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error registering:', error);
            });
    }

    // Phi data functions
    async function savePhiValue() {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to submit Phi value');
            return;
        }

        try {
            const phiValue = parseFloat(phiValueInput.value);
            const timestamp = new Date();
            await firestore.collection('phi-values').add({
                uid: user.uid,
                phi: phiValue,
                timestamp: timestamp,
            });
            console.log('Phi value saved successfully');
            phiForm.style.display = 'none';
            enterPhiButton.style.display = 'block';
            phiValueInput.value = '';
        } catch (error) {
            console.error('Error saving Phi value:', error);
            alert('Error saving Phi value');
        }
    }

    async function fetchAndDisplayAveragePhi() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            const phiValuesSnapshot = await firestore.collection('phi-values')
                .where('uid', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(30)  // Last 30 values
                .get();

            if (!phiValuesSnapshot.empty) {
                const values = phiValuesSnapshot.docs.map(doc => doc.data().phi);
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                
                const averagePhiElement = document.getElementById('average-phi');
                if (averagePhiElement) {
                    averagePhiElement.textContent = average.toFixed(2);
                }
            }
        } catch (error) {
            console.error('Error fetching Phi values:', error);
        }
    }

    async function displayPhiValues() {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to view Phi values');
            return;
        }

        try {
            // Default to 7-day view
            const days = 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const phiValuesSnapshot = await firestore.collection('phi-values')
                .where('uid', '==', user.uid)
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'asc')
                .get();

            const phiData = phiValuesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    phi: data.phi,
                    timestamp: data.timestamp.toDate()
                };
            });

            createChart(phiData, days);
            phiChartContainer.style.display = 'block';
            mainContent.style.display = 'none';
        } catch (error) {
            console.error('Error fetching Phi values:', error);
            alert('Error fetching Phi values');
        }
    }

    function createChart(phiData, timeFrame = 7) {
        const ctx = phiChartElement.getContext('2d');
        if (phiChart) {
            phiChart.destroy();
        }

        // Create data points with x and y coordinates
        const chartData = phiData.map(data => ({
            x: data.timestamp,
            y: data.phi
        }));

        // Get current theme colors
        const style = getComputedStyle(document.documentElement);
        const graphLine = style.getPropertyValue('--graph-line').trim();
        const graphFill = style.getPropertyValue('--graph-fill').trim();
        const graphZero = style.getPropertyValue('--graph-zero').trim();
        const textColor = style.getPropertyValue('--text-100').trim();

        // Configure time unit and format based on timeFrame
        let timeUnit;
        if (timeFrame <= 7) {
            timeUnit = 'day';
        } else if (timeFrame <= 30) {
            timeUnit = 'day';
        } else {
            timeUnit = 'month';
        }

        phiChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Phi(t)',
                    data: chartData,
                    backgroundColor: graphFill,
                    borderColor: graphLine,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 5,
                    pointHoverRadius: 10,
                    pointBackgroundColor: graphLine,
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 3,
                    pointHoverBackgroundColor: graphLine,
                    pointHoverBorderColor: "#fff",
                    showLine: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 150
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: timeUnit,
                            displayFormats: {
                                day: 'MMM d',
                                month: 'MMM yyyy'
                            }
                        },
                        ticks: {
                            source: 'auto',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: timeFrame <= 7 ? 7 : 6,
                            font: {
                                family: "'IBM Plex Mono', monospace"
                            },
                            color: textColor,
                            callback: function(value, index, values) {
                                const date = new Date(value);
                                if (timeFrame === 0) {
                                    return date.toLocaleString('en-US', { 
                                        year: 'numeric',
                                        month: 'short'
                                    });
                                }
                                return date.toLocaleString('en-US', { 
                                    month: 'short',
                                    day: 'numeric'
                                });
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        min: -20,
                        max: 20,
                        ticks: {
                            font: {
                                family: "'IBM Plex Mono', monospace"
                            },
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                hover: {
                    mode: 'nearest',
                    intersect: false,
                    animationDuration: 150
                },
                plugins: {
                    annotation: {
                        annotations: {
                            zeroLine: {
                                type: 'line',
                                yMin: 0,
                                yMax: 0,
                                borderColor: graphZero,
                                borderWidth: 2
                            }
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                family: "'IBM Plex Mono', monospace"
                            },
                            color: textColor
                        }
                    },
                    tooltip: {
                        titleFont: {
                            family: "'IBM Plex Mono', monospace"
                        },
                        bodyFont: {
                            family: "'IBM Plex Mono', monospace"
                        },
                        callbacks: {
                            label: function(context) {
                                return `Phi: ${context.raw.y}`;
                            },
                            title: function(context) {
                                const date = context[0].raw.x;
                                const formattedDate = date.toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                });
                                return formattedDate;
                            }
                        }
                    }
                }
            }
        });

        // Force a redraw when theme changes
        phiChart.update();
    }

    function updateChartTimeframe(days) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = firestore.collection('phi-values')
            .where('uid', '==', user.uid)
            .orderBy('timestamp', 'asc');

        if (days > 0) {
            query = query.where('timestamp', '>=', startDate);
        }

        query.get().then(snapshot => {
            const phiData = snapshot.docs.map(doc => ({
                phi: doc.data().phi,
                timestamp: doc.data().timestamp.toDate()
            }));
            createChart(phiData, days);
        }).catch(error => {
            console.error('Error updating timeframe:', error);
        });
    }

    if (timeFrameSelect) {
        timeFrameSelect.addEventListener('change', () => {
            const selectedTimeFrame = parseInt(timeFrameSelect.value, 10);
            displayPhiValues(selectedTimeFrame);
        });
    }

    // Settings panel toggle
    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.toggle('visible');
        if (settingsPanel.classList.contains('visible')) {
            const user = firebase.auth().currentUser;
            if (user) {
                document.getElementById('focus-section').style.display = 'block';
            }
        }
    });

    // Add event listeners for theme changes
    themeInputs.forEach(input => {
        input.addEventListener('change', async () => {
            const selectedTheme = input.value;
            applyTheme(selectedTheme);
            
            // Save theme preference to Firebase
            const user = firebase.auth().currentUser;
            if (user) {
                await firestore.collection('user-settings').doc(user.uid).set({
                    theme: selectedTheme
                }, { merge: true });
            }
        });
    });

    function applyTheme(themeName) {
        console.log('Applying theme:', themeName);
        const theme = themes[themeName];
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
        
        // Redraw chart if it exists
        if (phiChart) {
            const currentData = phiChart.data.datasets[0].data.map((value, index) => ({
                phi: value,
                timestamp: phiChart.data.labels[index]
            }));
            phiChart.destroy();
            createChart(currentData);
        }
    }

    // Close settings panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && 
            !settingsButton.contains(e.target) && 
            settingsPanel.classList.contains('visible')) {
            settingsPanel.classList.remove('visible');
        }
    });

    // Initialize with Phi theme
    applyTheme('phi');

    // Time frame selection handling
    document.getElementById('time-frame-select').addEventListener('change', function(e) {
        const days = parseInt(e.target.value);
        updateChartTimeframe(days);
    });

    // Export functionality
    async function exportPhiData() {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to export data');
            return;
        }

        try {
            const phiValuesSnapshot = await firebase.firestore()
                .collection('phi-values')
                .where('uid', '==', user.uid)
                .orderBy('timestamp', 'asc')
                .get();

            if (phiValuesSnapshot.empty) {
                alert('No data to export');
                return;
            }

            let csvContent = "DateTime,Phi Value,Focus\n";
            
            // Create a map to store entries by timestamp string (to handle microsecond differences)
            const entriesByTimestamp = new Map();
            
            phiValuesSnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.timestamp) return; // Skip entries without timestamp
                
                const timestamp = data.timestamp.toDate();
                // Create a key that only includes up to seconds precision
                const timeKey = timestamp.toISOString().split('.')[0]; // Remove milliseconds
                
                // If we already have an entry for this second, keep the one with focus if available
                const existingEntry = entriesByTimestamp.get(timeKey);
                if (existingEntry) {
                    // If new entry has focus and old doesn't, or if new entry is more recent, use the new one
                    if ((!existingEntry.focus && data.focus) || 
                        (data.timestamp.seconds > existingEntry.timestamp.seconds)) {
                        entriesByTimestamp.set(timeKey, data);
                    }
                } else {
                    entriesByTimestamp.set(timeKey, data);
                }
            });

            // Convert the deduplicated entries to CSV
            for (const data of entriesByTimestamp.values()) {
                const timestamp = data.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                const focus = data.focus || '';
                csvContent += `${formattedDate},${data.phi},${focus}\n`;
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `phi_data_${new Date().toISOString().split('T')[0]}.csv`;
            
            link.onclick = () => {
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    document.body.removeChild(link);
                }, 0);
            };

            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Error exporting Phi data:', error);
            alert('Error exporting data');
        }
    }

    // Remove any existing event listeners and add new one
    const exportButton = document.getElementById('export-phi');
    if (exportButton) {
        const newExportButton = exportButton.cloneNode(true);
        exportButton.parentNode.replaceChild(newExportButton, exportButton);
        newExportButton.addEventListener('click', exportPhiData);
    }

    // Add Focus functionality
    const focusSection = document.getElementById('focus-section');
    const focusSelect = document.getElementById('focus-select');
    const addFocusModal = document.getElementById('add-focus-modal');
    const newFocusInput = document.getElementById('new-focus');
    const submitFocusButton = document.getElementById('submit-focus');
    const closeAddFocusButton = addFocusModal?.querySelector('.close-modal');

    // Show focus section when user is logged in
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            if (focusSection) focusSection.style.display = 'block';
            
            // First load the focuses
            await loadUserFocuses(user.uid);
            
            // Then try to restore the last focus
            const lastFocus = localStorage.getItem('lastFocus');
            if (lastFocus && focusSelect) {
                // Check if the focus option exists before setting it
                const options = Array.from(focusSelect.options);
                if (options.some(option => option.value === lastFocus)) {
                    focusSelect.value = lastFocus;
                } else {
                    localStorage.removeItem('lastFocus');
                }
            }
        } else {
            if (focusSection) focusSection.style.display = 'none';
            localStorage.removeItem('lastFocus');
        }
    });

    // Load user's focuses
    async function loadUserFocuses(userId) {
        if (!focusSelect) return;
        
        try {
            const focusesSnapshot = await firestore.collection('user-focuses')
                .where('uid', '==', userId)
                .get();

            // Clear existing options except the empty, none, and "Add New" options
            while (focusSelect.options.length > 3) {
                focusSelect.remove(1);
            }

            // Insert focuses before the "Add New" option
            focusesSnapshot.forEach(doc => {
                const focus = doc.data().focus;
                const option = new Option(focus, focus);
                focusSelect.add(option, focusSelect.options.length - 1);
            });
        } catch (error) {
            console.error('Error loading focuses:', error);
        }
    }

    // Handle focus selection
    if (focusSelect) {
        focusSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'add-new') {
                // Reset selection to previous value or empty
                this.value = this.dataset.lastValue || '';
                
                // Show modal
                if (addFocusModal && newFocusInput) {
                    addFocusModal.classList.add('visible');
                    newFocusInput.value = '';
                    newFocusInput.focus();
                }
            } else {
                // Store the new value
                this.dataset.lastValue = selectedValue;
                // Save to localStorage
                if (selectedValue && selectedValue !== 'none') {
                    localStorage.setItem('lastFocus', selectedValue);
                } else {
                    localStorage.removeItem('lastFocus');
                }
            }
        });
    }

    // Modify the existing phi submission to include focus
    async function submitPhiValue() {
        const phiValue = parseFloat(phiValueInput.value);
        
        // Validate the input value
        if (phiValue < -20 || phiValue > 20 || isNaN(phiValue)) {
            alert("For our purposes, Phi is a real number that runs from -20 to 20");
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to submit Phi values');
            return;
        }

        try {
            // Create the base document
            const phiDoc = {
                phi: phiValue,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                uid: user.uid
            };

            // Only add focus if it's selected and valid
            if (focusSelect && focusSelect.value && focusSelect.value !== 'none' && focusSelect.value !== 'add-new') {
                phiDoc.focus = focusSelect.value;
            }

            // Create the document
            await firebase.firestore().collection('phi-values').add(phiDoc);

            // Add flash animation
            if (phiForm) {
                phiForm.classList.add('submit-flash');
                
                setTimeout(() => {
                    phiForm.classList.remove('submit-flash');
                    if (phiValueInput) phiValueInput.value = '';
                    phiForm.style.display = 'none';
                    enterPhiButton.style.display = 'block';  // Show the button again
                    if (mainContent) mainContent.style.display = 'flex';
                    if (phiChartContainer && phiChartContainer.style.display === 'block') {
                        updateChartTimeframe(parseInt(timeFrameSelect.value));
                    }
                }, 300);
            }

        } catch (error) {
            console.error('Error submitting Phi value:', error);
            alert('Error submitting value');
        }
    }

    // Submit focus on enter key
    if (newFocusInput) {
        newFocusInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && submitFocusButton) {
                e.preventDefault();
                submitFocusButton.click();
            }
        });
    }

    // Submit new focus
    if (submitFocusButton) {
        submitFocusButton.addEventListener('click', async () => {
            if (!newFocusInput) return;
            
            const focus = newFocusInput.value.trim();
            if (!focus) return;

            const user = firebase.auth().currentUser;
            if (!user) return;

            try {
                // Add to user's focuses collection
                await firestore.collection('user-focuses').add({
                    uid: user.uid,
                    focus: focus,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                if (focusSelect) {
                    // Add option to select before the "Add New" option
                    const option = new Option(focus, focus);
                    focusSelect.add(option, focusSelect.options.length - 1);
                    
                    // Select the new focus
                    focusSelect.value = focus;
                    focusSelect.dataset.lastValue = focus;
                    localStorage.setItem('lastFocus', focus);
                }

                // Clear and close modal
                newFocusInput.value = '';
                if (addFocusModal) addFocusModal.classList.remove('visible');
            } catch (error) {
                console.error('Error adding focus:', error);
                alert('Error adding focus');
            }
        });
    }

    // Update click handler to use the same function
    if (submitPhiButton) {
        submitPhiButton.addEventListener('click', submitPhiValue);
    }

    // Add modal functionality
    const scaleModal = document.getElementById('scale-modal');
    const showScaleButton = document.getElementById('show-scale');
    const closeModalButton = document.querySelector('.close-modal');
    const modalOverlay = document.querySelector('.modal-overlay');

    function showModal() {
        scaleModal.classList.add('visible');
    }

    function hideModal() {
        scaleModal.classList.remove('visible');
    }

    showScaleButton.addEventListener('click', showModal);
    closeModalButton.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scaleModal.classList.contains('visible')) {
            hideModal();
        }
    });

    // Prevent clicks inside modal from closing it
    scaleModal.querySelector('.modal-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });
});