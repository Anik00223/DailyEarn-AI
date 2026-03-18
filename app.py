import os
import asyncio
import uuid
import bcrypt
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory, g
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

os.environ['JWT_SECRET'] = os.getenv('JWT_SECRET', os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production'))

from security import rate_limit, validate_request_body, validate_response
from prompt import build_prompt
from global_engine import init_engines, generate_with_ai, check_health
from database import (
    init_db, create_user, get_user, update_user,
    create_auth_user, get_auth_user_by_email,
    save_idea, get_history, get_used_titles, toggle_favorite, delete_idea, get_stats
)
from idea_engine import generate_idea
from middleware import require_auth, check_ownership, init_limiter
from middleware.auth import generate_token

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'fallback-secret')

CORS(app, origins=[
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    os.getenv('VERCEL_URL', ''),
    'https://*.vercel.app',
    os.getenv('FRONTEND_URL', ''),
])

init_limiter(app)

init_db()
init_engines()


# API routes only - frontend is served separately by Vercel
# Remove static file serving since Vercel will handle it


@app.route('/style.css')
def serve_css():
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'public'), 'style.css')


@app.route('/app.js')
def serve_js():
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'public'), 'app.js')


# ── Auth Routes ──

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user with auth."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    name = data.get('name', 'User')
    city = data.get('city', '')
    country = data.get('country', '')
    skills = data.get('skills', '')
    hours = data.get('hours', 2)
    capital = data.get('capital', '$0')
    device = data.get('device', 'phone')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400

    existing = get_auth_user_by_email(email)
    if existing:
        return jsonify({'success': False, 'error': 'User already exists'}), 409

    profile_id = str(uuid.uuid4())
    profile_data = {
        'id': profile_id,
        'name': name,
        'city': city,
        'country': country,
        'skills': skills,
        'hours': hours,
        'capital': capital,
        'device': device
    }
    create_user(profile_data)

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    auth_user = create_auth_user(email, password_hash, 'user', profile_id)

    token = generate_token(auth_user)

    return jsonify({
        'success': True,
        'token': token,
        'userId': profile_id,
        'message': 'User registered successfully'
    })


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').lower().strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400

    auth_user = get_auth_user_by_email(email)
    if not auth_user:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    stored_hash = auth_user['password_hash'].encode()
    if not bcrypt.checkpw(password.encode(), stored_hash):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    token = generate_token(auth_user)

    return jsonify({
        'success': True,
        'token': token,
        'userId': auth_user['linked_profile_id'],
        'message': 'Login successful'
    })


@app.route('/api/profile/<user_id>', methods=['GET'])
@require_auth
def get_profile(user_id):
    """Get user profile."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    user = get_user(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({'success': True, 'user': user})


@app.route('/api/profile/<user_id>', methods=['PUT'])
@require_auth
def update_profile(user_id):
    """Update user profile."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    updated = update_user(user_id, data)
    if not updated:
        return jsonify({'success': False, 'error': 'Update failed'}), 500

    return jsonify({'success': True, 'user': updated    })


@app.route('/api/generate', methods=['POST'])
@require_auth
def api_generate():
    """Generate a new idea for a user."""
    data = request.get_json() or {}
    user_id = data.get('userId')

    if not user_id:
        return jsonify({'success': False, 'error': 'userId required'}), 400

    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    user = get_user(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    used_titles = get_used_titles(user_id)
    idea = generate_idea(user, used_titles)

    if not idea:
        return jsonify({'success': False, 'error': 'No ideas available'}), 500

    save_idea(idea)

    return jsonify({'success': True, 'idea': idea, 'source': 'offline'})


@app.route('/api/history/<user_id>', methods=['GET'])

@app.route('/api/history/<user_id>', methods=['GET'])
@require_auth
def get_user_history(user_id):
    """Get idea history for a user."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    history = get_history(user_id)
    return jsonify({'success': True, 'history': history})


@app.route('/api/favorite/<user_id>/<idea_id>', methods=['POST'])
@require_auth
def toggle_favorite_idea(user_id, idea_id):
    """Toggle favorite status for an idea."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    result = toggle_favorite(user_id, idea_id)
    if not result:
        return jsonify({'success': False, 'error': 'Idea not found'}), 404

    return jsonify({'success': True, 'is_favorite': result['is_favorite']})


@app.route('/api/history/<user_id>/<idea_id>', methods=['DELETE'])
@require_auth
def delete_idea_from_history(user_id, idea_id):
    """Delete an idea from history."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    delete_idea(user_id, idea_id)
    return jsonify({'success': True, 'message': 'Idea deleted'    })


@app.route('/api/stats/<user_id>', methods=['GET'])
@require_auth
def get_user_stats(user_id):
    """Get user statistics."""
    if not check_ownership(user_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    stats = get_stats(user_id)
    return jsonify({'success': True, 'stats': stats    })


@app.route('/generate', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def generate():
    try:
        data = validate_request_body(request.get_json())

        if not data.get('city') or not data.get('country'):
            return jsonify({'error': 'City and country are required.'}), 400

        result = asyncio.run(generate_with_ai(data))
        
        if not result:
            return jsonify({'error': 'AI service unavailable. Try again later.'}), 503

        response_data = {
            'result': result.get('title', ''),
            'location': result.get('targetLocation', ''),
            'platform': result.get('platform', ''),
            'businessModel': result.get('businessModel', ''),
            'steps': result.get('steps', ''),
            'earnings': result.get('earnings', ''),
            'timeNeeded': result.get('timeNeeded', ''),
            'startNow': result.get('startNow', ''),
            'scaleTip': result.get('scaleTip', ''),
            'aiInsight': result.get('aiInsight', ''),
            'localNote': result.get('localNote', '')
        }

        return jsonify(response_data), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    except Exception as e:
        print(f'[ERROR] {str(e)}')
        return jsonify({'error': 'Something went wrong. Please try again.'}), 500


@app.route('/health')
def health():
    ai_status = asyncio.run(check_health())
    return jsonify({'status': 'ok', 'ai': ai_status}), 200


@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()    })


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed.'}), 405


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found.'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error. Try again.'}), 500


if __name__ == '__main__':
    app.run(
        debug=False,
        host='127.0.0.1',
        port=5000
    )
