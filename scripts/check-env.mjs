import { execSync } from 'node:child_process';

const MIN_NODE_MAJOR = 22;

function getMajor(version) {
  return Number(version.split('.')[0]);
}

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const failures = [];

const nodeVersion = process.version.replace(/^v/, '');
console.log(`node : ${nodeVersion}`);
if (getMajor(nodeVersion) < MIN_NODE_MAJOR) {
  failures.push(`Node.js >= ${MIN_NODE_MAJOR} diperlukan`);
}

const npmVersion = runCommand('npm --version');
console.log(`npm : ${npmVersion ?? 'tidak ditemukan'}`);
if (!npmVersion || getMajor(npmVersion) < 11) failures.push('npm >= 11 diperlukan');

const phpVersion = runCommand('php -r "echo PHP_VERSION;"');
console.log(`php : ${phpVersion ?? 'tidak ditemukan'}`);
if (!phpVersion || Number(phpVersion.split('.')[0]) < 8 || (getMajor(phpVersion) === 8 && Number(phpVersion.split('.')[1]) < 3)) failures.push('PHP >= 8.3 diperlukan');

const composerVersion = runCommand('composer --version --no-ansi');
console.log(`composer : ${composerVersion ?? 'tidak ditemukan'}`);
if (!composerVersion?.match(/Composer version 2\./)) failures.push('Composer 2 diperlukan');

if (failures.length > 0) {
  console.error(failures.map((f) => `- ${f}`).join('\n'));
  process.exit(1);
}

console.log('environment siap');
