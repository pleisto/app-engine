import * as core from '@actions/core'
import * as github from '@actions/github'

export async function setDeploymentStatus(state: 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success') {
  try {
    const ghContext = github.context
    const token = core.getInput('token')
    const name = core.getInput('name')
    const isService = core.getInput('type') === 'service'
    const serviceUrl = `https://github.com/${ghContext.repo.owner}/${ghContext.repo.repo}/commit/${ghContext.sha}/checks`
    if (!token || !ghContext.payload.deployment) {
      core.debug('not setting deployment status')
      return
    }
    const client = github.getOctokit(token)
    await client.rest.repos.createDeploymentStatus({
      ...ghContext.repo,
      deployment_id: ghContext.payload.deployment.id,
      state,
      log_url: serviceUrl,
      environment_url: isService ? serviceUrl : `https://${ingressHost()}`,
      environment: `bae-${name}` as any,
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
    core.warning(`Failed to set deployment status: ${(e as Error).message}`)
  }
}

export function ingressHost(): string {
  const name = core.getInput('name')
  const host = core.getInput('host')
  return host || `${name}.${process.env.BAE_DOMAIN}`
}
