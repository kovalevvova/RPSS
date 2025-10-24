// Preloader with enhanced functionality
function initPreloader() {
    const preloader = document.querySelector('.preloader');

    // If no preloader exists, return
    if (!preloader) {
        console.log('Preloader element not found');
        return;
    }

    // Function to hide preloader
    function hidePreloader() {
        console.log('Hiding preloader...');
        preloader.classList.add('fade-out');

        // Remove preloader from DOM after animation
        setTimeout(() => {
            preloader.style.display = 'none';
            console.log('Preloader hidden');
        }, 500);
    }

    // Check if page is already loaded
    if (document.readyState === 'complete') {
        console.log('Page already loaded, hiding preloader immediately');
        hidePreloader();
        return;
    }

    // Main loading event
    window.addEventListener('load', function() {
        console.log('Window load event fired');

        // Add slight delay for better UX
        setTimeout(() => {
            hidePreloader();
        }, 1000); // 1 second delay for smooth transition
    });

    // Fallback: hide preloader after maximum time (5 seconds)
    const fallbackTimeout = setTimeout(() => {
        console.log('Fallback: Hiding preloader after timeout');
        hidePreloader();
    }, 5000);

    // Clear fallback if page loads normally
    window.addEventListener('load', () => {
        clearTimeout(fallbackTimeout);
    });
}

// Mobile Menu Function
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');

            // Animate hamburger icon
            const spans = this.querySelectorAll('span');
            if (this.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// Dynamic spacing calculation for fixed header
function initProperSpacing() {
    const header = document.querySelector('.header');
    const nav = document.querySelector('.nav');

    if (!header || !nav) return;

    function updateBodyPadding() {
        const headerHeight = header.offsetHeight;
        const navHeight = nav.offsetHeight;
        const totalHeight = headerHeight + navHeight;

        document.body.style.paddingTop = totalHeight + 'px';

        // Update contact form sticky position
        const contactFormCard = document.querySelector('.contact-form-card');
        if (contactFormCard) {
            contactFormCard.style.top = (totalHeight + 20) + 'px';
        }

        console.log('Updated body padding:', totalHeight + 'px');
    }

    // Initial calculation
    updateBodyPadding();

    // Update on resize
    window.addEventListener('resize', updateBodyPadding);
}

// Smooth Scroll Function with proper offset
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const header = document.querySelector('.header');
                const nav = document.querySelector('.nav');
                const headerHeight = header ? header.offsetHeight : 0;
                const navHeight = nav ? nav.offsetHeight : 0;
                const offset = headerHeight + navHeight + 20; // +20px extra space

                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');

                    // Reset hamburger icon
                    const spans = mobileMenuBtn.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    });
}

// Scroll Effects
function initScrollEffects() {
    const header = document.querySelector('.header');
    const scrollToTopBtn = document.querySelector('.scroll-to-top');

    // Header scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Scroll to top button
        if (scrollToTopBtn) {
            if (window.scrollY > 500) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
    });
}

// Scroll to Top Function
function initScrollToTop() {
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

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

// Form handling
function initForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    // Initialize floating labels
    initFloatingLabels();

    // Add event listeners
    contactForm.addEventListener('submit', handleFormSubmit);

    // Real-time validation
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', function() {
            clearError(this);
            // Update floating label
            updateFloatingLabel(this);
        });
    });
}

function initFloatingLabels() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        if (input) {
            updateFloatingLabel(input);
        }
    });
}

function updateFloatingLabel(input) {
    const label = input.parentElement.querySelector('label');
    if (input.value || input === document.activeElement) {
        label.style.top = '-10px';
        label.style.fontSize = '0.8rem';
        label.style.color = 'var(--primary)';
        label.style.fontWeight = '500';
    } else {
        label.style.top = '15px';
        label.style.fontSize = '1rem';
        label.style.color = 'var(--text-light)';
        label.style.fontWeight = 'normal';
    }
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const errorElement = document.getElementById(field.id + '-error');

    let isValid = true;
    let errorMessage = '';

    switch(field.type) {
        case 'text':
            if (field.id === 'name') {
                if (value === '') {
                    isValid = false;
                    errorMessage = 'Пожалуйста, введите ваше имя';
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Имя должно содержать минимум 2 символа';
                }
            }
            break;

        case 'tel':
            if (value === '') {
                isValid = false;
                errorMessage = 'Пожалуйста, введите номер телефона';
            } else if (!validatePhone(value)) {
                isValid = false;
                errorMessage = 'Пожалуйста, введите корректный номер телефона';
            }
            break;

        case 'email':
            if (value !== '' && !validateEmail(value)) {
                isValid = false;
                errorMessage = 'Пожалуйста, введите корректный email';
            }
            break;
    }

    if (field.tagName === 'SELECT' && field.required) {
        if (!field.value) {
            isValid = false;
            errorMessage = 'Пожалуйста, выберите тип объекта';
        }
    }

    if (!isValid) {
        showError(field, errorElement, errorMessage);
    } else {
        clearError(field, errorElement);
    }
}

function showError(field, errorElement, message) {
    field.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(field, errorElement) {
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
        if (field.required || field.value.trim() !== '') {
            const event = new Event('blur');
            field.dispatchEvent(event);
            if (field.classList.contains('error')) {
                isValid = false;
            }
        }
    });

    if (!isValid) {
        showFormMessage('Пожалуйста, исправьте ошибки в форме', 'error');

        // Scroll to first error
        const firstError = e.target.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Show loading state
    submitBtn.classList.add('loading');
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
            showFormMessage('✅ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
            e.target.reset();
            initFloatingLabels(); // Reset labels
        } else {
            showFormMessage('❌ Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showFormMessage('❌ Ошибка сети. Пожалуйста, проверьте подключение и попробуйте еще раз.', 'error');
    } finally {
        // Restore button state
        submitBtn.classList.remove('loading');
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

// Scroll animations
function initScrollAnimations() {
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
}

// Add fade-in class to elements for scroll animations
function initFadeInElements() {
    const elementsToAnimate = document.querySelectorAll('.service-card, .advantage-card, .process-step, .section-header');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in');
    });
}

// Enhanced DOM ready function
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // Initialize all components
    initPreloader();
    initProperSpacing(); // Dynamic spacing for fixed header
    initMobileMenu();
    initSmoothScroll();
    initScrollEffects();
    initScrollToTop();
    initForm();
    initScrollAnimations();
    initFadeInElements();
});

// Add CSS for mobile menu animation
const mobileMenuStyles = `
    .mobile-menu-btn span {
        transition: all 0.3s ease;
    }
`;

// Inject mobile menu styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileMenuStyles;
document.head.appendChild(styleSheet);