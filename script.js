 function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        // Валидация телефона
        function validatePhone(phone) {
            // Убираем все нецифровые символы, кроме +
            const cleaned = phone.replace(/[^\d+]/g, '');
            // Проверяем, что номер содержит от 10 до 15 цифр
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

        // Защита от спама - таймер для активации кнопки отправки
        document.addEventListener('DOMContentLoaded', function() {
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

            // Обработка отправки формы
            document.getElementById('contact-form').addEventListener('submit', function(e) {
                e.preventDefault();

                if (!validateForm()) {
                    document.getElementById('form-message').textContent = 'Пожалуйста, исправьте ошибки в форме.';
                    document.getElementById('form-message').className = 'form-message error';
                    document.getElementById('form-message').style.display = 'block';
                    return;
                }

                const form = e.target;
                const formData = new FormData(form);
                const messageDiv = document.getElementById('form-message');

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
                    timestamp: new Date().toISOString()
                };

                // Отправляем данные на сервер
                fetch('send_email.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        messageDiv.textContent = 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
                        messageDiv.className = 'form-message success';
                        form.reset();

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
                });
            });

            // Сохраняем время начала заполнения формы
            sessionStorage.setItem('formStartTime', Date.now());
        });