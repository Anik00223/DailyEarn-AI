# Deployment Guide: Vercel (Frontend) + Render (Backend)

## Project Structure
- **Frontend (Vercel)**: Static files in `public/` folder (HTML, CSS, JS)
- **Backend (Render)**: Flask API serving from `app.py`
- **Database**: SQLite (will be stored on Render's persistent disk)

---

## STEP 1: Prepare GitHub Repository

```bash
# Initialize Git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
```

Push to GitHub (create a new repo on github.com first):
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## STEP 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) → Sign up (GitHub recommended)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Fill in these settings:
   - **Name**: `idea-generator-api` (or any name)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --workers 3 --worker-class sync --timeout 60 app:app`
   - **Plan**: Free (or Paid)

5. **Add Environment Variables** (click "Advanced"):
   ```
   FLASK_ENV = production
   FLASK_SECRET_KEY = (generate random string)
   JWT_SECRET = (generate random string)
   GOOGLE_API_KEY = (your Google API key)
   ANTHROPIC_API_KEY = (your Anthropic API key)
   ```

6. Click **Create Web Service** and wait for deployment

**Get your Render URL**: Once deployed, you'll see something like:
```
https://idea-generator-api-xxxxx.onrender.com
```

---

## STEP 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up (GitHub recommended)
2. Click **New Project** → Import your GitHub repo
3. Configure project:
   - **Framework**: "Other" (it's static HTML)
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm install`
   - **Output Directory**: `public`

4. **Add Environment Variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://idea-generator-api-xxxxx.onrender.com` (your Render URL from Step 2)

5. Click **Deploy**

**Get your Vercel URL**: After deployment:
```
https://your-project-name.vercel.app
```

---

## STEP 4: Update CORS on Render Backend

After getting your **Vercel URL**, update [app.py](app.py#L31):

If you update `app.py`, the Render service will auto-redeploy:
```bash
git add app.py
git commit -m "Update CORS for Vercel domain"
git push
```

OR manually update in Render dashboard → Environment variables.

---

## STEP 5: Test the Deployment

1. Open your **Vercel URL** in a browser
2. Try creating an account/generating ideas
3. Check browser DevTools Console for any errors
4. Check Render dashboard → Logs for backend errors

---

## Troubleshooting

### Frontend can't reach API
- Check that `VITE_API_URL` is set correctly in Vercel
- Check CORS settings in [app.py](app.py#L31) includes your Vercel domain
- Open DevTools → Network tab to see the API requests

### Render says "Service Failed"
- Check logs: Render dashboard → Logs
- Make sure `requirements.txt` has all dependencies
- Verify environment variables are set

### Database not persisting
- Render free tier has ephemeral storage - data is lost on redeploy
- Upgrade to Paid tier OR use [Render PostgreSQL add-on](https://render.com/docs/databases)

### Import errors
- Make sure all imports in Python files are in `requirements.txt`
- Run locally first: `pip install -r requirements.txt`

---

## Local Testing Before Deployment

Test everything locally first:

```bash
# Install dependencies
pip install -r requirements.txt
npm install

# Run backend
python app.py

# In another terminal, run frontend (if using npm server)
npm start
```

Access at `http://localhost:5000`

---

## Environment Variables Needed

See [.env.example](.env.example) for all required variables:
- `FLASK_SECRET_KEY` - Random secret for session encryption
- `JWT_SECRET` - Random secret for JWT tokens
- `GOOGLE_API_KEY` - Your Google Generative AI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key

Generate secrets with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Useful Links
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Flask Deployment](https://flask.palletsprojects.com/en/latest/deploying/)
- [CORS in Flask](https://flask-cors.readthedocs.io/)
