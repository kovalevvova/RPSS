// Валидация email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Валидация телефона
function validatePhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

// Валидация формы
function validateForm() {
    let isValid = true;

    // Валидация имени
    const name = document.getElementById('name').value.trim();
    const nameError = document.getElementById('name-error');
    if (name === '') {
        document.getElementById('name').classList.add('error');
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
        emailError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('email').classList.remove('error');
        emailError.style.display = 'none';
    }

    // Валидация типа объекта
    const objectType = document.getElementById('object_type').value;
    const objectTypeError = document.getElementById('object_type-error');
    if (objectType === '') {
        document.getElementById('object_type').classList.add('error');
        objectTypeError.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('object_type').classList.remove('error');
        objectTypeError.style.display = 'none';
    }

    return isValid;
}

// Плавная прокрутка
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

// Основной код
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация плавной прокрутки
    initSmoothScroll();

    // Валидация в реальном времени
    document.getElementById('name').addEventListener('blur', validateForm);
    document.getElementById('phone').addEventListener('blur', validateForm);
    document.getElementById('email').addEventListener('blur', validateForm);
    document.getElementById('object_type').addEventListener('change', validateForm);

    // Обработка отправки формы
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Форма отправлена');

        if (!validateForm()) {
            document.getElementById('form-message').textContent = 'Пожалуйста, исправьте ошибки в форме.';
            document.getElementById('form-message').className = 'form-message error';
            document.getElementById('form-message').style.display = 'block';
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        const messageDiv = document.getElementById('form-message');

        // Показываем сообщение о отправке
        messageDiv.textContent = 'Отправка заявки...';
        messageDiv.className = 'form-message';
        messageDiv.style.display = 'block';

        // Собираем данные формы
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            object_type: formData.get('object_type'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };

        console.log('Отправляемые данные:', data);

        // Отправляем данные на сервер
        fetch('send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Ответ сервера:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            console.log('Результат:', result);
            if (result.success) {
                messageDiv.textContent = 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
                messageDiv.className = 'form-message success';
                form.reset();
            } else {
                messageDiv.textContent = 'Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.';
                messageDiv.className = 'form-message error';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageDiv.textContent = 'Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или позвоните нам.';
            messageDiv.className = 'form-message error';
        });
    });
});