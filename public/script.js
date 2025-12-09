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
    displayAttendance(attendance);
}

// Display Attendance Cards
function displayAttendance(attendance) {
    const container = document.getElementById('attendanceTable');

    if (!attendance || attendance.length === 0) {
        container.innerHTML = '<div class="loading">No attendance data available</div>';
        return;
    }

    const html = `
        <div class="attendance-grid">
            ${attendance.map((course, index) => {
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
                                You need to attend <strong>${classesToAttend}</strong> more consecutive classes to reach 75%.
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
                                    You can safely bunk <strong>${classesToBunk}</strong> classes and stay above 75%.
                                </div>
                            </div>
                        `;
            } else {
                statusHtml = `
                            <div class="status-box status-neutral">
                                <div class="status-icon">✅</div>
                                <div class="status-text">
                                    You are on track, but cannot bunk any classes right now.
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
                                <span><strong>${course.total}</strong> total classes</span>
                            </div>
                        </div>
                        
                        <div class="progress-bar-container">
                            <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
                        </div>

                        ${statusHtml}

                        <div class="predictor-box">
                            <div class="predictor-title">Attendance Predictor</div>
                            <div class="predictor-input-group">
                                <input type="number" min="1" placeholder="Attend X classes" class="predictor-input" id="pred-input-${index}">
                                <button class="btn-predict" onclick="calculatePrediction(${index}, ${attended}, ${total})">Calculate</button>
                            </div>
                            <div id="pred-result-${index}" class="predictor-result"></div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    container.innerHTML = html;
}

// Global function for prediction
window.calculatePrediction = function (index, attended, total) {
    const input = document.getElementById(`pred-input-${index}`);
    const resultDiv = document.getElementById(`pred-result-${index}`);
    const x = parseInt(input.value);

    if (!x || x < 0) {
        resultDiv.innerHTML = '<span style="color: var(--accent-red)">Please enter a valid number</span>';
        return;
    }

    // Formula: New % = ( (A + x) / (T + x) ) * 100
    const newPercentage = ((attended + x) / (total + x) * 100).toFixed(2);

    resultDiv.innerHTML = `If you attend <strong>${x}</strong> more classes, your attendance will be <strong>${newPercentage}%</strong>`;
};

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, {
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

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
});
