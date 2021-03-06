import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import { setDeploymentStatus, ingressHost } from './deploymentStatus'
import { createValuesFile, valuesFile } from './env'
import { updateKubeconfig } from './eks'

async function runAppEngine(): Promise<void> {
  try {
    await setDeploymentStatus('pending')

    const namespace = core.getInput('namespace')
    const name = core.getInput('name')
    const task = core.getInput('task')

    // update kubeconfig via aws-cli
    await updateKubeconfig()

    if (task === 'remove') {
      await exec.exec('helm', ['uninstall', name, '-n', namespace], {
        ignoreReturnCode: true
      })
      await setDeploymentStatus('inactive')
      return
    } else if (task === 'deploy') {
      // init
      const type = core.getInput('type')
      const chart = core.getInput('chart')
      const containerPort = core.getInput('containerPort')
      const extraArgs = core.getInput('extraArgs')
      let image = core.getInput('image')

      if (!image) {
        const ghContext = github.context
        image = `ghcr.io/${ghContext.repo.owner}/${name}:latest`
      }

      // create helm values file
      createValuesFile({
        type,
        containerPort,
        image: {
          name: image
        },
        ingress: {
          enabled: type === 'web',
          host: ingressHost()
        }
      })

      // generate args
      const args = ['upgrade', '--install', '--atomic', '--wait', `--namespace=${namespace}`, `--values=${valuesFile}`, name, chart]
      if (extraArgs) args.push(...extraArgs.split(' '))

      // execute helm upgrate --install
      await exec.exec('helm', args)
      await setDeploymentStatus('success')
    } else {
      throw new Error('Task not found')
    }
  } catch (e) {
    core.setFailed((e as Error).message)
  }
}

runAppEngine()
