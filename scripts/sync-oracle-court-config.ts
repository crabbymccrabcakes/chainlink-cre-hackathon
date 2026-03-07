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

const parseOptionalBoolean = (value) => {
  if (value === undefined) return undefined
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false
  throw new Error(`Invalid boolean env value: ${value}`)
}

const parseOptionalInteger = (value, label) => {
  if (value === undefined) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer env value for ${label}: ${value}`)
  }
  return parsed
}

const parseOptionalFloat = (value, label) => {
  if (value === undefined) return undefined
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number env value for ${label}: ${value}`)
  }
  return parsed
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

  if (generated.model) {
    const enabledOverride = parseOptionalBoolean(process.env.ORACLE_COURT_MODEL_ENABLED)
    const apiUrlOverride = process.env.ORACLE_COURT_MODEL_API_URL
    const modelOverride = process.env.ORACLE_COURT_MODEL_NAME
    const secretIdOverride = process.env.ORACLE_COURT_MODEL_SECRET_ID
    const secretNamespaceOverride = process.env.ORACLE_COURT_MODEL_SECRET_NAMESPACE
    const secretOwnerOverride = process.env.ORACLE_COURT_MODEL_SECRET_OWNER
    const maxOutputTokensOverride = parseOptionalInteger(
      process.env.ORACLE_COURT_MODEL_MAX_OUTPUT_TOKENS,
      'ORACLE_COURT_MODEL_MAX_OUTPUT_TOKENS',
    )
    const temperatureOverride = parseOptionalFloat(
      process.env.ORACLE_COURT_MODEL_TEMPERATURE,
      'ORACLE_COURT_MODEL_TEMPERATURE',
    )

    generated.model = {
      ...generated.model,
      ...(enabledOverride === undefined ? {} : { enabled: enabledOverride }),
      ...(apiUrlOverride ? { apiUrl: apiUrlOverride } : {}),
      ...(modelOverride ? { model: modelOverride } : {}),
      ...(secretIdOverride ? { apiKeySecretId: secretIdOverride } : {}),
      ...(secretNamespaceOverride ? { apiKeySecretNamespace: secretNamespaceOverride } : {}),
      ...(secretOwnerOverride ? { apiKeySecretOwner: secretOwnerOverride } : {}),
      ...(maxOutputTokensOverride === undefined
        ? {}
        : { maxOutputTokens: maxOutputTokensOverride }),
      ...(temperatureOverride === undefined ? {} : { temperature: temperatureOverride }),
    }
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
