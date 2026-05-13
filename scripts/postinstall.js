const { spawnSync } = require('node:child_process');
const path = require('node:path');

function runNodeScript(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNativeInstall() {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(command, ['exec', 'electron-builder', 'install-app-deps'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.warn('[postinstall] Failed to launch native dependency rebuild:', result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runElectronInstall() {
  let installScript;
  try {
    installScript = require.resolve('electron/install.js');
  } catch (error) {
    console.warn('[postinstall] Skipping Electron binary install:', error.message);
    return;
  }

  const result = spawnSync(process.execPath, [installScript], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNodeScript('download-wasm.js');
runElectronInstall();

if (/^(1|true)$/i.test(process.env.ADNIFY_INSTALL_NATIVE_DEPS || '')) {
  console.log('[postinstall] ADNIFY_INSTALL_NATIVE_DEPS is enabled; rebuilding Electron native dependencies.');
  runNativeInstall();
} else {
  console.log(
    '[postinstall] Skipping Electron native dependency rebuild during install. ' +
      'Run `pnpm run install:native-deps` when you need Electron runtime native modules.'
  );
}
