import re
import bleach
from functools import wraps
from flask import request, jsonify
import time

# ── INPUT SANITIZER ──────────────────────────────────────
INJECTION_PATTERNS = [
    r'ignore\s+previous',
    r'forget\s+everything',
    r'you\s+are\s+now',
    r'act\s+as',
    r'new\s+instructions',
    r'system\s+prompt',
    r'jailbreak',
    r'dan\s+mode',
    r'developer\s+mode',
    r'override\s+instructions',
    r'disregard',
    r'pretend\s+you',
    r'reveal\s+prompt',
    r'print\s+your\s+instructions',
    r'<script',
    r'javascript:',
    r'eval\s*\(',
    r'exec\s*\(',
    r'__import__',
    r'os\.system',
    r'subprocess',
]

def sanitize_input(value: str, max_length: int = 200) -> str:
    """Sanitize and validate user input."""
    if not value or not isinstance(value, str):
        raise ValueError("Invalid input.")

    # Strip HTML
    value = bleach.clean(value, tags=[], strip=True)

    # Check length
    if len(value) > max_length:
        raise ValueError(f"Input too long. Max {max_length} characters.")

    # Block injection attempts
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValueError("Invalid input detected.")

    # Remove dangerous special characters
    value = re.sub(r'[<>{}[\]\\|^`]', '', value)

    return value.strip()


# ── RESPONSE VALIDATOR ────────────────────────────────────
SUSPICIOUS_RESPONSE_PATTERNS = [
    r'<script',
    r'javascript:',
    r'on\w+\s*=',
    r'eval\s*\(',
    r'document\.',
    r'window\.',
]

def validate_response(text: str) -> str:
    """Validate AI response before sending to frontend."""
    if not text or not isinstance(text, str):
        raise ValueError("Empty response from AI.")

    # Must contain expected format markers
    required = ['💡', '🌍', '💰']
    if not any(marker in text for marker in required):
        raise ValueError("Unexpected response format.")

    # Block suspicious content in response
    for pattern in SUSPICIOUS_RESPONSE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise ValueError("Response blocked for security.")

    # Cap length
    return text[:6000] if len(text) > 6000 else text


# ── RATE LIMITER ──────────────────────────────────────────
request_log: dict = {}

def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """Decorator — blocks more than max_requests per IP per window."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or 'unknown'
            now = time.time()

            if ip not in request_log:
                request_log[ip] = []

            # Remove old requests outside window
            request_log[ip] = [
                t for t in request_log[ip]
                if now - t < window_seconds
            ]

            if len(request_log[ip]) >= max_requests:
                wait = int(window_seconds - (now - request_log[ip][0]))
                return jsonify({
                    'error': f'Too many requests. Wait {wait} seconds.'
                }), 429

            request_log[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ── REQUEST VALIDATOR ─────────────────────────────────────
ALLOWED_HOURS = ['1 hour','2 hours','3 hours','5 hours','8+ hours']
ALLOWED_CAPITAL = ['zero','small','medium','large']
ALLOWED_DEVICES = ['phone only','laptop','phone and laptop']

def validate_request_body(data: dict) -> dict:
    """Validate and sanitize full request body."""
    if not data:
        raise ValueError("Empty request body.")

    return {
        'city':    sanitize_input(data.get('city', ''), 100),
        'country': sanitize_input(data.get('country', ''), 100),
        'skills':  sanitize_input(data.get('skills', ''), 200),
        'hours':   data.get('hours', '3 hours'),
        'capital': data.get('capital', 'zero'),
        'device':  data.get('device', 'laptop'),
        'count':   min(int(data.get('count', 1)), 9999),
        'used':    sanitize_input(str(data.get('used', '')), 500),
    }
