/**
 * Cross-platform Python runner.
 * Resolves the correct venv Python binary on Windows and Unix/macOS,
 * then forwards all arguments to it.
 *
 * Windows: credit-intelligence-service/venv/Scripts/python.exe
 * Unix:    credit-intelligence-service/venv/bin/python
 */

const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const pythonBin = isWin
  ? path.join('venv', 'Scripts', 'python.exe')
  : path.join('venv', 'bin', 'python');

const serviceDir = path.join(__dirname, '..', 'credit-intelligence-service');
const args = process.argv.slice(2);

const child = spawn(pythonBin, args, {
  cwd: serviceDir,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
