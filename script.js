// Simple Canvas particle network
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Simple Particle class
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.3;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw(theme = 'dark') {
        // Get particle color based on theme
        const particleColor = theme === 'light' 
            ? `rgba(0, 128, 255, ${this.opacity})` 
            : `rgba(0, 255, 255, ${this.opacity})`;
        const shadowColor = theme === 'light'
            ? 'rgba(0, 128, 255, 0.5)'
            : 'rgba(0, 255, 255, 0.5)';
        
        ctx.fillStyle = particleColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = shadowColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create particles - reduce count on mobile for better performance
const particleCount = window.innerWidth < 768 ? 50 : 80;
const particles = [];
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Connection lines between particles
function connectParticles(theme = 'dark') {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                const opacity = 0.2 - distance / 600;
                const strokeColor = theme === 'light'
                    ? `rgba(0, 128, 255, ${opacity})`
                    : `rgba(0, 255, 255, ${opacity})`;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Get current theme
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTheme = getCurrentTheme();
    
    particles.forEach(particle => {
        particle.update();
        particle.draw(currentTheme);
    });
    
    connectParticles(currentTheme);
    requestAnimationFrame(animate);
}

animate();

// Resize canvas on window resize with debounce
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const newWidth = Math.min(window.innerWidth, window.screen.width);
        const newHeight = Math.min(window.innerHeight, window.screen.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        // Reinitialize particles on resize to prevent gaps
        particles.forEach(particle => {
            if (particle.x > canvas.width) particle.x = canvas.width;
            if (particle.y > canvas.height) particle.y = canvas.height;
            if (particle.x < 0) particle.x = 0;
            if (particle.y < 0) particle.y = 0;
        });
    }, 150);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 300);
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

function initTheme() {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    htmlElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Announce theme change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${newTheme} mode`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
}

function updateThemeIcon(theme) {
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    if (themeIcon) {
        // Remove any text content - CSS ::before handles the icon
        themeIcon.textContent = '';
        themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
        themeToggle.setAttribute('title', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
    }
}

// Initialize theme on page load
initTheme();

// Theme toggle button event
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    
    // Keyboard support for theme toggle
    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set a preference
    if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
    }
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', !isActive);
        
        // Prevent body scroll when menu is open
        if (!isActive) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('menu-open');
            // Prevent scroll on iOS
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
            document.body.style.position = '';
            document.body.style.width = '';
        }
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
            document.body.style.position = '';
            document.body.style.width = '';
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
            document.body.style.position = '';
            document.body.style.width = '';
        }
    });
    
    // Close mobile menu with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
            document.body.style.position = '';
            document.body.style.width = '';
            menuToggle.focus();
        }
    });

    // Close mobile menu on window resize (if resizing to desktop)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                document.body.classList.remove('menu-open');
            }
        }, 250);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Animated counter for stats
const animateCounter = (element) => {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (element.parentElement.querySelector('.stat-label').textContent.includes('%') ? '%' : '+');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + (element.parentElement.querySelector('.stat-label').textContent.includes('%') ? '%' : '+');
        }
    }, 16);
};

// Intersection Observer for stats animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => animateCounter(stat));
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Initialize EmailJS
(function() {
    emailjs.init("cGyvwe86q9ZyOwIWM");
})();

// Form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('.submit-button');
    const originalButtonText = submitButton.textContent;
    
    // Get form elements
    const formElements = form.elements;
    const formData = {
        user_name: formElements[0].value.trim(),
        user_email: formElements[1].value.trim(),
        service_interest: formElements[2].value,
        subject: formElements[3].value.trim() || 'No subject',
        message: formElements[4].value.trim()
    };
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        // Send two emails: auto-reply to user and notification to business
        await Promise.all([
            // Auto-reply email to user
            emailjs.send(
                'service_cdpcuhp',
                'template_5vn3ez1',
                {
                    to_email: formData.user_email,
                    to_name: formData.user_name,
                    from_name: 'AuraLogic Ltd',
                    service_interest: formData.service_interest,
                    subject: formData.subject,
                    message: formData.message,
                    reply_to: formData.user_email
                }
            ),
            // Notification email to business with user's message
            emailjs.send(
                'service_cdpcuhp',
                'template_sqvvjoh',
                {
                    to_email: 'AuraLogic.Ltd@outlook.com',
                    to_name: 'AuraLogic Team',
                    from_name: formData.user_name,
                    user_email: formData.user_email,
                    service_interest: formData.service_interest,
                    subject: `New Contact Form Submission: ${formData.subject}`,
                    message: `You have received a new message from the contact form:\n\nFrom: ${formData.user_name} (${formData.user_email})\nService Interest: ${formData.service_interest}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`,
                    reply_to: formData.user_email
                }
            )
        ]);
        
        // Success message
        alert('Thank you for your message! We will get back to you soon. An automatic confirmation email has been sent to your inbox.');
        form.reset();
    } catch (error) {
        console.error('EmailJS Error:', error);
        alert('Sorry, there was an error sending your message. Please try again or contact us directly at AuraLogic.Ltd@outlook.com');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});

// Early Access Form submission
const earlyAccessForm = document.getElementById('earlyAccessForm');
if (earlyAccessForm) {
    earlyAccessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const appInterest = earlyAccessForm.querySelector('select').value;
        let appName = 'our products';
        if (appInterest === 'tripmate') {
            appName = 'TripMate';
        } else if (appInterest === 'buddyup') {
            appName = 'BuddyUp';
        } else if (appInterest === 'dressera-ai') {
            appName = 'Dressera AI';
        } else if (appInterest === 'aura-ai') {
            appName = 'Aura AI';
        } else if (appInterest === 'all') {
            appName = 'all our products';
        }
        alert(`Thank you for joining our early access program! We'll notify you when ${appName} is ready for beta testing.`);
        earlyAccessForm.reset();
    });
}


// FAQ Accordion functionality with keyboard support
document.querySelectorAll('.faq-question').forEach((question, index) => {
    const faqItem = question.parentElement;
    const answerId = question.getAttribute('aria-controls');
    const answer = document.getElementById(answerId);
    
    function toggleFAQ() {
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
                const otherQuestion = item.querySelector('.faq-question');
                const otherAnswerId = otherQuestion?.getAttribute('aria-controls');
                const otherAnswer = otherAnswerId ? document.getElementById(otherAnswerId) : null;
                if (otherQuestion) {
                    otherQuestion.setAttribute('aria-expanded', 'false');
                }
                if (otherAnswer) {
                    otherAnswer.setAttribute('aria-hidden', 'true');
                }
            }
        });
        
        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
            if (answer) {
                answer.setAttribute('aria-hidden', 'false');
            }
        } else {
            faqItem.classList.remove('active');
            question.setAttribute('aria-expanded', 'false');
            if (answer) {
                answer.setAttribute('aria-hidden', 'true');
            }
        }
    }
    
    // Click handler
    question.addEventListener('click', toggleFAQ);
    
    // Keyboard handler
    question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFAQ();
        }
    });
    
    // Initialize ARIA attributes
    if (answer) {
        answer.setAttribute('aria-hidden', 'true');
    }
});

// Floating CTA visibility on scroll
const floatingCta = document.getElementById('floatingCta');
if (floatingCta) {
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const isScrollingDown = scrollTop > lastScrollTop;
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Show floating CTA after scrolling down 300px
        if (scrollPosition > 300) {
            floatingCta.style.opacity = '1';
            floatingCta.style.transform = 'translateY(0)';
        } else {
            floatingCta.style.opacity = '0';
            floatingCta.style.transform = 'translateY(20px)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
    
    // Initially hide floating CTA
    floatingCta.style.opacity = '0';
    floatingCta.style.transform = 'translateY(20px)';
    floatingCta.style.transition = 'all 0.3s ease';
}

// Smooth scroll for all anchor links
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

// Live Chat Widget Functionality
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

chatButton.addEventListener('click', async () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
        // Reset position styles before adjustment
        chatWindow.style.top = '';
        chatWindow.style.bottom = '';
        chatWindow.style.right = '';
        chatWindow.style.left = '';
        chatWindow.style.transform = '';
        
        // Server status check removed - application is deployed on Vercel
        
        // Ensure chat window is fully visible with proper delay
        setTimeout(() => {
            adjustChatWindowPosition();
            chatInput.focus();
        }, 50);
    }
});

// Function to adjust chat window position to ensure it's fully visible
function adjustChatWindowPosition() {
    if (!chatWindow.classList.contains('active')) return;
    
    const rect = chatWindow.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const minTopSpacing = 20; // Minimum space from top of viewport
    const buttonHeight = chatButton.offsetHeight || 60;
    const spacing = 20;
    const navHeight = 80; // Approximate navbar height to account for
    
    // Always check top position first to ensure header is visible
    const currentTop = rect.top;
    
    // If window is too close to or above the top, position it properly
    if (currentTop < minTopSpacing + navHeight) {
        chatWindow.style.top = `${minTopSpacing + navHeight}px`;
        chatWindow.style.bottom = 'auto';
        
        // Calculate available height and set max-height
        const availableHeight = viewportHeight - (minTopSpacing + navHeight) - spacing;
        chatWindow.style.maxHeight = `${Math.max(availableHeight, 400)}px`;
        chatWindow.style.height = 'auto';
    }
    
    // Check if window goes off-screen to the right
    if (rect.right > viewportWidth - spacing) {
        chatWindow.style.right = `${spacing}px`;
    }
    
    // Check if window goes off-screen to the bottom (only if not using top positioning)
    if (rect.bottom > viewportHeight - spacing && !chatWindow.style.top) {
        chatWindow.style.bottom = `${buttonHeight + spacing}px`;
        chatWindow.style.top = 'auto';
        const availableHeight = viewportHeight - buttonHeight - spacing - spacing;
        chatWindow.style.maxHeight = `${Math.max(availableHeight, 400)}px`;
    }
    
    // On mobile, center horizontally and ensure top spacing
    if (viewportWidth <= 768) {
        chatWindow.style.left = '50%';
        chatWindow.style.right = 'auto';
        
        // Ensure top spacing on mobile
        const mobileTop = minTopSpacing + (navHeight / 2);
        chatWindow.style.top = `${mobileTop}px`;
        chatWindow.style.bottom = 'auto';
        const availableHeight = viewportHeight - mobileTop - spacing;
        chatWindow.style.maxHeight = `${Math.max(availableHeight, 350)}px`;
        chatWindow.style.transform = 'translateX(-50%)';
    } else if (!chatWindow.style.top && viewportWidth > 768) {
        // On desktop, ensure it doesn't go above the top
        chatWindow.style.transform = '';
    }
}

// Adjust position on window resize
window.addEventListener('resize', () => {
    if (chatWindow.classList.contains('active')) {
        adjustChatWindowPosition();
    }
});

chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('active');
    chatButton.focus(); // Return focus to chat button
});

// Close chat window with ESC key
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWindow.classList.contains('active')) {
        chatWindow.classList.remove('active');
        chatButton.focus();
    }
});

// Keyboard navigation for chat send button
chatSend.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
        e.preventDefault();
        chatSend.click();
    }
});

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate a unique session ID for this user session
function getSessionId() {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
}

// API endpoint configuration
// Backend API is deployed on Vercel, frontend may be on different hosting (IONOS)
function getApiBaseUrl() {
    // Always use the Vercel backend URL since API functions are deployed there
    // Frontend can be hosted on IONOS or other static hosting
    const DEPLOYED_BACKEND_URL = 'https://aura-website-livid.vercel.app';
    
    // If running from file:// protocol (opened directly), use deployed backend
    if (window.location.protocol === 'file:') {
        return DEPLOYED_BACKEND_URL;
    }
    
    // Check if we're on Vercel (same origin has the API)
    // If not on Vercel (e.g., IONOS), use the Vercel backend URL
    if (window.location.hostname.includes('vercel.app')) {
        // On Vercel, use same origin
        return window.location.origin;
    }
    
    // For other hosting (IONOS, etc.), use Vercel backend
    return DEPLOYED_BACKEND_URL;
}

const API_BASE_URL = getApiBaseUrl();

// Check if server is running (Vercel deployment)
async function checkServerStatus() {
    try {
        const healthEndpoint = `${API_BASE_URL}/api/health`;
        const response = await fetch(healthEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server is running:', data);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('⚠️ Server health check failed:', error.message);
        return false;
    }
}

// Send message to backend API
async function sendMessageToAPI(message) {
    try {
        const sessionId = getSessionId();
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId,
            }),
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // If we get HTML instead of JSON, it means the API endpoint doesn't exist
            const text = await response.text();
            console.error('API returned non-JSON response:', text.substring(0, 200));
            throw new Error('Chat API endpoint not found. Please check the backend configuration.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response from server');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Chat API error:', error);
        // Re-throw with more context if it's a parsing error
        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
            throw new Error('Unable to connect to chat service. The API endpoint may not be configured correctly.');
        }
        throw error;
    }
}

// Legacy Knowledge Base - Kept for reference but not used
const knowledgeBase = {
    company: {
        name: "AuraLogic Ltd",
        overview: "AuraLogic Ltd is an emerging startup at the forefront of IT and AI solutions. We combine innovative thinking with practical implementation to create transformative digital experiences. As an early-stage company, we're focused on developing innovative products that solve real-world problems while providing custom IT and AI solutions for businesses seeking digital transformation.",
        vision: "At AuraLogic, we're developing innovative travel applications and AI solutions that address common challenges. We're building solutions for the future, inviting you to join us on this exciting journey of innovation and growth.",
        mission: "To revolutionize travel technology through our mobile applications TripMate and BuddyUp, while also providing custom IT and AI solutions for businesses seeking digital transformation.",
        location: "71-75 Shelton Street, Covent Garden, London, WC2H 9JQ",
        contact: {
            email: "AuraLogic.Ltd@outlook.com",
            phone: "+44 7775488275",
            hours: "Monday-Friday, 9 AM - 6 PM GMT"
        },
        stats: {
            products: 4,
            features: 15,
            betaUsers: 100,
            launchYear: 2025
        }
    },
    services: {
        "mobile app development": {
            name: "Mobile App Development",
            description: "Native and cross-platform mobile applications with cutting-edge AI integrations for iOS and Android, delivering intelligent user experiences.",
            details: "We specialize in creating native iOS (Swift) and Android (Kotlin) apps, as well as cross-platform solutions using React Native and Flutter. Our mobile apps feature AI integrations that provide intelligent, personalized user experiences.",
            keywords: ["mobile", "app", "ios", "android", "swift", "kotlin", "react native", "flutter", "smartphone", "application"]
        },
        "ai solutions": {
            name: "AI-Based Solutions",
            description: "Custom AI systems including machine learning models, natural language processing, computer vision, predictive analytics, and intelligent automation.",
            details: "Our AI solutions leverage cutting-edge technologies including TensorFlow, PyTorch, and OpenAI APIs. We build custom machine learning models, NLP systems, computer vision applications, and predictive analytics platforms tailored to your business needs. Our intelligent automation solutions help streamline operations and reduce manual work.",
            keywords: ["ai", "artificial intelligence", "machine learning", "ml", "neural network", "nlp", "natural language", "computer vision", "predictive", "automation", "tensorflow", "pytorch", "openai"]
        },
        "business software": {
            name: "Business Software Solutions",
            description: "Enterprise software including ERP, CRM, inventory management, and workflow automation tailored to streamline your business operations.",
            details: "We develop comprehensive business software solutions including Enterprise Resource Planning (ERP) systems, Customer Relationship Management (CRM) platforms, inventory management systems, and workflow automation tools. These solutions are tailored to streamline your business operations and improve efficiency.",
            keywords: ["business software", "erp", "crm", "enterprise", "inventory", "workflow", "management system", "business solution"]
        },
        "it services": {
            name: "Complete IT Services",
            description: "Full-spectrum IT support including infrastructure setup, network management, cloud services, data backup, disaster recovery, and 24/7 technical assistance.",
            details: "We provide comprehensive IT services including infrastructure setup and management, network administration, cloud services (AWS and Azure), data backup solutions, disaster recovery planning, and 24/7 technical support. Our team ensures your IT systems run smoothly and securely.",
            keywords: ["it services", "it support", "infrastructure", "network", "cloud", "aws", "azure", "backup", "disaster recovery", "technical support", "it help"]
        },
        "systems integration": {
            name: "Systems Integration",
            description: "Seamless integration of all your business systems - from legacy software to modern cloud platforms, ensuring smooth data flow and operations.",
            details: "We specialize in seamlessly integrating all your business systems, whether legacy software or modern cloud platforms. Our integration solutions ensure smooth data flow between systems, eliminating silos and improving operational efficiency across your organization.",
            keywords: ["integration", "systems integration", "api", "data flow", "legacy", "connect", "integrate"]
        },
        "web development": {
            name: "Web Development",
            description: "Modern, responsive web applications and websites built with cutting-edge technologies, ensuring optimal performance, user experience, and scalability for your business.",
            details: "Our web development services include creating modern, responsive websites and web applications using cutting-edge technologies like React, Node.js, and various frameworks. We ensure optimal performance, excellent user experience, and scalability to grow with your business needs.",
            keywords: ["web development", "web design", "website", "web app", "web application", "frontend", "backend", "react", "node.js", "responsive", "web"]
        }
    },
    products: {
        "tripmate": {
            name: "TripMate",
            description: "Your ultimate travel companion app designed to enhance every journey. Plan, navigate, and experience travel like never before with intelligent features and seamless user experience.",
            status: "COMING SOON",
            features: [
                "Smart trip planning and itinerary management",
                "Real-time navigation and location tracking",
                "Hotel and restaurant recommendations",
                "Budget tracking and expense management",
                "Easy-to-use interface for all travelers",
                "Cloud sync across all your devices"
            ],
            platforms: ["iOS (App Store)", "Android (Play Store)"],
            keywords: ["tripmate", "trip mate", "travel", "travel companion", "travel app", "trip planning", "itinerary", "navigation", "expense", "budget"]
        },
        "buddyup": {
            name: "BuddyUp",
            description: "Connect with fellow travelers heading to the same destination and share transportation costs. Split rides with Uber, Bolt, or other services to make travel more affordable and social.",
            status: "COMING SOON",
            features: [
                "Find travel companions heading to the same destination",
                "Split transportation costs (Uber, Bolt, and more)",
                "Smart route matching and optimization",
                "Verified profiles and safety features",
                "Secure payment integration and splitting",
                "In-app messaging for coordination"
            ],
            platforms: ["iOS (App Store)", "Android (Play Store)"],
            keywords: ["buddyup", "buddy up", "travel companion", "share ride", "uber", "bolt", "split cost", "travel share", "ride sharing"]
        },
        "aura ai": {
            name: "Aura AI",
            description: "A revolutionary meta-AI platform that empowers anyone to create custom AI agents using simple natural language. Describe what you need, and Aura AI builds it for you—no coding required.",
            subtitle: "AI That Builds AI Agents",
            status: "IN DEVELOPMENT",
            features: [
                "Natural-language interface for describing agents",
                "Automatic agent design and code generation",
                "Optional visual editor or sandbox environment",
                "Integration with APIs and external tools",
                "Potential marketplace for sharing or selling agents",
                "Instant testing and deployment of created agents"
            ],
            platforms: ["Web Platform"],
            technologies: ["LangChain", "CrewAI"],
            keywords: ["aura ai", "ai agent", "agent builder", "create ai", "no code", "ai platform", "langchain", "crewai", "meta ai"]
        },
        "dressera ai": {
            name: "Dressera AI",
            description: "A smart personal stylist that uses AI to help you dress better, plan outfits, match your skin tone, and make the most of your wardrobe.",
            status: "COMING SOON",
            features: [
                "Upload wardrobe photos; AI auto-detects clothing type, color, pattern, and organizes items",
                "Skin-tone & undertone analysis to suggest the best colors",
                "AI outfit generator for any occasion (work, date, formal, casual, travel, etc.)",
                "Weather-based suggestions and personalized style recommendations",
                "Virtual try-on using a photo or avatar (optional)",
                "Smart gap detection to recommend what new items to buy",
                "Personalized learning: tracks user preferences and frequently used outfits",
                "Sharing options, outfit-of-the-day, and notifications"
            ],
            platforms: ["iOS (App Store)", "Android (Play Store)"],
            technologies: ["Computer Vision", "LLM", "Recommendation System"],
            keywords: ["dressera ai", "dressera", "wardrobe", "stylist", "fashion", "outfit", "clothing", "style", "wardrobe app", "personal stylist", "ai stylist", "fashion ai", "outfit generator", "skin tone", "color matching"]
        }
    },
    team: {
        members: [
            {
                name: "Dhyan Nilesh Patel",
                role: "AI Specialist & Founder",
                bio: "Expert in artificial intelligence, machine learning, and cutting-edge AI technologies. Passionate about creating intelligent solutions that transform businesses and drive innovation in the digital landscape.",
                email: "dhyan3004@outlook.com",
                linkedin: "https://www.linkedin.com/in/dhyan-nilesh-patel-7b660916b/"
            }
        ],
        description: "AuraLogic has a team of 50+ experts in AI, development, web development, and IT solutions."
    },
    techStack: {
        ai: ["TensorFlow", "PyTorch", "OpenAI"],
        mobile: ["React Native", "Flutter", "Swift", "Kotlin"],
        web: ["React", "Node.js"],
        backend: ["Python", "Node.js"],
        cloud: ["AWS", "Azure"]
    },
    earlyAccess: {
        description: "Join our Early Access Program to be among the first to experience TripMate, BuddyUp, Dressera AI, and Aura AI. Get early access, exclusive updates, and shape the future of our innovative products.",
        products: ["TripMate", "BuddyUp", "Dressera AI", "Aura AI", "All Products"]
    }
};

// Conversation context tracking
let conversationContext = {
    history: [],
    lastTopic: null,
    lastService: null,
    lastProduct: null
};

// Helper function to check if a word/phrase exists with word boundaries
function hasWord(message, word) {
    // For multi-word phrases, check if they exist in the message
    if (word.includes(' ')) {
        return message.includes(word);
    }
    // For single words, use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(message);
}

// Enhanced intent detection with improved keyword matching
function detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    const originalMessage = message; // Keep original for regex patterns
    const intents = [];
    
    // Improved question type detection - works anywhere in the message
    const questionTypes = {
        what: /\b(what|what's|what is|what are|what does|what do|tell me about|describe|explain|tell me)\b/i,
        how: /\b(how|how does|how do|how can|how to|how is|how are|how would|how will)\b/i,
        when: /\b(when|when does|when do|when is|when are|when will|when can)\b/i,
        where: /\b(where|where is|where are|where can|where do|location|located)\b/i,
        why: /\b(why|why does|why do|why is|why are|why would|reason)\b/i,
        who: /\b(who|who is|who are|who does|who can)\b/i,
        can: /\b(can|can you|can i|can we|could|could you|is it possible)\b/i
    };
    
    for (const [type, pattern] of Object.entries(questionTypes)) {
        if (pattern.test(originalMessage)) {
            intents.push({ type, confidence: 0.85 });
        }
    }
    
    // Product detection with word boundaries (CHECK PRODUCTS FIRST - they should take priority)
    for (const [key, product] of Object.entries(knowledgeBase.products)) {
        let matched = false;
        let matchCount = 0;
        let specificNameMatch = false;
        
        // Check for exact product name match first (highest priority)
        const productName = product.name.toLowerCase();
        if (lowerMessage.includes(productName)) {
            specificNameMatch = true;
            matchCount++;
            matched = true;
        }
        
        // Then check keywords
        for (const keyword of product.keywords) {
            if (hasWord(lowerMessage, keyword)) {
                matchCount++;
                matched = true;
            }
        }
        
        // Higher confidence for specific product name matches, and if multiple keywords match
        if (matched) {
            let confidence = 0.9;
            if (specificNameMatch) {
                confidence = 1.0; // Maximum confidence for specific product name
            } else if (matchCount > 1) {
                confidence = 0.95;
            }
            intents.push({ type: 'product', product: key, confidence: confidence });
        }
    }
    
    // Service detection with word boundaries (CHECK SERVICES AFTER PRODUCTS)
    for (const [key, service] of Object.entries(knowledgeBase.services)) {
        let matched = false;
        let matchCount = 0;
        for (const keyword of service.keywords) {
            if (hasWord(lowerMessage, keyword)) {
                matchCount++;
                matched = true;
            }
        }
        // Higher confidence if multiple keywords match
        // But lower base confidence than products to avoid conflicts
        if (matched) {
            const confidence = 0.85 + (matchCount > 1 ? 0.05 : 0);
            intents.push({ type: 'service', service: key, confidence: Math.min(confidence, 0.95) });
        }
    }
    
    // Special pattern detection for common queries (higher priority)
    // Check for "what are the core services" or similar patterns first
    if (/\b(what are the|what are your|what are|list|tell me about|show me)\b.*\b(core\s+)?services\b/i.test(originalMessage)) {
        intents.push({ type: 'services', confidence: 0.95 });
    }
    
    // Check for "what services" patterns
    if (/\b(what|which|list|tell me about)\b.*\bservices?\b/i.test(originalMessage) && !lowerMessage.includes('product')) {
        intents.push({ type: 'services', confidence: 0.9 });
    }
    
    // General topic detection with improved matching
    const topicKeywords = {
        company: ["company", "auralogic", "about", "who are you", "tell me about your company", "what is auralogic", "who is auralogic"],
        pricing: ["price", "cost", "pricing", "how much", "quote", "estimate", "budget", "expensive", "cheap", "affordable"],
        contact: ["contact", "email", "phone", "reach", "get in touch", "address", "location", "call", "message"],
        team: ["team", "founder", "staff", "employees", "people", "who works", "who founded"],
        tech: ["technology", "tech stack", "tools", "framework", "languages", "stack", "technologies", "what technologies"],
        services: ["service", "services", "what do you do", "offer", "provide", "capabilities", "what services", "do you offer", "core services"],
        products: ["product", "products", "app", "application", "tripmate", "buddyup", "dressera", "dressera ai", "aura ai", "apps", "applications"],
        earlyAccess: ["early access", "beta", "waitlist", "join", "sign up", "notify", "early", "beta testing", "wait list"],
        features: ["feature", "features", "what can", "capabilities", "what does", "include", "includes", "has"],
        goals: ["goal", "vision", "mission", "purpose", "why", "objective", "aim", "what is your", "what are your"],
        help: ["help", "support", "assist", "guide", "information", "i need help", "can you help"],
        greeting: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "good day"],
        thanks: ["thank", "thanks", "appreciate", "grateful", "thank you"],
        goodbye: ["bye", "goodbye", "see you", "farewell", "later", "goodbye"]
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        // Skip services if we already detected it with high confidence
        if (topic === 'services' && intents.some(i => i.type === 'services' && i.confidence >= 0.9)) {
            continue;
        }
        for (const keyword of keywords) {
            if (hasWord(lowerMessage, keyword)) {
                // Boost confidence for services topic
                const baseConfidence = topic === 'services' ? 0.8 : 0.75;
                intents.push({ type: topic, confidence: baseConfidence });
                break;
            }
        }
    }
    
    // Context-aware follow-up detection
    if (conversationContext.lastTopic) {
        if (/\b(more|tell me more|elaborate|details|further|additional|expand|explain more)\b/i.test(originalMessage)) {
            intents.push({ type: 'followup', topic: conversationContext.lastTopic, confidence: 0.95 });
        }
        if (/\b(what else|anything else|other|different|alternatives|options)\b/i.test(originalMessage)) {
            intents.push({ type: 'alternatives', confidence: 0.85 });
        }
    }
    
    // Remove duplicates and sort by confidence
    const uniqueIntents = [];
    const seen = new Set();
    for (const intent of intents) {
        const key = `${intent.type}-${intent.service || intent.product || ''}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueIntents.push(intent);
        }
    }
    
    return uniqueIntents.sort((a, b) => b.confidence - a.confidence);
}

// Generate detailed response based on intent
function generateResponse(intents, message) {
    const lowerMessage = message.toLowerCase();
    
    if (intents.length === 0) {
        return generateFallbackResponse();
    }
    
    // Prioritize specific intents (service/product) over general question types when both are present
    // Products should have higher priority than services when both are detected
    let primaryIntent = intents[0];
    let questionTypeIntent = null;
    
    // Find if we have both a question type and a specific topic
    const hasQuestionType = intents.some(i => ['what', 'how', 'when', 'where', 'why', 'who', 'can'].includes(i.type));
    
    // Prioritize products over services when both are present
    const hasProduct = intents.find(i => i.type === 'product' && i.product);
    const hasService = intents.find(i => i.type === 'service' && i.service);
    const hasServicesTopic = intents.find(i => i.type === 'services' && i.confidence >= 0.9);
    const hasSpecificTopic = hasProduct || hasService;
    
    // Special handling: if services topic is detected with high confidence, prioritize it
    if (hasServicesTopic && hasServicesTopic.confidence >= 0.9) {
        primaryIntent = hasServicesTopic;
        questionTypeIntent = intents.find(i => ['what', 'how', 'when', 'where', 'why', 'who', 'can'].includes(i.type));
    } else if (hasQuestionType && hasSpecificTopic) {
        // Use the specific topic as primary (product takes priority over service), but keep question type for context
        primaryIntent = hasProduct || hasService;
        questionTypeIntent = intents.find(i => ['what', 'how', 'when', 'where', 'why', 'who', 'can'].includes(i.type));
    } else if (hasProduct && hasService) {
        // If both product and service are detected, prioritize product
        primaryIntent = hasProduct;
    }
    
    // Handle greetings (highest priority)
    if (primaryIntent.type === 'greeting') {
        return "Hello! I'm here to help you learn more about AuraLogic's services, products, and solutions. What would you like to know?";
    }
    
    // Handle thanks
    if (primaryIntent.type === 'thanks') {
        return "You're welcome! I'm glad I could help. Is there anything else you'd like to know about AuraLogic?";
    }
    
    // Handle goodbye
    if (primaryIntent.type === 'goodbye') {
        return "Thank you for chatting with us! If you have more questions, feel free to reach out anytime. Have a great day!";
    }
    
    // Handle company questions
    if (primaryIntent.type === 'company') {
        conversationContext.lastTopic = 'company';
        return `${knowledgeBase.company.overview} Our mission is to ${knowledgeBase.company.mission.toLowerCase()}. Would you like to know more about our services, products, or team?`;
    }
    
    // Handle goals/vision/mission
    if (primaryIntent.type === 'goals' || lowerMessage.includes('goal') || lowerMessage.includes('vision') || lowerMessage.includes('mission')) {
        conversationContext.lastTopic = 'goals';
        return `${knowledgeBase.company.vision} We're building ${knowledgeBase.products.tripmate.name} and ${knowledgeBase.products.buddyup.name} to revolutionize travel technology, ${knowledgeBase.products['dressera ai'].name} to help users dress better with AI, and ${knowledgeBase.products['aura ai'].name} to empower anyone to create AI agents. Would you like to learn more about any of our products?`;
    }
    
    // Handle all services overview (when asking about services in general)
    // Check for services intent OR what question about services OR explicit service-related queries
    const originalMessage = message; // Keep original for regex patterns
    const isServicesQuery = primaryIntent.type === 'services' || 
                           (questionTypeIntent && questionTypeIntent.type === 'what' && 
                            (lowerMessage.includes('service') || lowerMessage.includes('core services') || 
                             /\b(what are|what do you|what does|list|tell me about).*service/i.test(originalMessage))) ||
                           (lowerMessage.includes('core services') || 
                            (lowerMessage.includes('what') && lowerMessage.includes('service') && !lowerMessage.includes('product')));
    
    if (isServicesQuery) {
        conversationContext.lastTopic = 'services';
        const serviceList = Object.values(knowledgeBase.services).map(s => s.name).join(', ');
        const serviceDescriptions = Object.entries(knowledgeBase.services).map(([key, service]) => {
            return `• ${service.name}: ${service.description}`;
        }).join('\n');
        
        // If it's a specific "what are the core services" query, provide detailed response
        if (/\b(what are the|what are your|list|tell me about)\b.*\b(core\s+)?services\b/i.test(originalMessage)) {
            return `We offer ${Object.keys(knowledgeBase.services).length} core services:\n\n${serviceDescriptions}\n\nEach service is designed to help businesses transform digitally and leverage cutting-edge technology. Which service would you like to learn more about?`;
        }
        
        // Otherwise, provide concise list
        return `We offer ${Object.keys(knowledgeBase.services).length} core services: ${serviceList}. Each service is designed to help businesses transform digitally and leverage cutting-edge technology. Which service would you like to learn more about?`;
    }
    
    // Handle service questions
    if (primaryIntent.type === 'service' && primaryIntent.service) {
        const service = knowledgeBase.services[primaryIntent.service];
        conversationContext.lastTopic = 'service';
        conversationContext.lastService = primaryIntent.service;
        
        let response = '';
        
        // Determine question type for better responses
        const questionType = questionTypeIntent ? questionTypeIntent.type : null;
        const isHowQuestion = questionType === 'how' || lowerMessage.includes('how') || lowerMessage.includes('does') || lowerMessage.includes('work');
        const isWhatQuestion = questionType === 'what' || lowerMessage.includes('what');
        
        if (isHowQuestion) {
            // For "how" questions, provide detailed explanation
            response = `${service.description} ${service.details} `;
            // Add technology-specific details based on service type
            if (primaryIntent.service === 'mobile app development') {
                response += `We use technologies like ${knowledgeBase.techStack.mobile.join(', ')} to build robust applications. `;
            } else if (primaryIntent.service === 'ai solutions') {
                response += `We leverage frameworks like ${knowledgeBase.techStack.ai.join(', ')} to create intelligent systems. `;
            } else if (primaryIntent.service === 'it services') {
                response += `We work with cloud platforms like ${knowledgeBase.techStack.cloud.join(' and ')} to provide scalable infrastructure. `;
            }
        } else if (isWhatQuestion) {
            // For "what" questions, provide description and details
            response = `${service.description} ${service.details} `;
    } else {
            // Default: provide description and details
            response = `${service.description} ${service.details} `;
        }
        
        response += `Would you like to know more about this service, or would you like to schedule a consultation?`;
        return response;
    }
    
    // Handle products overview (when asking about products in general)
    if (primaryIntent.type === 'products' || (questionTypeIntent && questionTypeIntent.type === 'what' && (lowerMessage.includes('product') || lowerMessage.includes('app') || lowerMessage.includes('application')))) {
        conversationContext.lastTopic = 'products';
        const productList = Object.values(knowledgeBase.products).map(p => p.name).join(', ');
        return `We're developing ${Object.keys(knowledgeBase.products).length} innovative products: ${productList}. ${knowledgeBase.products.tripmate.name} helps travelers plan and manage trips, ${knowledgeBase.products.buddyup.name} connects travelers to share transportation costs, ${knowledgeBase.products['dressera ai'].name} helps users dress better with AI-powered styling, and ${knowledgeBase.products['aura ai'].name} enables anyone to create custom AI agents. Which product interests you most?`;
    }
    
    // Handle product questions
    if (primaryIntent.type === 'product' && primaryIntent.product) {
        const product = knowledgeBase.products[primaryIntent.product];
        conversationContext.lastTopic = 'product';
        conversationContext.lastProduct = primaryIntent.product;
        
        const questionType = questionTypeIntent ? questionTypeIntent.type : null;
        const isHowQuestion = questionType === 'how' || lowerMessage.includes('how') || lowerMessage.includes('does') || lowerMessage.includes('work');
        const isWhatQuestion = questionType === 'what' || lowerMessage.includes('what');
        const isFeatureQuestion = lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('capabilities') || lowerMessage.includes('include');
        
        let response = `${product.description} `;
        
        if (product.status) {
            response += `Status: ${product.status}. `;
        }
        
        // For "how" questions, provide more detailed explanations
        if (isHowQuestion) {
            if (primaryIntent.product === 'tripmate') {
                response += `TripMate works by helping you plan your trips with smart itinerary management, providing real-time navigation, offering personalized recommendations for hotels and restaurants, and tracking your expenses all in one place. `;
            } else if (primaryIntent.product === 'buddyup') {
                response += `BuddyUp works by connecting travelers heading to the same destination through smart route matching. You can find travel companions, coordinate through in-app messaging, and securely split transportation costs using integrations with Uber, Bolt, and other ride-sharing services. `;
            } else if (primaryIntent.product === 'aura ai') {
                response += `Aura AI works by allowing you to describe what you need in natural language. The platform automatically designs and generates the AI agent code for you, with optional visual editing capabilities. You can integrate with APIs and external tools, then instantly test and deploy your custom agent. `;
            }
        }
        
        // Handle feature questions
        if (isFeatureQuestion) {
            response += `Key features include: ${product.features.join(', ')}. `;
        } else if (!isHowQuestion && isWhatQuestion) {
            // For "what" questions, provide features summary
            response += `Key features include: ${product.features.slice(0, 4).join(', ')}. `;
        } else if (!isHowQuestion) {
            response += `Key features include: ${product.features.join(', ')}. `;
        }
        
        if (product.platforms) {
            response += `Available on ${product.platforms.join(' and ')}. `;
        }
        
        if (product.status === 'COMING SOON' || product.status === 'IN DEVELOPMENT') {
            response += `You can join our early access program to be notified when it launches!`;
        }
        
        return response;
    }
    
    // Handle "when" questions about product launches
    if (primaryIntent.type === 'when' || lowerMessage.includes('when will') || lowerMessage.includes('when is')) {
        if (lowerMessage.includes('tripmate') || lowerMessage.includes('trip mate')) {
            conversationContext.lastTopic = 'product';
            conversationContext.lastProduct = 'tripmate';
            return `${knowledgeBase.products.tripmate.name} is currently in development with a target launch in ${knowledgeBase.company.stats.launchYear}. We're actively working on it and you can join our early access program to be notified when it's ready for beta testing! Would you like more information about ${knowledgeBase.products.tripmate.name}?`;
        }
        if (lowerMessage.includes('buddyup') || lowerMessage.includes('buddy up')) {
            conversationContext.lastTopic = 'product';
            conversationContext.lastProduct = 'buddyup';
            return `${knowledgeBase.products.buddyup.name} is currently in development with a target launch in ${knowledgeBase.company.stats.launchYear}. Join our early access program to be among the first to try it when it launches! Would you like more information about ${knowledgeBase.products.buddyup.name}?`;
        }
        if (lowerMessage.includes('dressera') || lowerMessage.includes('dressera ai')) {
            conversationContext.lastTopic = 'product';
            conversationContext.lastProduct = 'dressera ai';
            return `${knowledgeBase.products['dressera ai'].name} is currently in development with a target launch in ${knowledgeBase.company.stats.launchYear}. Join our early access program to be notified when it's ready for beta testing! Would you like more information about ${knowledgeBase.products['dressera ai'].name}?`;
        }
        if (lowerMessage.includes('aura ai') || lowerMessage.includes('aura')) {
            conversationContext.lastTopic = 'product';
            conversationContext.lastProduct = 'aura ai';
            return `${knowledgeBase.products['aura ai'].name} is currently in development. We're targeting a ${knowledgeBase.company.stats.launchYear} launch. Join our early access program to be notified when it's ready! Would you like more information about ${knowledgeBase.products['aura ai'].name}?`;
        }
        if (lowerMessage.includes('launch') || lowerMessage.includes('release') || lowerMessage.includes('available')) {
            return `Our products (TripMate, BuddyUp, Dressera AI, and Aura AI) are currently in development, targeting a ${knowledgeBase.company.stats.launchYear} launch. You can join our early access program to be notified when they're ready! Which product interests you?`;
        }
    }
    
    // Handle pricing
    if (primaryIntent.type === 'pricing') {
        conversationContext.lastTopic = 'pricing';
        return "Our pricing varies based on project scope, complexity, and specific requirements. We offer custom solutions tailored to each client's needs. To get an accurate quote, I'd recommend scheduling a free consultation where we can discuss your project in detail and provide a comprehensive estimate. Would you like me to help you get in touch with our team?";
    }
    
    // Handle contact
    if (primaryIntent.type === 'contact') {
        conversationContext.lastTopic = 'contact';
        const contact = knowledgeBase.company.contact;
        return `You can reach us via email at ${contact.email} or call us at ${contact.phone}. Our team is available ${contact.hours}. We're located at ${knowledgeBase.company.location}. You can also fill out the contact form on our website for a more detailed inquiry. Would you like to know more about any of our services?`;
    }
    
    // Handle team
    if (primaryIntent.type === 'team') {
        conversationContext.lastTopic = 'team';
        const founder = knowledgeBase.team.members[0];
        return `${knowledgeBase.team.description} Our founder is ${founder.name}, an ${founder.role}. ${founder.bio} Would you like to know more about our company or services?`;
    }
    
    // Handle tech stack
    if (primaryIntent.type === 'tech') {
        conversationContext.lastTopic = 'tech';
        const techList = [
            ...knowledgeBase.techStack.ai,
            ...knowledgeBase.techStack.mobile,
            ...knowledgeBase.techStack.web,
            ...knowledgeBase.techStack.cloud
        ].join(', ');
        return `We master a comprehensive technology stack including: ${techList}. We use TensorFlow and PyTorch for AI/ML projects, React Native and Flutter for cross-platform mobile apps, React and Node.js for web development, and AWS and Azure for cloud infrastructure. Would you like to know more about how we use these technologies in our services?`;
    }
    
    // Handle early access
    if (primaryIntent.type === 'earlyAccess') {
        conversationContext.lastTopic = 'earlyAccess';
        return `${knowledgeBase.earlyAccess.description} You can join for TripMate, BuddyUp, Dressera AI, Aura AI, or all products. We'll notify you when beta testing begins and keep you updated on our progress! Would you like me to guide you to the early access form?`;
    }
    
    // Handle features question
    if (primaryIntent.type === 'features') {
        if (conversationContext.lastProduct) {
            const product = knowledgeBase.products[conversationContext.lastProduct];
            return `${product.name} features include: ${product.features.join(', ')}. Would you like to know more about any specific feature?`;
        }
        return "Our products and services offer various features depending on what you're interested in. Would you like to know about TripMate, BuddyUp, Dressera AI, Aura AI, or our services?";
    }
    
    // Handle help
    if (primaryIntent.type === 'help') {
        return "I'm here to help! I can tell you about our company, services (Mobile App Development, AI Solutions, Business Software, IT Services, Systems Integration, Web Development), products (TripMate, BuddyUp, Dressera AI, Aura AI), team, pricing, contact information, and more. What would you like to know?";
    }
    
    // Handle "can" questions (capability questions)
    if (questionTypeIntent && questionTypeIntent.type === 'can') {
        if (lowerMessage.includes('service') || lowerMessage.includes('do') || lowerMessage.includes('offer')) {
            return "Yes! We offer a wide range of services including Mobile App Development, AI Solutions, Business Software, IT Services, Systems Integration, and Web Development. We're also developing TripMate, BuddyUp, Dressera AI, and Aura AI. What specifically would you like to know more about?";
        }
        if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
            return "Absolutely! I'm here to help you learn about AuraLogic. You can ask me about our services, products, company information, pricing, contact details, or anything else. What would you like to know?";
        }
    }
    
    // Handle follow-up questions
    // BUT: if a product or service is explicitly mentioned, prioritize that over followup
    if (primaryIntent.type === 'followup' && conversationContext.lastTopic && !hasProduct && !hasService) {
        if (conversationContext.lastService) {
            const service = knowledgeBase.services[conversationContext.lastService];
            return `${service.details} We'd love to discuss how this service can benefit your business. Would you like to schedule a consultation or learn about our other services?`;
        }
        if (conversationContext.lastProduct) {
            const product = knowledgeBase.products[conversationContext.lastProduct];
            return `${product.description} ${product.status ? `Current status: ${product.status}. ` : ''}Would you like to join our early access program to be notified when it launches?`;
        }
    }
    
    // Try to provide helpful response even if intent is unclear
    // Check if message contains any keywords we know about
    const allKnownKeywords = [
        ...Object.values(knowledgeBase.services).flatMap(s => s.keywords),
        ...Object.values(knowledgeBase.products).flatMap(p => p.keywords),
        'service', 'product', 'company', 'auralogic', 'app', 'mobile', 'ai', 'travel'
    ];
    
    const foundKeywords = allKnownKeywords.filter(keyword => hasWord(lowerMessage, keyword));
    if (foundKeywords.length > 0) {
        // Provide a more helpful fallback based on detected keywords
        if (foundKeywords.some(k => ['tripmate', 'buddyup', 'dressera', 'dressera ai', 'aura ai'].includes(k.toLowerCase()))) {
            return "It sounds like you're asking about one of our products! We're developing TripMate (travel companion app), BuddyUp (travel companion finder), Dressera AI (AI wardrobe stylist), and Aura AI (AI agent builder). Which one would you like to know more about?";
        }
        if (foundKeywords.some(k => ['mobile', 'app', 'application'].includes(k.toLowerCase()))) {
            return "You might be asking about our Mobile App Development service or our mobile products. We develop native and cross-platform mobile apps, and we're also creating TripMate and BuddyUp mobile apps. What specifically would you like to know?";
        }
        if (foundKeywords.some(k => ['ai', 'artificial intelligence'].includes(k.toLowerCase()))) {
            return "You might be asking about our AI Solutions service or Aura AI product. We offer custom AI development services and we're building Aura AI, a platform that lets anyone create AI agents. What would you like to know more about?";
        }
    }
    
    // Default fallback
    return generateFallbackResponse();
}

// Generate helpful fallback response
function generateFallbackResponse() {
    const suggestions = [
        "I can help you learn about our services, products, company, team, pricing, or contact information.",
        "Would you like to know about our Mobile App Development, AI Solutions, or any of our other services?",
        "Are you interested in TripMate, BuddyUp, Dressera AI, or Aura AI? I'd be happy to tell you more!",
        "You can ask me about our company, services, products, or how to get in touch. What interests you?"
    ];
    
    const response = suggestions[Math.floor(Math.random() * suggestions.length)];
    return response + " Or you can fill out our contact form for more detailed information.";
}

// Enhanced chatbot response function
// Legacy getBotResponse - replaced with API call
function getBotResponse(userMessage) {
    // This function is no longer used - kept for reference
    // All responses now come from OpenAI Assistants API
    return "I'm processing your request...";
}

chatSend.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Disable input while processing
    chatInput.disabled = true;
    chatSend.disabled = true;
    
    // Add user message
    addMessage(message, true);
    chatInput.value = '';
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.textContent = 'Thinking...';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // Send message to backend API
        const botResponse = await sendMessageToAPI(message);
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Add bot response
        addMessage(botResponse, false);
    } catch (error) {
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Show error message with helpful instructions
        let errorMessage;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            if (window.location.protocol === 'file:') {
                // Running from file:// protocol
                errorMessage = "⚠️ Unable to connect to the backend server.\n\n" +
                    "Please access this application through the deployed website at:\n" +
                    "https://aura-website-livid.vercel.app\n\n" +
                    "The chatbot requires a live server connection to function properly.";
            } else {
                errorMessage = "I'm having trouble connecting to the server. Please try again later or contact support if the issue persists.";
            }
        } else {
            errorMessage = error.message || "I'm sorry, I encountered an error. Please try again later.";
        }
        
        addMessage(errorMessage, false);
        console.error('Chat error:', error);
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        chatSend.click();
    }
});

// Scroll-triggered animations for new sections
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections and cards
document.addEventListener('DOMContentLoaded', () => {
    const sectionsToAnimate = document.querySelectorAll('.about, .testimonials, .clients, .tech-stack');
    sectionsToAnimate.forEach(section => {
        section.classList.add('fade-in-up');
        observer.observe(section);
    });

    const cardsToAnimate = document.querySelectorAll('.team-member, .testimonial-card, .client-logo, .tech-item');
    cardsToAnimate.forEach(card => {
        card.classList.add('fade-in-up');
        observer.observe(card);
    });

    // Initialize carousel
    initCarousel();
});

// Carousel functionality
function initCarousel() {
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselContainer = document.getElementById('techCarousel');
    const leftArrow = document.querySelector('.carousel-arrow-left');
    const rightArrow = document.querySelector('.carousel-arrow-right');

    if (!carouselTrack || !carouselContainer) return;

    let isPaused = false;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let scrollLeft = 0;
    let autoSlideTimeout = null;

    const itemWidth = 230; // min-width (200px) + gap (30px)

    // Start auto-slide with CSS animation (for initial load)
    function startAutoSlide() {
        carouselTrack.classList.add('auto-slide');
        carouselTrack.classList.remove('paused');
        isPaused = false;
    }
    
    let jsAnimationId = null;
    
    // Start auto-slide with JavaScript animation (after manual interaction)
    function startJSAutoSlide() {
        if (isPaused || isDragging || jsAnimationId) return;
        
        // Get current position from transform
        const style = window.getComputedStyle(carouselTrack);
        if (style.transform && style.transform !== 'none') {
            const matrix = new DOMMatrix(style.transform);
            scrollLeft = matrix.m || 0;
        }
        
        // Calculate speed to match CSS animation (25s for 50% width = totalWidth/2)
        // At 60fps: 25s * 60fps = 1500 frames for totalWidth/2 pixels
        // Speed = (totalWidth/2) / 1500 = approximately 0.5px per frame
        const totalWidth = carouselTrack.scrollWidth / 2;
        const animationDuration = 25; // seconds (matches CSS)
        const fps = 60;
        const speed = (totalWidth / (animationDuration * fps));
        
        function animate() {
            if (isPaused || isDragging) {
                jsAnimationId = null;
                return;
            }
            
            scrollLeft -= speed;
            
            // Reset when reaching halfway for seamless loop (instant reset, no visible jump)
            // Since items are duplicated, when we reach -totalWidth, we reset to 0 seamlessly
            // This creates an infinite circular loop
            if (scrollLeft <= -totalWidth) {
                scrollLeft = scrollLeft + totalWidth; // Reset to equivalent position in first half
            }
            
            carouselTrack.style.transform = `translateX(${scrollLeft}px)`;
            jsAnimationId = requestAnimationFrame(animate);
        }
        
        jsAnimationId = requestAnimationFrame(animate);
    }
    
    // Stop JavaScript animation
    function stopJSAutoSlide() {
        if (jsAnimationId) {
            cancelAnimationFrame(jsAnimationId);
            jsAnimationId = null;
        }
    }

    // Pause auto-slide
    function pauseAutoSlide() {
        carouselTrack.classList.add('paused');
        stopJSAutoSlide();
        // Also get current position before pausing
        const style = window.getComputedStyle(carouselTrack);
        if (style.transform && style.transform !== 'none') {
            const matrix = new DOMMatrix(style.transform);
            scrollLeft = matrix.m || 0;
        }
        isPaused = true;
    }

    // Resume auto-slide
    function resumeAutoSlide() {
        // Only resume if not currently dragging
        if (isDragging) return;
        
        // Clear the paused state
        isPaused = false;
        
        // If we have an inline transform (from manual slide), use JS animation
        if (carouselTrack.style.transform && carouselTrack.style.transform !== 'none') {
            carouselTrack.classList.remove('auto-slide'); // Remove CSS animation
            startJSAutoSlide();
        } else {
            // Otherwise use CSS animation
            carouselTrack.classList.remove('paused');
        }
    }

    // Manual slide function
    function slide(direction) {
        pauseAutoSlide();
        
        // Get current transform
        const style = window.getComputedStyle(carouselTrack);
        let currentPosition = 0;
        
        if (style.transform && style.transform !== 'none') {
            const matrix = new DOMMatrix(style.transform);
            currentPosition = matrix.m || 0;
        }
        
        const slideAmount = itemWidth * 3; // Slide by 3 items
        let newPosition = currentPosition + (direction === 'left' ? -slideAmount : slideAmount);
        
        const totalWidth = carouselTrack.scrollWidth / 2; // Half because we duplicated items
        
        // Handle seamless loop - normalize position to first half before sliding
        if (Math.abs(currentPosition) >= totalWidth) {
            currentPosition = currentPosition % totalWidth;
            // Update position smoothly before sliding
            carouselTrack.style.transition = 'transform 0.2s ease-out';
            carouselTrack.style.transform = `translateX(${currentPosition}px)`;
            
            // Wait for reset, then slide
            setTimeout(() => {
                newPosition = currentPosition + (direction === 'left' ? -slideAmount : slideAmount);
                performSlide(newPosition, totalWidth);
            }, 200);
        } else {
            performSlide(newPosition, totalWidth);
        }
    }
    
    // Helper function to perform the actual slide
    function performSlide(newPosition, totalWidth) {
        // Normalize position to first half range (-totalWidth to 0) for seamless loop
        let normalizedPosition = newPosition;
        
        // Handle negative positions (going left)
        while (normalizedPosition < -totalWidth) {
            normalizedPosition += totalWidth;
        }
        
        // Handle positive positions (going right past start)
        while (normalizedPosition > 0) {
            normalizedPosition -= totalWidth;
        }
        
        // Remove auto-slide animation for manual control
        carouselTrack.classList.remove('auto-slide', 'paused');
        carouselTrack.style.transform = `translateX(${normalizedPosition}px)`;
        carouselTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Store position for when we restart animation
        scrollLeft = normalizedPosition;
        
        // Reset and resume auto-slide after animation completes
        if (autoSlideTimeout) clearTimeout(autoSlideTimeout);
        autoSlideTimeout = setTimeout(() => {
            // Normalize position to be within the first half range for seamless looping
            let normalizedPosition = scrollLeft;
            
            // Ensure position is between -totalWidth and 0
            while (normalizedPosition < -totalWidth) {
                normalizedPosition += totalWidth;
            }
            while (normalizedPosition > 0) {
                normalizedPosition -= totalWidth;
            }
            
            // If position needs adjustment, do it smoothly
            if (Math.abs(normalizedPosition - scrollLeft) > 1) {
                carouselTrack.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                carouselTrack.style.transform = `translateX(${normalizedPosition}px)`;
                scrollLeft = normalizedPosition;
                
                // After transition, start JavaScript animation for seamless loop
                setTimeout(() => {
                    carouselTrack.style.transition = '';
                    resumeAutoSlide();
                }, 250);
            } else {
                // Already normalized, start animation immediately
                carouselTrack.style.transition = '';
                scrollLeft = normalizedPosition;
                resumeAutoSlide();
            }
        }, 350);
    }

    // Touch/Mouse drag handlers
    function handleStart(e) {
        isDragging = true;
        pauseAutoSlide();
        
        // Get current transform for smooth drag
        const style = window.getComputedStyle(carouselTrack);
        const matrix = new DOMMatrix(style.transform);
        scrollLeft = matrix.m || 0;
        
        carouselTrack.classList.remove('auto-slide');
        carouselTrack.style.transition = '';
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
    }

    function handleMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const diffX = clientX - startX;
        currentX = scrollLeft + diffX;
        
        carouselTrack.style.transform = `translateX(${currentX}px)`;
    }

    function handleEnd(e) {
        if (!isDragging) return;
        
        const diffX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - startX;
        isDragging = false; // Set to false before any async operations
        
        // If dragged more than 60px, trigger slide (more responsive)
        if (Math.abs(diffX) > 60) {
            const direction = diffX > 0 ? 'right' : 'left';
            slide(direction);
        } else {
            // Return to original position and resume auto-slide (smoother and faster)
            carouselTrack.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            carouselTrack.style.transform = `translateX(${scrollLeft}px)`;
            
            setTimeout(() => {
                carouselTrack.style.transition = '';
                // After drag, use JavaScript animation to continue smoothly
                resumeAutoSlide();
            }, 250);
        }
    }

    // Event listeners for arrows
    if (leftArrow) leftArrow.addEventListener('click', () => slide('left'));
    if (rightArrow) rightArrow.addEventListener('click', () => slide('right'));

    // Touch events
    let touchStarted = false;
    let touchMoved = false;
    
    carouselContainer.addEventListener('touchstart', (e) => {
        touchStarted = true;
        touchMoved = false;
        pauseAutoSlide(); // Pause immediately on touch
        // Don't set isDragging yet - only if user actually moves
    }, { passive: false });
    
    carouselContainer.addEventListener('touchmove', (e) => {
        if (!touchMoved) {
            touchMoved = true;
            handleStart(e); // Only call handleStart when movement detected
        }
        handleMove(e);
    }, { passive: false });
    
    carouselContainer.addEventListener('touchend', (e) => {
        if (touchMoved) {
            // User dragged, use normal handleEnd
            handleEnd(e);
        } else {
            // Simple touch (no drag) - just resume
            touchStarted = false;
            setTimeout(() => {
                if (!touchStarted && !isDragging) {
                    resumeAutoSlide();
                }
            }, 300);
        }
        touchMoved = false;
        touchStarted = false;
    });
    
    // Also handle touch cancel
    carouselContainer.addEventListener('touchcancel', () => {
        touchStarted = false;
        touchMoved = false;
        isDragging = false;
        resumeAutoSlide();
    });

    // Mouse events for desktop drag
    let isMouseDown = false;
    carouselContainer.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        handleStart(e);
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            handleMove(e);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isMouseDown) {
            isMouseDown = false;
            handleEnd(e);
        }
    });

    // Pause on hover - use a small delay before resuming to avoid flickering
    let hoverTimeout = null;
    carouselContainer.addEventListener('mouseenter', () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        pauseAutoSlide();
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        // Small delay to ensure smooth transition
        hoverTimeout = setTimeout(() => {
            if (!isDragging) {
                resumeAutoSlide();
            }
        }, 100);
    });

    // Pause when interacting with arrows
    [leftArrow, rightArrow].forEach(arrow => {
        if (arrow) {
            arrow.addEventListener('mouseenter', () => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                pauseAutoSlide();
            });
            
            arrow.addEventListener('mouseleave', () => {
                if (hoverTimeout) clearTimeout(hoverTimeout);
                // Check if mouse is still over carousel or arrow
                hoverTimeout = setTimeout(() => {
                    if (!carouselContainer.matches(':hover') && !arrow.matches(':hover') && !isDragging) {
                        resumeAutoSlide();
                    }
                }, 100);
            });
        }
    });
    

    // Initialize auto-slide with CSS animation (only on page load)
    // After manual interaction, we'll use JavaScript animation
    startAutoSlide();
}

