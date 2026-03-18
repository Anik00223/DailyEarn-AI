

import os
import uuid
import bcrypt
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS

from database import (
    init_db, create_user, get_user, update_user,
    create_auth_user, get_auth_user_by_email,
    save_idea, get_history, get_used_titles, toggle_favorite, delete_idea, get_stats
)
from idea_engine import generate_idea
from middleware import require_auth, check_ownership, init_limiter

app = Flask(__name__)
CORS(app)
init_limiter(app)

if not os.environ.get('JWT_SECRET'):
    os.environ['JWT_SECRET'] = 'dev-secret-key-change-in-production'

from middleware.auth import generate_token


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
def generate():
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


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    print("Starting DailyEarn AI API Server...")
    print("API available at http://localhost:3000/api")
    app.run(host='0.0.0.0', port=3000, debug=True)
