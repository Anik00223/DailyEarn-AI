"""DailyEarn AI — AI Idea Engine (Claude Opus 4.5 via Bytez).

Primary: Bytez SDK → Claude Opus 4.5
"""

import os
import json
import uuid
import requests
from datetime import datetime
from local_data import get_country_data, get_city_data

# ── Engine State ──
bytez_api_key = None

CURRENCY_MAP = {
    'india': '₹', 'usa': '$', 'united states': '$', 'us': '$',
    'uk': '£', 'united kingdom': '£', 'england': '£',
    'germany': '€', 'france': '€', 'spain': '€', 'italy': '€', 'netherlands': '€',
    'portugal': '€', 'belgium': '€', 'austria': '€', 'ireland': '€', 'finland': '€', 'greece': '€',
    'australia': 'A$', 'canada': 'C$', 'brazil': 'R$',
    'nigeria': '₦', 'kenya': 'KSh', 'south africa': 'R',
    'pakistan': 'Rs', 'bangladesh': '৳', 'philippines': '₱',
    'malaysia': 'RM', 'indonesia': 'Rp', 'singapore': 'S$',
    'uae': 'AED', 'dubai': 'AED', 'united arab emirates': 'AED',
    'japan': '¥', 'china': '¥', 'south korea': '₩', 'thailand': '฿', 'vietnam': '₫',
    'mexico': 'MX$', 'colombia': 'COP', 'argentina': 'AR$', 'chile': 'CLP',
    'egypt': 'E£', 'ghana': 'GH₵', 'tanzania': 'TSh',
    'saudi arabia': 'SAR', 'qatar': 'QAR', 'kuwait': 'KD', 'bahrain': 'BD', 'oman': 'OMR',
    'turkey': '₺', 'russia': '₽', 'poland': 'zł', 'sweden': 'SEK', 'norway': 'NOK',
    'denmark': 'DKK', 'switzerland': 'CHF',
    'new zealand': 'NZ$', 'sri lanka': 'LKR', 'nepal': 'NPR', 'myanmar': 'MMK',
}


def get_currency(country):
    key = (country or '').lower().strip()
    for k, v in CURRENCY_MAP.items():
        if key in k or k in key:
            return v
    return '$'


def init_engines():
    """Initialize AI engines."""
    global bytez_api_key

    bkey = os.environ.get('BYTEZ_API_KEY', '')
    if bkey:
        bytez_api_key = bkey
        print('  [OK] Bytez -> Claude Opus 4.5 initialized (PRIMARY)')
    else:
        print('  [ERROR] No BYTEZ_API_KEY - Claude engine disabled')

    return bool(bytez_api_key)


def build_prompt(profile, used_titles, country_info, city_info, idea_count):
    """Build the AI prompt (same as JS version)."""
    city = profile.get('city', 'your city')
    country = profile.get('country', 'India')
    skills = profile.get('skills', 'general')
    hours = profile.get('hours', 2)
    capital = profile.get('capital', '$0')
    device = profile.get('device', 'phone')
    cur = get_currency(country)

    now = datetime.now()
    day_names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']
    date_str = f"{day_names[now.weekday()]}, {month_names[now.month-1]} {now.day}, {now.year}"
    timestamp = now.isoformat()

    month = now.month
    festivals = country_info.get('festivals', {})
    fest_list = festivals.get(month, []) if isinstance(festivals, dict) else []
    festival_str = ', '.join(f for f in fest_list if f) or 'check local events'

    areas = city_info.get('areas', [])
    hotspots = city_info.get('hotspots', [])
    fb_groups = city_info.get('fbGroups', [])
    used_str = ', '.join(used_titles) if used_titles else 'None yet'
    return f"""SYSTEM:
You are DailyEarn AI — the world's most precise hyper-local business intelligence agent. You think like a combination of a McKinsey consultant, a local street-smart entrepreneur, and someone who has lived in the user's exact city their entire life. You do not give side hustles. You do not give small ideas. You give REAL businesses — ones that can make someone financially free within 12 months — built entirely around the local economy, local culture, local demand, and local platforms of their exact city. Every number must be real. Every location must be real. Every platform must actually exist in that country. Every price must reflect what locals actually pay. You are not an AI giving generic advice. You are a local business architect.

USER:
Generate BIG local business idea #{idea_count} for:

CITY: {city}
COUNTRY: {country}
SKILLS: {skills}
FREE TIME: {hours}/day
CAPITAL: {capital}
DEVICE: {device}
TODAY: {date_str}
TIMESTAMP: {timestamp}
NEVER REPEAT: {used_str}

╔═══════════════════════════════════════════╗
║         BIG IDEA DEFINITION               ║
╚═══════════════════════════════════════════╝

A BIG idea means:
- Not a gig. Not a task. A BUSINESS.
- Has recurring revenue — customers come back every week or month automatically
- Can be scaled by hiring local people
- Solves a real gap in {city} that nobody is filling properly right now
- Can realistically reach {cur}50,000–5,00,000/month within 12 months depending on country
- Something the person can tell their family about proudly — a real venture, not a side job

Examples of BIG ideas (don't copy, use as scale reference):
- A home-cooked meal subscription for PG students in a specific neighbourhood
- A local WhatsApp-based grocery delivery service for apartment complexes
- A hyperlocal social media management agency for small shops on one street
- A B2B laundry pickup service for offices and hotels
- A reselling business buying wholesale from one market and selling to another

╔═══════════════════════════════════════════╗
║      LOCALITY DEPTH — NON NEGOTIABLE      ║
╚═══════════════════════════════════════════╝

LAYER 1 — NEIGHBOURHOOD PRECISION:
Never say "a busy area of {city}"
Always name the EXACT neighbourhoods. For {city}: name its REAL specific neighbourhoods.

LAYER 2 — REAL LOCAL PLATFORMS:
For India: JustDial, Sulekha, OLX, IndiaMART, Meesho, Urban Company, Apna, WorkIndia, Dunzo, Blinkit, Swiggy, Zomato, Zepto, Rapido, Facebook Marketplace, local WhatsApp groups, NoBroker, MagicBricks, Quikr, Internshala, Truelancer, PayTM, PhonePe, UPI, ONDC. For USA: Yelp, TaskRabbit, Thumbtack, Nextdoor, etc. For any other country: use only real dominant local platforms that actually operate there.

LAYER 3 — LOCAL PRICE INTELLIGENCE:
Research what locals in {city} actually pay. Never give a vague price range. Always show the math.

LAYER 4 — LOCAL COMPETITION GAP:
Name the actual competitors in {city} and explain exactly what gap exists that this business fills.

LAYER 5 — COPY-PASTE LAUNCH ACTIONS:
Every action step must be so specific that the person can execute it WITHOUT thinking. (e.g. search '{city} PG Rooms' -> join -> post exact message).

LAYER 6 — REAL LOCAL EARNING MATH:
Always subtract real costs. Always show net profit.

LAYER 7 — SCALE WITH LOCAL HIRING:
Show how to hire locals from {city} to scale. Name real hiring platforms for {country}. Give exact salary ranges locals in {city} accept.

╔═══════════════════════════════════════════╗
║           OUTPUT FORMAT — EXACT           ║
╚═══════════════════════════════════════════╝

{{
  "title": "💡 BIG IDEA: [Real business name — not a task, a venture]",
  "targetLocation": "📍 OPERATE HERE: [3-4 exact real neighbourhoods in {city} ranked by opportunity. Explain WHY each neighbourhood for this specific business — demographics, density, demand.]",
  "platform": "🌍 YOUR LOCAL PLATFORMS & CHANNELS: Platform 1: [Name] → [exactly how to use it in {city}]. Platform 2: [Name] → [how to use]. Offline: [Exact physical locations to market in {city}]",
  "businessModel": "🏦 BUSINESS MODEL — FULL BREAKDOWN: What you sell: [specific product/service]. Who buys it: [exact customer profile in {city}]. Price: {cur}[X] per [unit]. Why locals pay this. Frequency. Cost: {cur}[X], Profit: {cur}[X]. Break-even point.",
  "steps": [
    "DAY 1: [Copy-paste ready action — what to post, where to post it, exact words to use]",
    "DAY 2-3: [Specific follow-up action in {city}]",
    "WEEK 1: [First customers — how to get them locally]",
    "MONTH 1: [First milestone — specific number]"
  ],
  "earnings": "💰 INCOME PROJECTION: Week 1: [X] * {cur}[y] = {cur}[total]. Month 1: {cur}[total] net profit. Month 3: {cur}[total] net profit. Month 12: {cur}[total] net profit after hiring scale.",
  "timeNeeded": "⏱️ TIME BREAKDOWN: [Not just hours — break it down like: 2 hrs production, 1 hr WhatsApp followups, 30 min posting in {city} groups]",
  "startNow": "🚀 START NOW — COPY PASTE THIS: [Give the EXACT message they post RIGHT NOW. Real group names to search. Real price. Real offer. Real call to action. Formatted and ready to send.]",
  "scaleTip": "🔁 SCALE TO FULL BUSINESS: Stage 1: Solo. Stage 2: Hire first person from {city} via [platform] at {cur}[salary]. Stage 4: Full operation team size & profit.",
  "localNote": "⚠️ {city} INSIDER INTELLIGENCE: 1) [Local demand pattern]. 2) [Local competition weakness]. 3) [Local registration/legal thing specific to {country}]"
}}"""


def _generate_with_bytez(profile, used_titles, country_info, city_info, idea_count):
    """Engine 1: Claude Opus 4.5 via Bytez HTTP API."""
    if not bytez_api_key:
        return None

    prompt = build_prompt(profile, used_titles, country_info, city_info, idea_count)
    try:
        print(f'  🧠 Claude Opus 4.5 generating idea #{idea_count}...')
        resp = requests.post(
            'https://api.bytez.com/models/anthropic/claude-opus-4-5/run',
            headers={'Authorization': f'Bearer {bytez_api_key}', 'Content-Type': 'application/json'},
            json={'messages': [{'role': 'user', 'content': prompt}]},
            timeout=60
        )
        if resp.status_code != 200:
            print(f'  ⚠️  Bytez HTTP {resp.status_code}')
            return None
        data = resp.json()
        text = ''
        output = data.get('output', data)
        if isinstance(output, str):
            text = output
        elif isinstance(output, dict):
            msg = output.get('message', output)
            content = msg.get('content', '') if isinstance(msg, dict) else str(msg)
            if isinstance(content, list):
                text = ''.join(c.get('text', '') for c in content if isinstance(c, dict))
            else:
                text = str(content)
        return _parse_ai_response(text, 'claude')
    except Exception as e:
        print(f'  ⚠️  Bytez/Claude failed: {e}')
        return None





def _parse_ai_response(text, source):
    """Parse AI response JSON."""
    import re
    cleaned = (text or '').strip()
    if cleaned.startswith('```'):
        cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
        cleaned = re.sub(r'\n?```\s*$', '', cleaned)
    
    match = re.search(r'\{[\s\S]*\}', cleaned)
    if match:
        cleaned = match.group(0)

    try:
        parsed = json.loads(cleaned)
        if not parsed.get('title') or not parsed.get('steps'):
            print(f'  ⚠️  {source} returned incomplete idea')
            return None
        return {'parsed': parsed, 'source': source}
    except json.JSONDecodeError as e:
        print(f'  ⚠️  {source} JSON parse failed: {e}')
        return None


async def generate_with_ai(profile, used_titles=None):
    """Main AI generator — Claude via Bytez."""
    used_titles = used_titles or []
    city = profile.get('city', 'your city')
    country = profile.get('country', 'India')
    country_info = get_country_data(country)
    city_info = get_city_data(city)
    idea_count = len(used_titles) + 1
    cur = get_currency(country)

    # Use Claude
    result = _generate_with_bytez(profile, used_titles, country_info, city_info, idea_count)
    if not result:
        return None

    parsed = result['parsed']
    source = result['source']
    now = datetime.now()
    day_names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']
    day_date = f"{day_names[now.weekday()]}, {month_names[now.month-1]} {now.day}, {now.year}"
    user_skills = [s.strip() for s in (profile.get('skills', '') or '').split(',') if s.strip()]

    earnings_str = parsed.get('weeklyEarnings', '')
    if parsed.get('weeklyCost'):
        earnings_str += f" {parsed.get('weeklyCost')}"

    steps = parsed.get('steps', [])

    source_label = 'Claude Opus 4.5'
    print(f'  ✅ {source_label} generated: "{parsed.get("title", "")}"')

    return {
        'id': str(uuid.uuid4()),
        'userId': profile.get('id', ''),
        'title': (parsed.get('title', '') or '').upper(),
        'targetLocation': parsed.get('targetLocation', ''),
        'platform': parsed.get('platform', ''),
        'businessModel': parsed.get('businessModel', ''),
        'steps': json.dumps(steps),
        'earnings': parsed.get('earnings', ''),
        'timeNeeded': parsed.get('timeNeeded', f"{profile.get('hours', 2)} hours/day"),
        'startNow': parsed.get('startNow', ''),
        'scaleTip': parsed.get('scaleTip', ''),
        'category': parsed.get('category', 'General'),
        'aiInsight': f"🧠 {source_label}-powered idea #{idea_count} for {city}, {country} — using real local platforms, {cur} pricing, and city-level intelligence based on your {', '.join(user_skills[:3])} skills.",
        'bonusTip': '',
        'localNote': parsed.get('localNote', ''),
        'cityTag': city,
        'generatedDate': day_date,
    }


async def check_health():
    """Check health of AI engines."""
    status = {'bytez': 'disabled'}

    if bytez_api_key:
        try:
            resp = requests.post(
                'https://api.bytez.com/models/anthropic/claude-opus-4-5/run',
                headers={'Authorization': f'Bearer {bytez_api_key}', 'Content-Type': 'application/json'},
                json={'messages': [{'role': 'user', 'content': 'Say "ok" and nothing else.'}]},
                timeout=15
            )
            status['bytez'] = 'healthy' if resp.status_code == 200 else f'error: HTTP {resp.status_code}'
        except Exception as e:
            status['bytez'] = f'error: {e}'

    return status
