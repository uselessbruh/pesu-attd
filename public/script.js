// API Base URL - Empty string for relative path in Vercel
const API_BASE_URL = '';

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const errorMessage = document.getElementById('errorMessage');

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.querySelector('.btn-text').textContent = 'Logging in...';
    loginBtn.querySelector('.spinner').style.display = 'block';
    errorMessage.style.display = 'none';

    try {
        // Login request
        const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            credentials: 'include'
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            throw new Error(loginData.error || 'Login failed');
        }

        // Fetch attendance data
        const dataResponse = await fetch(`${API_BASE_URL}/api/all_data`, {
            credentials: 'include'
        });

        const data = await dataResponse.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch data');
        }

        // Save credentials if Remember Me is checked
        if (rememberMe) {
            localStorage.setItem('savedUsername', username);
            localStorage.setItem('savedPassword', btoa(password)); // Basic encoding
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('rememberMe');
        }

        // Store data and show dashboard
        displayDashboard(data);

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';

        // Reset button state
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = 'Login';
        loginBtn.querySelector('.spinner').style.display = 'none';
    }
});

// Display Dashboard
function displayDashboard(data) {
    // Hide login, show dashboard
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'block';

    // Set student info
    document.getElementById('studentName').textContent = data.student_name;

    if (data.semesters && data.semesters.length > 0) {
        document.getElementById('semesterName').textContent = data.semesters[0].name;
    }

    // Calculate statistics
    const attendance = data.attendance || [];
    const totalCourses = attendance.length;
    const avgAttendance = totalCourses > 0
        ? Math.round(attendance.reduce((sum, course) => sum + course.percentage, 0) / totalCourses)
        : 0;
    const goodCourses = attendance.filter(course => course.percentage >= 75).length;
    const lowCourses = attendance.filter(course => course.percentage < 75).length;

    // Update stats
    document.getElementById('totalCourses').textContent = totalCourses;
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';
    document.getElementById('goodCourses').textContent = goodCourses;
    document.getElementById('lowCourses').textContent = lowCourses;

    // Display attendance table
    window.currentAttendanceData = attendance;
    
    // Restore saved sort order
    const savedSortOrder = localStorage.getItem('sortOrder') || 'normal';
    const sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
        sortSelect.value = savedSortOrder;
    }
    
    displayAttendance(attendance);
}

// Display Attendance Cards
function displayAttendance(attendance) {
    const container = document.getElementById('attendanceTable');

    if (!attendance || attendance.length === 0) {
        container.innerHTML = '<div class="loading">No attendance data available</div>';
        return;
    }

    // Get current sort order
    const sortSelect = document.getElementById('sortOrder');
    const sortOrder = sortSelect?.value || localStorage.getItem('sortOrder') || 'normal';
    let sortedAttendance = [...attendance];

    if (sortOrder === 'ascending') {
        sortedAttendance.sort((a, b) => a.percentage - b.percentage);
    } else if (sortOrder === 'descending') {
        sortedAttendance.sort((a, b) => b.percentage - a.percentage);
    }
    // 'normal' keeps original order

    const html = `
        <div class="attendance-grid">
            ${sortedAttendance.map((course, index) => {
        const percentage = course.percentage;
        const attended = parseInt(course.attended);
        const total = parseInt(course.total);
        const target = 75;

        let statusHtml = '';

        if (percentage < target) {
            // Formula: x = ceil( (R/100 * T - A) / (1 - R/100) )
            const R = target;
            const numerator = (R / 100) * total - attended;
            const denominator = 1 - (R / 100);
            const classesToAttend = Math.ceil(numerator / denominator);

            statusHtml = `
                        <div class="status-box status-warning">
                            <div class="status-icon">⚠️</div>
                            <div class="status-text">
                                You need to attend <strong>${classesToAttend}</strong> more consecutive session${classesToAttend > 1 ? 's' : ''} to reach 75%.
                            </div>
                        </div>
                    `;
        } else {
            // Formula: x = floor( A / (R/100) - T )
            const R = target;
            const classesToBunk = Math.floor(attended / (R / 100) - total);

            if (classesToBunk > 0) {
                statusHtml = `
                            <div class="status-box status-success">
                                <div class="status-icon">🎉</div>
                                <div class="status-text">
                                    You can safely skip <strong>${classesToBunk}</strong> session${classesToBunk > 1 ? 's' : ''} and stay above 75%.
                                </div>
                            </div>
                        `;
            } else {
                statusHtml = `
                            <div class="status-box status-neutral">
                                <div class="status-icon">✅</div>
                                <div class="status-text">
                                    You are on track, but cannot skip any sessions right now.
                                </div>
                            </div>
                        `;
            }
        }

        const badgeClass = percentage >= 75 ? 'badge-high' : percentage >= 65 ? 'badge-medium' : 'badge-low';
        const cardClass = percentage >= 75 ? 'good-attendance' : 'low-attendance';
        const progressClass = percentage >= 75 ? 'good' : percentage >= 65 ? '' : 'low';

        return `
                    <div class="attendance-card ${cardClass}" style="animation-delay: ${index * 0.1}s">
                        <div class="course-header">
                            <div>
                                <div class="course-code">${course.code}</div>
                                <div class="course-name">${course.name}</div>
                            </div>
                            <div class="attendance-badge ${badgeClass}">
                                ${percentage}%
                            </div>
                        </div>
                        
                        <div class="course-stats">
                            <div class="stat-item">
                                <span>✅</span>
                                <span><strong>${course.attended}</strong> attended</span>
                            </div>
                            <div class="stat-item">
                                <span>📊</span>
                                <span><strong>${course.total}</strong> total sessions</span>
                            </div>
                        </div>
                        
                        <div class="progress-bar-container">
                            <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
                        </div>

                        ${statusHtml}

                        <div class="predictor-box">
                            <div class="predictor-title">📊 Attendance Calculator</div>
                            
                            <div class="predictor-input-row">
                                <input type="number" min="0" value="0" placeholder="Add Presents" class="predictor-input-half" id="add-present-${index}">
                                <input type="number" min="0" value="0" placeholder="Add Absents" class="predictor-input-half" id="add-absent-${index}">
                            </div>
                            <button class="btn-calculate" onclick="calculateNewAttendance(${index}, ${attended}, ${total})">Calculate</button>
                            <div id="calc-result-${index}" class="calc-result"></div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    container.innerHTML = html;
}

// Calculate new attendance with added presents and absents
window.calculateNewAttendance = function (index, currentAttended, currentTotal) {
    const presentInput = document.getElementById(`add-present-${index}`);
    const absentInput = document.getElementById(`add-absent-${index}`);
    const resultDiv = document.getElementById(`calc-result-${index}`);

    const addPresent = parseInt(presentInput.value) || 0;
    const addAbsent = parseInt(absentInput.value) || 0;

    if (addPresent === 0 && addAbsent === 0) {
        resultDiv.innerHTML = '<div class="error-msg">⚠️ Please enter at least one value</div>';
        return;
    }

    // Calculate new attendance
    const newAttended = currentAttended + addPresent;
    const newTotal = currentTotal + addPresent + addAbsent;
    const newPercentage = ((newAttended / newTotal) * 100).toFixed(2);
    const currentPercentage = ((currentAttended / currentTotal) * 100).toFixed(2);
    const change = (newPercentage - currentPercentage).toFixed(2);

    const target = 75;
    let additionalStats = '';

    if (newPercentage < target) {
        // Calculate sessions needed to reach 75%
        const needed = Math.ceil((target / 100 * newTotal - newAttended) / (1 - target / 100));
        additionalStats = `
            <div class="stat-warning">
                <div class="stat-icon">⚠️</div>
                <div>Need to attend <strong>${needed}</strong> more consecutive session${needed > 1 ? 's' : ''} to reach 75%</div>
            </div>
        `;
    } else {
        // Calculate sessions that can be skipped
        const canSkip = Math.floor(newAttended / (target / 100) - newTotal);
        if (canSkip > 0) {
            additionalStats = `
                <div class="stat-success">
                    <div class="stat-icon">🎉</div>
                    <div>Can skip <strong>${canSkip}</strong> session${canSkip > 1 ? 's' : ''} and stay above 75%</div>
                </div>
            `;
        } else {
            additionalStats = `
                <div class="stat-neutral">
                    <div class="stat-icon">✅</div>
                    <div>On track, but cannot skip any sessions right now</div>
                </div>
            `;
        }
    }

    const changeColor = change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    const changeSymbol = change >= 0 ? '📈' : '📉';
    const badgeClass = newPercentage >= 75 ? 'badge-high' : newPercentage >= 65 ? 'badge-medium' : 'badge-low';

    resultDiv.innerHTML = `
        <div class="result-summary">
            <div class="result-header">
                <div>New Attendance:</div>
                <div class="attendance-badge ${badgeClass}">${newPercentage}%</div>
            </div>
            <div class="result-details">
                <div><strong>${newAttended}</strong>/${newTotal} sessions</div>
                <div style="color: ${changeColor}">${changeSymbol} ${change > 0 ? '+' : ''}${change}%</div>
            </div>
        </div>
        ${additionalStats}
    `;
};

// Sort order change handler
window.addEventListener('load', () => {
    const sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
        // Load saved sort order
        const savedSortOrder = localStorage.getItem('sortOrder');
        if (savedSortOrder) {
            sortSelect.value = savedSortOrder;
        }
        
        // Save sort order on change
        sortSelect.addEventListener('change', () => {
            localStorage.setItem('sortOrder', sortSelect.value);
            if (window.currentAttendanceData) {
                displayAttendance(window.currentAttendanceData);
            }
        });
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, {
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear stored credentials
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('rememberMe');

    // Reset form
    loginForm.reset();
    loginBtn.disabled = false;
    loginBtn.querySelector('.btn-text').textContent = 'Login';
    loginBtn.querySelector('.spinner').style.display = 'none';

    // Show login page
    dashboardPage.style.display = 'none';
    loginPage.style.display = 'block';
});

// Check if already logged in on page load
window.addEventListener('load', async () => {
    // Check for saved credentials
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberMe = localStorage.getItem('rememberMe');

    if (rememberMe === 'true' && savedUsername && savedPassword) {
        // Auto-fill credentials
        document.getElementById('username').value = savedUsername;
        document.getElementById('password').value = atob(savedPassword); // Decode
        document.getElementById('rememberMe').checked = true;

        // Auto-login
        try {
            loginBtn.disabled = true;
            loginBtn.querySelector('.btn-text').textContent = 'Logging in...';
            loginBtn.querySelector('.spinner').style.display = 'block';

            const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(savedUsername)}&password=${encodeURIComponent(atob(savedPassword))}`,
                credentials: 'include'
            });

            const loginData = await loginResponse.json();

            if (loginData.success) {
                const dataResponse = await fetch(`${API_BASE_URL}/api/all_data`, {
                    credentials: 'include'
                });

                const data = await dataResponse.json();

                if (data.success) {
                    displayDashboard(data);
                    return;
                }
            }
        } catch (error) {
            console.log('Auto-login failed:', error);
        }

        // Reset button state if auto-login failed
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = 'Login';
        loginBtn.querySelector('.spinner').style.display = 'none';
    } else {
        // Check for active session
        try {
            const response = await fetch(`${API_BASE_URL}/api/all_data`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                displayDashboard(data);
            }
        } catch (error) {
            // User not logged in, stay on login page
            console.log('Not logged in');
        }
    }
});
