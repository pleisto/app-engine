import * as core from '@actions/core'
import * as github from '@actions/github'

export async function setDeploymentStatus(state: 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success') {
  try {
    const ghContext = github.context
    const deployment = ghContext.payload.deployment
    const token = core.getInput('token')
    const name = core.getInput('name')
    const isService = core.getInput('type') === 'service'
    const serviceUrl = `github.com/${ghContext.repo.owner}/${ghContext.repo.repo}/commit/${ghContext.sha}/checks`

    if (!token || !deployment) {
      core.debug('skip setting deploymebnt status')
      return
    }

    const client = github.getOctokit(token)
    await client.rest.repos.createDeploymentStatus({
      ...ghContext.repo,
      deployment_id: deployment.id,
      environment: name as any,
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
