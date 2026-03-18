# DailyEarn AI — Your Personal Hyper-Local Business Idea Generator

Ever wished you had a business consultant who knows your city inside out? Someone who understands the local markets, knows which platforms are hot right now, and can tell you exactly what business to start based on your skills and budget?

**DailyEarn AI is exactly that — but powered by AI.**

It's like having a McKinsey consultant, a street-smart local entrepreneur, and a tech-savvy mentor all rolled into one — all working for you to find the perfect money-making opportunity in your exact city.

## 🌟 What Makes DailyEarn Special?

### Think Global, Act Local

Most business advice is generic. "Start a dropshipping business" or "become a freelance writer" — but that's not helpful when you're in Mumbai, Lagos, or São Paulo, and you need to know exactly which local platforms to use, what prices locals actually pay, and which neighborhoods have the most demand.

DailyEarn AI is different. It knows:
- **50+ Indian cities** — from Mumbai's busy markets to Bangalore's tech corridors
- **15+ US cities** — from New York's startup scene to Austin's creative vibe  
- **UK, Canada, Australia, Germany, France, Japan** — and 40+ more countries worldwide

For each city, we have the real neighborhoods, the real hotspots, the real Facebook groups, the real platforms locals actually use, and even the real festivals that drive demand.

### Your Profile, Your Business

Tell us about yourself:
- 🏙️ **Your City** — where you want to operate
- 🌍 **Your Country** — for local platforms and currency
- 💼 **Your Skills** — cooking, coding, photography, teaching, sales...
- ⏰ **Time You Have** — 2 hours a day? 8 hours? We've got ideas for both
- 💰 **Your Capital** — from zero to ₹10,000+ (or $100+)
- 📱 **Your Device** — phone-only or laptop

And we'll generate business ideas that actually fit your situation — not some generic "side hustle" that doesn't work in your location.

### Real Ideas, Real Numbers

No vague advice like "offer services online." We give you:
- **Exact business names** you can use
- **Specific neighborhoods** to target (not "a busy area" — we name them)
- **Real local platforms** — from JustDial in India to TaskRabbit in the US, from Meesho to Uber Eats
- **Actual price math** — showing how you calculate earnings minus costs
- **Copy-paste ready posts** — for WhatsApp, Facebook, Instagram
- **Scaling plans** — including hiring local people at real salary ranges

## 🚀 Features

### AI-Powered Generation
- Uses Claude 3.5 Sonnet (Anthropic API) for intelligent, context-aware business ideas
- Falls back to our offline template engine if AI is unavailable
- Never repeats ideas — keeps track of what you've seen

### Smart Filtering
- Matches ideas to your skill set
- Respects your capital constraints
- Considers your available time
- Works with whatever device you have

### Your Personal Dashboard
- 📜 **Idea History** — every idea you generate, saved forever
- ❤️ **Favorites** — bookmark the best ones
- 🔥 **Streaks** — track your consistency
- 📊 **Stats** — total ideas generated, current streak, longest streak

### Built-in Security
- Input sanitization to prevent prompt injection
- Rate limiting (10 requests per minute)
- Response validation
- CORS protection

## 💻 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, Flask |
| AI | Anthropic Claude 3.5 Sonnet, Bytez API |
| Database | SQLite (with WAL mode) |
| Security | Bleach, custom sanitization, rate limiting |
| Frontend | HTML5, CSS3 (Glassmorphism), Vanilla JS |
| Auth | JWT tokens, bcrypt password hashing |

## 🛠️ Quick Start

### 1. Get Your API Key
You'll need an Anthropic API key. Get one at [anthropic.com](https://www.anthropic.com).

### 2. Set Up Your Environment

```bash
# Clone and enter the project
git clone <repository-url>
cd dailyearn-ai

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure

Create a `.env` file:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
FLASK_SECRET_KEY=some_long_random_string
```

Optional (for AI-powered generation):
```env
BYTEZ_API_KEY=your_bytez_api_key_here
```

### 4. Run It

```bash
# Start the main app (AI-powered)
python app.py

# Or start the API server (with auth & database)
python api_server.py
```

- Main app: http://127.0.0.1:5000
- API server: http://localhost:3000/api

## 📂 Project Structure

```
├── app.py                 # Main Flask app with AI integration
├── api_server.py          # Extended API with auth & user management
├── database.py            # SQLite database operations
├── security.py            # Input sanitization & rate limiting
├── prompt.py              # AI prompt builder
├── idea_engine.py         # Offline template-based idea generator
├── gemini_engine.py       # AI engine (Claude via Bytez)
├── local_data.py          # Business idea templates
├── city_data.py           # 50+ cities with neighborhoods & hotspots
├── country_data.py        # 40+ countries with platforms & festivals
├── middleware/            # Auth & rate limiting middleware
│   ├── auth.py            # JWT authentication
│   └── rate_limiter.py    # Request rate limiting
├── public/                # Frontend assets
│   ├── index.html         # Beautiful glassmorphic UI
│   ├── app.js             # Frontend JavaScript
│   └── style.css          # Styling
└── templates/             # HTML templates
```

## 🎯 Example Ideas (What You'll Get)

Here's what a generated idea looks like for someone in **Bangalore, India** with cooking skills and ₹5,000 capital:

> **💡 BIG IDEA: Home Tiffin Service for PG Students**
>
> **📍 Operate in:** Koramangala, HSR Layout, BTM Layout — highest PG density
>
> **🌍 Local Platforms:** WhatsApp groups, Instagram, JustDial listing
>
> **💰 Earnings:** ₹18,000-24,000/month (40 students × ₹70/meal × 15 meals)
>
> **🚀 Start Now:** "Open Facebook, search 'Bangalore PG accommodation' groups, join 5 groups, post: 'Homemade thali ₹70 — FREE trial today for first 3 customers in Koramangala area...'"

## 🔒 Security First

We take security seriously:
- **Input Sanitization** — Every input is cleaned and validated
- **Prompt Injection Protection** — Blocks attempts to override AI instructions
- **Rate Limiting** — 10 requests per minute per IP
- **Response Validation** — AI responses checked before showing to users
- **Password Hashing** — bcrypt with salt
- **JWT Auth** — Secure token-based authentication

## 🤝 Contributing

Found a bug? Have a great idea template to add? Want to support more cities?

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License — use it, modify it, build on it. See the LICENSE file for details.

---

**Made with ❤️ for entrepreneurs everywhere**

*No matter your skills, your budget, or your city — there's a business idea waiting for you.*
