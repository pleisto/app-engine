# Brickdoc App Engine

> This is an **internal project** of Brickdoc LTD and all APIs are subject to change without notice.
> **Not recommended** for production use for **external users**.

Brickdoc App Engine is a MicroPaaS based on kubernetes, inspired by [rancher/rio](https://github.com/rancher/rio).
It is designed to reduce the workload for developers deploying **lightweight applications** in kubernetes.

## Philosophy

- Git as a single source of truth
- Continuous Deployment with [Github Actions](https://github.com/features/actions)
- Convention over Configuration
- [Optimize for programmer happiness](https://rubyonrails.org/doctrine/#optimize-for-programmer-happiness)

## Quick Start

```yaml
name: example-github-actions-workflow

on:
  push:
    branches:
      - 'master'
      - 'main'
env:
  appName: example
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      - name: Cache Docker layers
        uses: actions/cache@v2
        with:
          path: /tmp/.buildx-cache
          key: ${{ env.appName }}-${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ env.appName }}-${{ runner.os }}-buildx-
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: orgs/${{ env.appName }}:${{ github.sha }}
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new
        # Temp fix
        # https://github.com/docker/build-push-action/issues/252
        # https://github.com/moby/buildkit/issues/1896
      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache
      - name: Deployment to BAE
        uses: brickdoc/app-engine@v1
        with:
          name: example-prod
          containerPort: 8000
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.awsAccessKey }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.awsAccessSecret }}
          APP_ENV_NODE_ENV: production
          APP_SECRET_MASTER_KEY: ${{ secrets.SuperSecret }}
```

## Advanced

### Supported kubernetes distribution

- [Amazon EKS](https://aws.amazon.com/cn/eks/)

### Environment Variables

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_DEFAULT_REGION
- AWS_EKS_CLUSTER
- `APP_ENV_*`
- `APP_SECRET_*`

### Inputs

| Name            | Type                    | Description                                                                    |
| --------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `type`          | `"web" or "service"`    | **Required**. App type. default value is `"web"`                               |
| `name`          | String                  | **Required**. App name.                                                        |
| `namespace`     | String                  | **Required**. kubernetes namespace. default value is "cicd"                    |
| `image`         | String                  | Docker image with tag. defualt value is `ghcr.io/${github-org}/${name}:latest` |
| `host`          | String                  | Website ingress host. default value is `${name}.${ENV.BAE_DOMAIN}`             |
| `chart`         | String                  | Helm charts. default value is `/charts/bae-simple-web`                         |
| `containerPort` | String                  | Container server port. default value is `"3000"`                               |
| `dryRun`        | Boolean                 | Helm dry-run option. default value is `false`                                  |
| `task`          | `"publish" or "remove"` | Helm action. default value is `"publish"`                                      |

## License

Copyight (c) 2021 Brickdoc (Ningbo) Cloud Computing Technology LTD

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
