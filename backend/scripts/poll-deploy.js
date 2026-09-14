const backendUrl = 'https://dailyearn-ai-1.onrender.com';
const targetCommit = 'beffc6a';

async function poll() {
  console.log(`Polling ${backendUrl}/api/health for commit ${targetCommit}...`);
  for (let i = 1; i <= 35; i++) {
    try {
      const res = await fetch(`${backendUrl}/api/health`);
      const data = await res.json();
      const shortCommit = (data.commit || '').substring(0, 7);
      console.log(`[${i}/35] Status: ${res.status}, Commit: ${shortCommit}, Uptime: ${Math.round(data.uptime)}s, DB: ${data.database}`);
      if (shortCommit.startsWith(targetCommit)) {
        console.log(`\n🎉 New commit ${shortCommit} is LIVE on Render!`);
        return;
      }
    } catch (err) {
      console.log(`[${i}/35] Healthcheck request error: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  console.error('Timed out waiting for Render deployment');
  process.exit(1);
}

poll();
