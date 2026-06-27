const { execSync } = require('child_process');

const port = process.env.PORT || 5001;

const freePort = () => {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = [
        ...new Set(
          output
            .split('\n')
            .map((line) => line.trim().split(/\s+/).pop())
            .filter((pid) => /^\d+$/.test(pid) && pid !== '0')
        )
      ];

      pids.forEach((pid) => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Freed port ${port} (stopped PID ${pid})`);
        } catch {
          // Process may have already exited.
        }
      });
      return;
    }

    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore', shell: true });
  } catch {
    // Port is already free.
  }
};

freePort();
