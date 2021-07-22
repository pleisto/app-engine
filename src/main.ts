import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import { setDeploymentStatus, ingressHost, createDeployment } from './deploymentStatus'
import { createValuesFile, valuesFile } from './env'
import { updateKubeconfig } from './eks'

async function runAppEngine(): Promise<void> {
  try {
    const { id: deployment_id } = await createDeployment()

    await setDeploymentStatus('pending', deployment_id)

    const namespace = core.getInput('namespace')
    const name = core.getInput('name')
    const task = core.getInput('task')

    // update kubeconfig via aws-cli
    await updateKubeconfig()

    if (task === 'remove') {
      await exec.exec('helm', ['delete', '-n', namespace, name], {
        ignoreReturnCode: true
      })
      await setDeploymentStatus('inactive', deployment_id)
      return
    } else if (task === 'deploy') {
      // init
      const type = core.getInput('type')
      const chart = core.getInput('chart')
      const containerPort = core.getInput('containerPort')
      const dryRun = core.getInput('dry-run')
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
      if (dryRun) args.push('--dry-run')

      // execute helm upgrate --install
      await exec.exec('helm', args)
      await setDeploymentStatus('success', deployment_id)
    } else {
      throw new Error('Task not found')
    }
  } catch (e) {
    core.setFailed(e.message)
  }
}

runAppEngine()
