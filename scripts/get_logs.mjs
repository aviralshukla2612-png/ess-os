import { execSync } from 'child_process';

try {
  const output = execSync('ssh -o StrictHostKeyChecking=no root@187.127.158.24 "cd /vps/ess-os && docker compose logs ess-os --tail=100"', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error("Failed to run command:");
  if (error.stdout) console.log("STDOUT:", error.stdout.toString());
  if (error.stderr) console.error("STDERR:", error.stderr.toString());
}
