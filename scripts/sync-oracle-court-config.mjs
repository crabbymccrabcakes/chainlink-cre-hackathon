import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const defaultDeploymentPath = 'contracts/deployments/sepolia-oracle-court-stack.json'
const defaultTemplatePath = 'src/workflows/oracle-court/config.template.json'
const defaultGeneratedPath = 'src/workflows/oracle-court/config.generated.json'

const resolveAddress = (deployment, envValue, fallbackPath) => {
  if (envValue) return envValue

  const byPath = fallbackPath
    .split('.')
    .reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), deployment)

  if (typeof byPath === 'string' && byPath.startsWith('0x') && byPath.length === 42) {
    return byPath
  }

  return null
}

export function syncOracleCourtConfig({
  projectRoot = process.cwd(),
  deploymentPath = defaultDeploymentPath,
  templatePath = defaultTemplatePath,
  generatedPath = defaultGeneratedPath,
} = {}) {
  const deploymentFile = path.resolve(projectRoot, deploymentPath)
  const templateFile = path.resolve(projectRoot, templatePath)
  const generatedFile = path.resolve(projectRoot, generatedPath)

  if (!fs.existsSync(templateFile)) {
    throw new Error(`Missing Oracle Court config template: ${templateFile}`)
  }

  const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'))
  const deployment = fs.existsSync(deploymentFile)
    ? JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
    : {}

  const receiverAddress = resolveAddress(
    deployment,
    process.env.ORACLE_COURT_RECEIVER,
    'receiver.address',
  )
  const vaultAddress = resolveAddress(deployment, process.env.ORACLE_COURT_VAULT, 'vault.address')

  if (!receiverAddress) {
    throw new Error(
      `Could not resolve receiver address. Set ORACLE_COURT_RECEIVER or deploy stack (${deploymentFile}).`,
    )
  }

  if (!vaultAddress) {
    throw new Error(
      `Could not resolve vault address. Set ORACLE_COURT_VAULT or deploy stack (${deploymentFile}).`,
    )
  }

  const generated = {
    ...template,
    receiverAddress,
    vaultAddress,
  }

  fs.mkdirSync(path.dirname(generatedFile), { recursive: true })
  fs.writeFileSync(generatedFile, `${JSON.stringify(generated, null, 2)}\n`, 'utf8')

  return {
    generatedFile,
    receiverAddress,
    vaultAddress,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = syncOracleCourtConfig()
  console.log(`Synced Oracle Court config: ${result.generatedFile}`)
  console.log(`receiverAddress=${result.receiverAddress}`)
  console.log(`vaultAddress=${result.vaultAddress}`)
}
