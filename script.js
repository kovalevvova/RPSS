// Генерация CSRF токена
function generateCSRFToken() {
    return 'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Валидация email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Улучшенная валидация телефона
function validatePhone(phone) {
    // Убираем все нецифровые символы, кроме +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Проверяем российские форматы: +7, 8, и международные
    const phoneRegex = /^(\+7|8|7)?[\d\- ()]{10,15}$/;
    const digits = cleaned.replace(/\D/g, '');
    return phoneRegex.test(phone) && digits.length >= 10 && digits.length <= 15;
}

// Валидация формы
function validateForm() {
    let isValid = true;

    // Валидация имени
    const name = document.getElementById('name').value.trim();
    const nameError = document.getElementById('name-error');
    if (name === '' || name.length < 2) {
        document.getElementById('name').classList.add('error');
        nameError.textContent = 'Пожалуйста, введите ваше имя (минимум 2 символа)';
        nameError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('name').classList.remove('error');
        nameError.style.display = 'none';
    }

    // Валидация телефона
    const phone = document.getElementById('phone').value.trim();
    const phoneError = document.getElementById('phone-error');
    if (phone === '' || !validatePhone(phone)) {
        document.getElementById('phone').classList.add('error');
        phoneError.textContent = 'Пожалуйста, введите корректный номер телефона (например: +7 XXX XXX XX XX)';
        phoneError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('phone').classList.remove('error');
        phoneError.style.display = 'none';
    }

    // Валидация email (если указан)
    const email = document.getElementById('email').value.trim();
    const emailError = document.getElementById('email-error');
    if (email !== '' && !validateEmail(email)) {
        document.getElementById('email').classList.add('error');
        emailError.textContent = 'Пожалуйста, введите корректный email';
        emailError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('email').classList.remove('error');
        emailError.style.display = 'none';
    }

    // Валидация типа объекта
    const securityQuestion = document.getElementById('security_question').value;
    const securityQuestionError = document.getElementById('security_question-error');
    if (securityQuestion === '') {
        document.getElementById('security_question').classList.add('error');
        securityQuestionError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('security_question').classList.remove('error');
        securityQuestionError.style.display = 'none';
    }

    return isValid;
}

// Плавная прокрутка для якорных ссылок
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Защита от спама - таймер для активации кнопки отправки
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация плавной прокрутки
    initSmoothScroll();

    // Генерация CSRF токена
    const csrfToken = generateCSRFToken();
    document.getElementById('csrf_token').value = csrfToken;
    sessionStorage.setItem('csrf_token', csrfToken);

    const submitBtn = document.getElementById('submit-btn');
    const timerInfo = document.getElementById('timer-info');
    let seconds = 3;

    // Отображаем таймер
    timerInfo.textContent = `Для защиты от спама форма станет активной через ${seconds} секунд`;

    // Запускаем таймер
    const timer = setInterval(function() {
        seconds--;
        timerInfo.textContent = `Для защиты от спама форма станет активной через ${seconds} секунд`;

        if (seconds <= 0) {
            clearInterval(timer);
            submitBtn.disabled = false;
            timerInfo.textContent = 'Форма активна. Вы можете отправить заявку.';
            timerInfo.style.color = '#4CAF50';
            setTimeout(function() {
                timerInfo.textContent = '';
            }, 3000);
        }
    }, 1000);

    // Валидация в реальном времени
    document.getElementById('name').addEventListener('blur', validateForm);
    document.getElementById('phone').addEventListener('blur', validateForm);
    document.getElementById('email').addEventListener('blur', validateForm);
    document.getElementById('security_question').addEventListener('change', validateForm);

    // Быстрая валидация при вводе
    document.getElementById('phone').addEventListener('input', function(e) {
        // Автоматическое форматирование телефона
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('7') || value.startsWith('8')) {
            value = value.substr(1);
        }
        if (value.length > 0) {
            e.target.value = '+7 ' + value.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        }
    });

    // Обработка отправки формы
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validateForm()) {
            document.getElementById('form-message').textContent = 'Пожалуйста, исправьте ошибки в форме.';
            document.getElementById('form-message').className = 'form-message error';
            document.getElementById('form-message').style.display = 'block';

            // Прокрутка к первой ошибке
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        const messageDiv = document.getElementById('form-message');

        // Проверка CSRF токена
        const storedToken = sessionStorage.getItem('csrf_token');
        const formToken = formData.get('csrf_token');
        if (storedToken !== formToken) {
            messageDiv.textContent = 'Ошибка безопасности. Пожалуйста, обновите страницу и попробуйте снова.';
            messageDiv.className = 'form-message error';
            messageDiv.style.display = 'block';
            return;
        }

        // Проверка honeypot полей
        if (formData.get('company') !== '' ||
            formData.get('email_confirm') !== '' ||
            formData.get('agree_terms') === '1') {
            messageDiv.textContent = 'Обнаружена подозрительная активность. Пожалуйста, свяжитесь с нами по телефону.';
            messageDiv.className = 'form-message error';
            messageDiv.style.display = 'block';
            return;
        }

        // Проверка времени заполнения формы (минимум 3 секунды)
        const formStartTime = parseInt(sessionStorage.getItem('formStartTime') || Date.now());
        const currentTime = Date.now();
        const timeSpent = (currentTime - formStartTime) / 1000;

        if (timeSpent < 3) {
            messageDiv.textContent = 'Форма заполнена слишком быстро. Пожалуйста, заполните все поля внимательно.';
            messageDiv.className = 'form-message error';
            messageDiv.style.display = 'block';
            return;
        }

        // Показываем сообщение о отправке
        messageDiv.textContent = 'Отправка заявки...';
        messageDiv.className = 'form-message';
        messageDiv.style.display = 'block';

        // Собираем данные формы
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            security_question: formData.get('security_question'),
            message: formData.get('message'),
            csrf_token: formData.get('csrf_token'),
            timestamp: new Date().toISOString()
        };

        // Отправляем данные на сервер
        fetch('send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                messageDiv.textContent = 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
                messageDiv.className = 'form-message success';
                form.reset();

                // Обновляем CSRF токен
                const newToken = generateCSRFToken();
                document.getElementById('csrf_token').value = newToken;
                sessionStorage.setItem('csrf_token', newToken);

                // Блокируем форму на 30 секунд после успешной отправки
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 30000);
            } else {
                messageDiv.textContent = 'Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.';
                messageDiv.className = 'form-message error';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageDiv.textContent = 'Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.';
            messageDiv.className = 'form-message error';
        })
        .finally(() => {
            // Прокрутка к сообщению
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Сохраняем время начала заполнения формы
    sessionStorage.setItem('formStartTime', Date.now());

    // Улучшение доступности для навигации с клавиатуры
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
});

// Добавляем стили для навигации с клавиатуры
const style = document.createElement('style');
style.textContent = `
    .keyboard-navigation *:focus {
        outline: 2px solid #ff9800 !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(style);