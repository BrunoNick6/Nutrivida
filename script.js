// ========== CONFIGURACIÓN DEL FORMULARIO ==========
document.addEventListener('DOMContentLoaded', function() {
    
    // Formulario de contacto
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Recoger datos del formulario
            const formData = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                producto: document.getElementById('producto').value,
                cantidad: document.getElementById('cantidad').value,
                mensaje: document.getElementById('mensaje').value
            };
            
            // Validación básica
            if (!formData.nombre || !formData.email || !formData.telefono) {
                mostrarAlerta('Por favor, completa todos los campos obligatorios.', 'error');
                return;
            }
            
            // Validar email
            if (!validarEmail(formData.email)) {
                mostrarAlerta('Por favor, ingresa un email válido.', 'error');
                return;
            }
            
            // Llamar a la función de envío
            enviarFormulario(formData);
        });
    }
});

// ========== FUNCIONES DE VALIDACIÓN ==========
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function mostrarAlerta(mensaje, tipo, autoRemover = true) {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    alerta.textContent = mensaje;
    
    // Agregar ID único para poder identificar la alerta de "enviando"
    if (mensaje.includes('Enviando')) {
        alerta.id = 'alerta-enviando';
    }
    
    // Estilos de la alerta
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        ${tipo === 'success' ? 'background: #4CAF50;' : 'background: #f44336;'}
    `;
    
    // Agregar al DOM
    document.body.appendChild(alerta);
    
    // Mostrar con animación
    setTimeout(() => alerta.style.opacity = '1', 100);
    
    // Remover después de 5 segundos solo si autoRemover es true
    if (autoRemover) {
        setTimeout(() => {
            alerta.style.opacity = '0';
            setTimeout(() => alerta.remove(), 300);
        }, 5000);
    }
    
    // Retornar la alerta para poder manipularla después
    return alerta;
}

// Función para remover una alerta específica
function removerAlerta(alerta) {
    if (alerta && alerta.parentNode) {
        alerta.style.opacity = '0';
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 300);
    }
}

// ========== FUNCIÓN CORREGIDA PARA ENVÍO DE FORMULARIO ==========
function enviarFormulario(datos) {
    // Mostrar mensaje de "enviando" y guardarlo para poder removerlo después
    const alertaEnviando = mostrarAlerta('Enviando mensaje...', 'success', false); // false = no se remueve automáticamente
    
    // Deshabilitar el botón de envío para evitar múltiples envíos
    const submitButton = document.querySelector('#contactForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
    }
    
    // Crear mensaje completo con todos los datos
    const mensajeCompleto = `
Datos del contacto:
- Nombre: ${datos.nombre}
- Email: ${datos.email}
- Teléfono: ${datos.telefono}
- Producto de interés: ${datos.producto || 'No especificado'}
- Cantidad: ${datos.cantidad || 'No especificada'}

Mensaje:
${datos.mensaje || 'Sin mensaje adicional'}
    `.trim();
    
    // Crear FormData para Formspree
    const formData = new FormData();
    formData.append('name', datos.nombre);
    formData.append('email', datos.email);
    formData.append('message', mensajeCompleto);
    
    // Enviar a Formspree con manejo de errores mejorado
    fetch('https://formspree.io/f/mnnvvagq', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Verificar si la respuesta es exitosa
        if (response.ok) {
            return response.json().catch(() => ({ success: true }));
        } else {
            // Si hay error, intentar obtener detalles
            return response.json().then(errorData => {
                throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
            }).catch(() => {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            });
        }
    })
    .then(data => {
        console.log('Success response:', data);
        
        // REMOVER el mensaje de "enviando"
        removerAlerta(alertaEnviando);
        
        // Mostrar mensaje de éxito
        mostrarAlerta('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
        
        // Limpiar formulario
        document.getElementById('contactForm').reset();
        
        // Trackear evento exitoso
        trackEvent('Form', 'Submit_Success', 'Contact Form');
    })
    .catch(error => {
        console.error('Error completo:', error);
        
        // REMOVER el mensaje de "enviando"
        removerAlerta(alertaEnviando);
        
        // Mostrar error específico
        let mensajeError = 'Error al enviar el mensaje. ';
        
        if (error.message.includes('Failed to fetch')) {
            mensajeError += 'Verifica tu conexión a internet.';
        } else if (error.message.includes('404')) {
            mensajeError += 'El servicio de formularios no está disponible.';
        } else if (error.message.includes('403')) {
            mensajeError += 'No tienes permisos para enviar este formulario.';
        } else {
            mensajeError += 'Inténtalo de nuevo en unos momentos.';
        }
        
        mostrarAlerta(mensajeError, 'error');
        
        // Trackear evento de error
        trackEvent('Form', 'Submit_Error', error.message);
    })
    .finally(() => {
        // Rehabilitar el botón de envío
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Mensaje';
        }
    });
}

// ========== NAVEGACIÓN SUAVE ==========
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

// ========== EFECTOS DE SCROLL ==========
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    // Efecto parallax en hero
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
    
    // Cambiar header en scroll
    const header = document.querySelector('header');
    if (header) {
        if (scrolled > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        }
    }
});

// ========== ANIMACIONES DE ENTRADA ==========
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar tarjetas de productos
document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// ========== CONFIGURACIÓN DE CONTACTO ==========
const CONTACTO = {
    whatsapp: '+595 971 173 710',
    email: 'brunolr2003@gmail.com',
    ubicacion: 'Asunción, Paraguay'
};

// Función para actualizar info de contacto automáticamente
function actualizarContacto() {
    // Actualizar todos los elementos con clase 'whatsapp-numero'
    document.querySelectorAll('.whatsapp-numero').forEach(el => {
        el.textContent = CONTACTO.whatsapp;
    });
    
    // Actualizar todos los elementos con clase 'email-contacto'
    document.querySelectorAll('.email-contacto').forEach(el => {
        el.textContent = CONTACTO.email;
    });
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', actualizarContacto);

// ========== ANALYTICS Y TRACKING ==========
function trackEvent(category, action, label) {
    console.log(`Event tracked: ${category} - ${action} - ${label}`);
    
    // Si tienes Google Analytics configurado, descomenta esta línea:
    // gtag('event', action, { event_category: category, event_label: label });
}

// Trackear clicks en productos
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function() {
        const productName = this.querySelector('h3')?.textContent || 'Unknown Product';
        trackEvent('Product', 'Click', productName);
    });
});

// ========== FUNCIÓN DE DIAGNÓSTICO ==========
function diagnosticarFormulario() {
    console.log('=== DIAGNÓSTICO DEL FORMULARIO ===');
    
    // Verificar que existe el formulario
    const form = document.getElementById('contactForm');
    console.log('Formulario encontrado:', !!form);
    
    if (form) {
        // Verificar campos requeridos
        const campos = ['nombre', 'email', 'telefono'];
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            console.log(`Campo ${campo}:`, !!elemento);
            if (elemento) {
                console.log(`  - Valor: "${elemento.value}"`);
                console.log(`  - Tipo: ${elemento.type}`);
            }
        });
    }
    
    // Verificar conectividad básica
    fetch('https://httpbin.org/get')
        .then(() => console.log('Conectividad: OK'))
        .catch(() => console.log('Conectividad: ERROR'));
        
    console.log('=== FIN DIAGNÓSTICO ===');
}

// Ejecutar diagnóstico automáticamente en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(diagnosticarFormulario, 2000);
}