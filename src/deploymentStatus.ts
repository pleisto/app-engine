import * as core from '@actions/core'
import * as github from '@actions/github'

export async function setDeploymentStatus(
  state: 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success',
  deployment_id: number
) {
  try {
    const ghContext = github.context
    const token = core.getInput('token')
    const name = core.getInput('name')
    const isService = core.getInput('type') === 'service'
    const serviceUrl = `github.com/${ghContext.repo.owner}/${ghContext.repo.repo}/commit/${ghContext.sha}/checks`

    const client = github.getOctokit(token)
    await client.rest.repos.createDeploymentStatus({
      ...ghContext.repo,
      deployment_id,
      state,
      log_url: isService ? serviceUrl : `https://${ingressHost()}`,
      mediaType: {
        previews: ['flash', 'ant-man']
      }
    })

    if (!isService && state === 'success' && !!ghContext.payload.pull_request?.number) {
      await client.rest.issues.createComment({
        ...ghContext.repo,
        issue_number: ghContext.payload.pull_request.number,
        body: `This Pull Request can be previewed on [Brickdoc App Engine](https://${ingressHost()})`
      })
    }
  } catch (e) {
    core.warning(`Failed to set deployment status: ${e.message}`)
  }
}

export function ingressHost(): string {
  const name = core.getInput('name')
  const host = core.getInput('host')
  return host || `${name}.${process.env.BAE_DOMAIN}`
}

export async function createDeployment(): Promise<any> {
  try {
    const ghContext = github.context
    const token = core.getInput('token')
    const name = core.getInput('name')
    const client = github.getOctokit(token)
    const { data } = await client.rest.repos.createDeployment({
      ...ghContext.repo,
      ref: ghContext.ref,
      environment: name,
      task: 'deply:app-engine',
      transient_environment: ghContext.eventName === 'pull_request',
      production_environment: ghContext.eventName === 'release',
      mediaType: {
        previews: ['flash', 'ant-man']
      }
    })
    return data
  } catch (e) {
    core.warning(`Failed to set deployment status: ${e.message}`)
  }
}
