let isPageLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    if (isPageLoaded) return;
    isPageLoaded = true;

    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }

    // Page detection
    const isLoginPage = window.location.pathname.includes('login');
    const isYourCoursesPage = window.location.pathname.includes('your-courses');
    const isCandidateDetailsPage = window.location.pathname.includes('candidate-details');

    // Check login status and redirect if necessary
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = '/login';
        return;
    }

    // Update navigation links
    updateAuthLink();
    updateProfileLink();

    // Show login success notification
    if (sessionStorage.getItem('justLoggedIn') === 'true') {
        showNotification('Login successful!');
        sessionStorage.removeItem('justLoggedIn');
    }

    // Load page-specific content
    if (isYourCoursesPage && isLoggedIn) {
        displayEnrolledCourses();
    }

    if (isCandidateDetailsPage && isLoggedIn) {
        displayCandidateDetails();
    }

    // Profile dropdown hover behavior
    const profile = document.querySelector('.profile');
    const dropdown = document.querySelector('.profile-dropdown');
    let timeoutId;

    if (profile && dropdown) {
        profile.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            dropdown.style.display = 'block';
        });

        profile.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                if (!dropdown.matches(':hover')) {
                    dropdown.style.display = 'none';
                }
            }, 500);
        });

        dropdown.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            dropdown.style.display = 'block';
        });

        dropdown.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                if (!profile.matches(':hover')) {
                    dropdown.style.display = 'none';
                }
            }, 500);
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const otpInput = document.getElementById('otp');
            const loginButton = document.getElementById('loginButton');
            const emailGroup = document.getElementById('email-group');
            const otpGroup = document.getElementById('otp-group');

            if (!emailInput || !otpInput || !loginButton || !emailGroup || !otpGroup) {
                console.error('Login form elements missing');
                showNotification('Form error. Please refresh the page.', true);
                return;
            }

            const formData = new FormData(loginForm);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    if (otpGroup.style.display === 'none') {
                        emailGroup.style.display = 'none';
                        otpGroup.style.display = 'block';
                        loginButton.textContent = 'Verify OTP';
                        otpInput.required = true;
                        showNotification(result.message);
                    } else {
                        sessionStorage.setItem('isLoggedIn', 'true');
                        sessionStorage.setItem('username', formData.get('email').split('@')[0]);
                        sessionStorage.setItem('justLoggedIn', 'true');
                        showNotification(result.message);
                        setTimeout(() => {
                            window.location.href = result.redirect;
                        }, 1000);
                    }
                } else {
                    showNotification(result.message, true);
                    if (otpGroup.style.display !== 'none') {
                        emailGroup.style.display = 'block';
                        otpGroup.style.display = 'none';
                        loginButton.textContent = 'Send OTP';
                        otpInput.required = false;
                        emailInput.value = '';
                    }
                }
            } catch (error) {
                console.error('Login fetch error:', error);
                showNotification('An error occurred. Please try again.', true);
            }
        });
    }
});

function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.style.display = sessionStorage.getItem('isLoggedIn') === 'true' ? 'none' : 'block';
    } else {
        console.warn('Auth link element not found');
    }
}

function updateProfileLink() {
    const profileLink = document.getElementById('profile-link');
    if (!profileLink) {
        console.warn('Profile link element not found');
        return;
    }

    const usernameSpan = profileLink.querySelector('.username');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        const username = sessionStorage.getItem('username') || 'User';
        usernameSpan.innerHTML = `<span class="profile-icon">👤</span> Hi, ${username}`;
        profileLink.style.display = 'block';
    } else {
        profileLink.style.display = 'none';
    }
}

function checkLogin(event) {
    event.preventDefault();
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        const button = event.target;
        const courseCard = button.closest('.course-card');
        if (!courseCard) {
            console.error('Course card not found');
            showNotification('Error: Unable to find course.', true);
            return;
        }

        const courseTitle = courseCard.querySelector('h3')?.textContent;
        const courseImage = courseCard.querySelector('.course-img')?.src;
        const courseDescription = courseCard.querySelector('p')?.textContent;

        if (!courseTitle || !courseImage || !courseDescription) {
            console.error('Missing course details:', { title: courseTitle, image: courseImage, desc: courseDescription });
            showNotification('Error: Course details missing.', true);
            return;
        }

        let enrolledCourses = sessionStorage.getItem('enrolledCourses');
        enrolledCourses = enrolledCourses ? JSON.parse(enrolledCourses) : [];

        if (enrolledCourses.some(course => course.title === courseTitle)) {
            showNotification('You are already enrolled in this course!', true);
            return;
        }

        enrolledCourses.push({ title: courseTitle, image: courseImage, description: courseDescription });
        sessionStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
        showNotification(`Enrolled in ${courseTitle} successfully!`);
    } else {
        showNotification('Please log in to enroll.', true);
        setTimeout(() => window.location.href = '/login', 2000);
    }
}

function displayEnrolledCourses() {
    const enrolledCoursesSection = document.getElementById('enrolled-courses');
    if (!enrolledCoursesSection) {
        console.error('Enrolled courses section not found');
        showNotification('Error: Unable to load courses.', true);
        return;
    }

    let enrolledCourses = sessionStorage.getItem('enrolledCourses');
    enrolledCourses = enrolledCourses ? JSON.parse(enrolledCourses) : [];

    enrolledCoursesSection.innerHTML = '';

    if (enrolledCourses.length === 0) {
        enrolledCoursesSection.innerHTML = '<p class="no-courses">You have not enrolled in any courses yet.</p>';
    } else {
        enrolledCourses.forEach(course => {
            if (!course.title || !course.image || !course.description) {
                console.warn('Invalid course data:', course);
                return;
            }
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <img src="${course.image}" alt="${course.title}" class="course-img">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <button class="btn-watch" onclick="watchCourse('${course.title}')">Watch</button>
                <button class="btn-unenroll" onclick="unenrollCourse('${course.title}')">Unenroll</button>
            `;
            enrolledCoursesSection.appendChild(courseCard);
        });
    }
}

function watchCourse(courseTitle) {
    if (!courseTitle) {
        console.error('No course title provided to watchCourse');
        return;
    }
    showNotification(`Watching ${courseTitle}...`);
}

function unenrollCourse(courseTitle) {
    if (!courseTitle) {
        console.error('No course title provided to unenrollCourse');
        return;
    }
    let enrolledCourses = sessionStorage.getItem('enrolledCourses');
    enrolledCourses = enrolledCourses ? JSON.parse(enrolledCourses) : [];

    const updatedCourses = enrolledCourses.filter(course => course.title !== courseTitle);
    sessionStorage.setItem('enrolledCourses', JSON.stringify(updatedCourses));

    showNotification('Unenrolled successfully!');
    displayEnrolledCourses();
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }

    notification.textContent = message;
    notification.className = 'notification ' + (isError ? 'notification-error' : 'notification-success');
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function displayCandidateDetails() {
    const candidateDetailsSection = document.getElementById('candidate-details');
    if (!candidateDetailsSection) {
        console.error('Candidate details section not found');
        return;
    }

    const name = sessionStorage.getItem('candidateName') || 'Not Provided';
    const email = sessionStorage.getItem('candidateEmail') || 'Not Provided';
    const phone = sessionStorage.getItem('candidatePhone') || 'Not Provided';
    const username = sessionStorage.getItem('username') || 'User';

    const nameEl = document.getElementById('candidate-name');
    const emailEl = document.getElementById('candidate-email');
    const phoneEl = document.getElementById('candidate-phone');
    const usernameEl = document.getElementById('candidate-username');
    const editNameEl = document.getElementById('edit-name');
    const editEmailEl = document.getElementById('edit-email');
    const editPhoneEl = document.getElementById('edit-phone');
    const editUsernameEl = document.getElementById('edit-username');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;
    if (usernameEl) usernameEl.textContent = username;
    if (editNameEl) editNameEl.value = name;
    if (editEmailEl) editEmailEl.value = email;
    if (editPhoneEl) editPhoneEl.value = phone;
    if (editUsernameEl) editUsernameEl.value = username;

    const educationList = document.getElementById('education-list');
    if (educationList) {
        let education = sessionStorage.getItem('candidateEducation');
        education = education ? JSON.parse(education) : [];

        educationList.innerHTML = '';
        if (education.length === 0) {
            educationList.innerHTML = '<p class="no-education">No education details provided yet.</p>';
        } else {
            education.forEach(edu => {
                const eduItem = document.createElement('div');
                eduItem.className = 'education-item';
                eduItem.innerHTML = `
                    <p><strong>Degree:</strong> ${edu.degree}</p>
                    <p><strong>Institution:</strong> ${edu.institution}</p>
                    <p><strong>Year:</strong> ${edu.year}</p>
                `;
                educationList.appendChild(eduItem);
            });
        }
    }

    const certificateList = document.getElementById('certificate-list');
    if (certificateList) {
        let certificates = sessionStorage.getItem('candidateCertificates');
        certificates = certificates ? JSON.parse(certificates) : [];

        certificateList.innerHTML = '';
        if (certificates.length === 0) {
            certificateList.innerHTML = '<p class="no-certificates">No certificates earned yet.</p>';
        } else {
            certificates.forEach(cert => {
                const certCard = document.createElement('div');
                certCard.className = 'course-card';
                certCard.innerHTML = `
                    <img src="${cert.image || 'default-cert.png'}" alt="${cert.title}" class="course-img">
                    <h3>${cert.title} Certificate</h3>
                    <p>${cert.description}</p>
                `;
                certificateList.appendChild(certCard);
            });
        }
    }

    const resumeContainer = document.getElementById('resume-container');
    const currentResume = document.getElementById('current-resume');
    if (resumeContainer && currentResume) {
        let resumeFile = sessionStorage.getItem('candidateResume');
        if (resumeFile) {
            resumeContainer.innerHTML = `
                <p><strong>Resume:</strong> <a href="${resumeFile}" target="_blank">View Resume</a></p>
            `;
            currentResume.innerHTML = `
                <strong>Current Resume:</strong> <a href="${resumeFile}" target="_blank">View Resume</a>
            `;
        } else {
            resumeContainer.innerHTML = '<p id="no-resume">No resume uploaded yet.</p>';
            currentResume.textContent = 'No resume uploaded yet.';
        }
    }

    updateProfileVisibility();
}

function toggleEdit(section) {
    const viewSection = document.getElementById(`${section}-details-view`);
    const editSection = document.getElementById(`${section}-details-edit`);
    if (!viewSection || !editSection) {
        console.error(`Toggle edit failed: ${section} section not found`);
        return;
    }

    if (viewSection.style.display === 'none') {
        viewSection.style.display = 'block';
        editSection.style.display = 'none';
    } else {
        viewSection.style.display = 'none';
        editSection.style.display = 'block';
        if (section === 'education') populateEducationEdit();
        if (section === 'certificate') populateCertificateEdit();
    }
}

function populateEducationEdit() {
    const editList = document.getElementById('education-edit-list');
    if (!editList) return;

    let education = sessionStorage.getItem('candidateEducation');
    education = education ? JSON.parse(education) : [];

    editList.innerHTML = '';
    if (education.length === 0) {
        addEducationField();
    } else {
        education.forEach((edu, index) => {
            addEducationField(edu.degree, edu.institution, edu.year, index);
        });
    }
}

function addEducationField(degree = '', institution = '', year = '', index = Date.now()) {
    const editList = document.getElementById('education-edit-list');
    if (!editList) return;

    const eduDiv = document.createElement('div');
    eduDiv.className = 'education-edit-item';
    eduDiv.dataset.index = index;
    eduDiv.innerHTML = `
        <div class="input-group">
            <label>Degree:</label>
            <input type="text" class="edit-degree" value="${degree}">
        </div>
        <div class="input-group">
            <label>Institution:</label>
            <input type="text" class="edit-institution" value="${institution}">
        </div>
        <div class="input-group">
            <label>Year:</label>
            <input type="text" class="edit-year" value="${year}">
        </div>
        <button class="btn btn-unenroll" onclick="removeEducationField(${index})">Remove</button>
    `;
    editList.appendChild(eduDiv);
}

function removeEducationField(index) {
    const item = document.querySelector(`.education-edit-item[data-index="${index}"]`);
    if (item) item.remove();
}

function populateCertificateEdit() {
    const editList = document.getElementById('certificate-edit-list');
    if (!editList) return;

    let certificates = sessionStorage.getItem('candidateCertificates');
    certificates = certificates ? JSON.parse(certificates) : [];

    editList.innerHTML = '';
    certificates.forEach((cert, index) => {
        addCertificateField(cert.title, cert.description, cert.image, index);
    });
}

function addCertificateField(title = '', description = '', image = '', index = Date.now()) {
    const editList = document.getElementById('certificate-edit-list');
    if (!editList) return;

    const certDiv = document.createElement('div');
    certDiv.className = 'certificate-edit-item';
    certDiv.dataset.index = index;
    certDiv.innerHTML = `
        <div class="input-group">
            <label>Title:</label>
            <input type="text" class="edit-cert-title" value="${title}">
        </div>
        <div class="input-group">
            <label>Description:</label>
            <input type="text" class="edit-cert-desc" value="${description}">
        </div>
        <div class="input-group">
            <label>Image URL:</label>
            <input type="text" class="edit-cert-image" value="${image}" placeholder="e.g., certificate.png">
        </div>
        <button class="btn btn-unenroll" onclick="removeCertificate(${index})">Remove</button>
    `;
    editList.appendChild(certDiv);
}

function removeCertificate(index) {
    const item = document.querySelector(`.certificate-edit-item[data-index="${index}"]`);
    if (item) item.remove();
}

function saveDetails(section) {
    if (section === 'personal') {
        const name = document.getElementById('edit-name')?.value.trim();
        const email = document.getElementById('edit-email')?.value.trim();
        const phone = document.getElementById('edit-phone')?.value.trim();

        if (!name || !email || !phone) {
            showNotification('Please fill in all required fields.', true);
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            showNotification('Please enter a valid email address.', true);
            return;
        }

        sessionStorage.setItem('candidateName', name);
        sessionStorage.setItem('candidateEmail', email);
        sessionStorage.setItem('candidatePhone', phone);

        document.getElementById('candidate-name').textContent = name;
        document.getElementById('candidate-email').textContent = email;
        document.getElementById('candidate-phone').textContent = phone;

        toggleEdit('personal');
        showNotification('Personal details updated successfully!');
    } else if (section === 'education') {
        const editItems = document.querySelectorAll('.education-edit-item');
        const education = [];
        editItems.forEach(item => {
            const degree = item.querySelector('.edit-degree')?.value.trim();
            const institution = item.querySelector('.edit-institution')?.value.trim();
            const year = item.querySelector('.edit-year')?.value.trim();
            if (degree && institution && year) {
                education.push({ degree, institution, year });
            }
        });

        sessionStorage.setItem('candidateEducation', JSON.stringify(education));
        displayCandidateDetails();
        toggleEdit('education');
        showNotification('Education details updated successfully!');
    } else if (section === 'certificate') {
        const editItems = document.querySelectorAll('.certificate-edit-item');
        const certificates = [];
        editItems.forEach(item => {
            const title = item.querySelector('.edit-cert-title')?.value.trim();
            const description = item.querySelector('.edit-cert-desc')?.value.trim();
            const image = item.querySelector('.edit-cert-image')?.value.trim() || 'default-cert.png';
            if (title && description) {
                certificates.push({ title, description, image });
            }
        });

        sessionStorage.setItem('candidateCertificates', JSON.stringify(certificates));
        displayCertificateSection();
        toggleEdit('certificate');
        showNotification('Certificates updated successfully!');
    } else if (section === 'resume') {
        const resumeUpload = document.getElementById('resume-upload');
        if (resumeUpload && resumeUpload.files[0]) {
            const file = resumeUpload.files[0];
            if (file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = function(e) {
                    sessionStorage.setItem('candidateResume', e.target.result);
                    displayCandidateDetails();
                    toggleEdit('resume');
                    showNotification('Resume updated successfully!');
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Please upload a PDF file.', true);
            }
        } else {
            toggleEdit('resume');
        }
    }
}

function displayCertificateSection() {
    const certificateList = document.getElementById('certificate-list');
    if (!certificateList) return;

    let certificates = sessionStorage.getItem('candidateCertificates');
    certificates = certificates ? JSON.parse(certificates) : [];

    certificateList.innerHTML = '';
    if (certificates.length === 0) {
        certificateList.innerHTML = '<p class="no-certificates">No certificates earned yet.</p>';
    } else {
        certificates.forEach(cert => {
            const certCard = document.createElement('div');
            certCard.className = 'course-card';
            certCard.innerHTML = `
                <img src="${cert.image || 'default-cert.png'}" alt="${cert.title}" class="course-img">
                <h3>${cert.title} Certificate</h3>
                <p>${cert.description}</p>
            `;
            certificateList.appendChild(certCard);
        });
    }
}

function updateProfileVisibility() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const authLink = document.getElementById('auth-link');
    const profileLink = document.getElementById('profile-link');

    if (authLink) authLink.style.display = isLoggedIn ? 'none' : 'block';
    if (profileLink) {
        if (isLoggedIn) {
            const username = sessionStorage.getItem('username') || 'User';
            profileLink.querySelector('.username').innerHTML = `<span class="profile-icon">👤</span> ${username}`;
            profileLink.style.display = 'block';
        } else {
            profileLink.style.display = 'none';
        }
    }
}