// System monitor utility — reports process health for PM2 / load balancer checks

export function monitor() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: 'running',
    pid: process.pid,
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime),
    },
    memory: {
      rss: formatBytes(memUsage.rss),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsed: formatBytes(memUsage.heapUsed),
      external: formatBytes(memUsage.external),
      arrayBuffers: formatBytes(memUsage.arrayBuffers),
    },
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system,
    },
    node: {
      version: process.version,
      arch: process.arch,
      platform: process.platform,
    },
    env: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return hrs + 'h ' + mins + 'm ' + secs + 's';
  if (mins > 0) return mins + 'm ' + secs + 's';
  return secs + 's';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}