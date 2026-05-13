#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const [platform, arch] = process.argv.slice(2)

if (!platform || !arch) {
  console.error('Usage: node scripts/prepare-platform-native-deps.js <platform> <arch>')
  process.exit(1)
}

const repoRoot = path.resolve(__dirname, '..')

function readPackageJson(packagePathParts) {
  const packageJsonPath = path.join(repoRoot, 'node_modules', ...packagePathParts, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Missing ${packageJsonPath}. Run npm install first.`)
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
}

function installPackageTarball(packageName, version) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-deps-'))
  const destinationDir = path.join(repoRoot, 'node_modules', ...packageName.split('/'))

  try {
    console.log(`Preparing ${packageName}@${version}`)

    const tarballName = execFileSync('npm', ['pack', `${packageName}@${version}`, '--silent'], {
      cwd: tempDir,
      encoding: 'utf8'
    }).trim().split('\n').pop()

    if (!tarballName) {
      throw new Error(`Failed to download tarball for ${packageName}@${version}`)
    }

    execFileSync('tar', ['-xzf', tarballName], {
      cwd: tempDir,
      stdio: 'inherit'
    })

    const extractedDir = path.join(tempDir, 'package')
    if (!fs.existsSync(extractedDir)) {
      throw new Error(`Extracted package directory missing for ${packageName}`)
    }

    fs.rmSync(destinationDir, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(destinationDir), { recursive: true })
    fs.cpSync(extractedDir, destinationDir, { recursive: true })

    console.log(`Installed ${packageName} into ${path.relative(repoRoot, destinationDir)}`)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function resolveTargetPackages(targetPlatform, targetArch) {
  if (targetPlatform === 'win32') {
    return [
      { packagePathParts: ['@parcel', 'watcher'], packageName: `@parcel/watcher-win32-${targetArch}` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-win32-${targetArch}` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-libvips-win32-${targetArch}` }
    ]
  }

  if (targetPlatform === 'darwin') {
    return [
      { packagePathParts: ['@parcel', 'watcher'], packageName: `@parcel/watcher-darwin-${targetArch}` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-darwin-${targetArch}` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-libvips-darwin-${targetArch}` }
    ]
  }

  if (targetPlatform === 'linux') {
    return [
      { packagePathParts: ['@parcel', 'watcher'], packageName: `@parcel/watcher-linux-${targetArch}-glibc` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-linux-${targetArch}` },
      { packagePathParts: ['sharp'], packageName: `@img/sharp-libvips-linux-${targetArch}` }
    ]
  }

  throw new Error(`Unsupported target platform: ${targetPlatform}`)
}

for (const target of resolveTargetPackages(platform, arch)) {
  const packageJson = readPackageJson(target.packagePathParts)
  const version = packageJson.optionalDependencies?.[target.packageName] || packageJson.devDependencies?.[target.packageName]

  if (!version) {
    throw new Error(`No optional dependency mapping found for ${target.packageName}`)
  }

  installPackageTarball(target.packageName, version)
}
