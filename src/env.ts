import { stringify } from 'yaml'
import { writeFileSync } from 'fs'
import * as core from '@actions/core'

function getVarsFromEnv(prefix: string) {
  return Object.keys(process.env).reduce((acc: NodeJS.Dict<string>, key) => {
    // filter env variables by prefix
    if (!key.startsWith(prefix)) return acc

    // remove prefix from filtered key
    const newKey = key.replace(prefix, '')
    acc[newKey] = process.env[key]
    return acc
  }, {})
}

export const valuesFile = './values.yaml'

export function createValuesFile(otherVars = {}) {
  const payload = stringify({
    envs: getVarsFromEnv('APP_ENV_'),
    secrets: getVarsFromEnv('APP_SECRET_'),
    ...otherVars
  })
  core.debug(`helm values is:\n${payload}`)
  writeFileSync(valuesFile, payload)
}
