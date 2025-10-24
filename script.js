// Preloader
window.addEventListener('load', function() {
    const preloader = document.querySelector('.preloader');
    setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1000);
});

// Mobile Menu
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                }
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Scroll to top button
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Form validation and submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Real-time validation
        const inputs = contactForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearError);
        });

        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});

// Form validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const errorElement = document.getElementById(field.id + '-error');

    switch(field.type) {
        case 'text':
            if (field.id === 'name') {
                if (value === '') {
                    showError(field, errorElement, 'Пожалуйста, введите ваше имя');
                } else {
                    clearError(field, errorElement);
                }
            }
            break;

        case 'tel':
            if (value === '' || !validatePhone(value)) {
                showError(field, errorElement, 'Пожалуйста, введите корректный номер телефона');
            } else {
                clearError(field, errorElement);
            }
            break;

        case 'email':
            if (value !== '' && !validateEmail(value)) {
                showError(field, errorElement, 'Пожалуйста, введите корректный email');
            } else {
                clearError(field, errorElement);
            }
            break;
    }

    if (field.tagName === 'SELECT' && field.required) {
        if (value === '') {
            showError(field, errorElement, 'Пожалуйста, выберите тип объекта');
        } else {
            clearError(field, errorElement);
        }
    }
}

function showError(field, errorElement, message) {
    field.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(e) {
    const field = e.target;
    const errorElement = document.getElementById(field.id + '-error');
    field.classList.remove('error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const fields = e.target.querySelectorAll('input, select, textarea');
    let isValid = true;

    fields.forEach(field => {
        if (field.required) {
            const event = new Event('blur');
            field.dispatchEvent(event);
            if (field.classList.contains('error')) {
                isValid = false;
            }
        }
    });

    if (!isValid) {
        showFormMessage('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;

    // Collect data
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        object_type: formData.get('object_type'),
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch('send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showFormMessage('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
            e.target.reset();
        } else {
            showFormMessage('Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showFormMessage('Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto hide success message after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Add fade-in class to elements for scroll animations
document.addEventListener('DOMContentLoaded', function() {
    const elementsToAnimate = document.querySelectorAll('.service-card, .advantage-card, .process-step, .section-header');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in');
    });
});