FROM node:slim
ARG HELM_VERSION=3.6.3
ARG AWS_EKS_PATH=1.20.4/2021-04-12

ENV AWS_DEFAULT_REGION=us-east-1
ENV AWS_EKS_CLUSTER=global-corp-kube
ENV BAE_DOMAIN=brickdoc.app

RUN apt-get update && apt-get install -y curl unzip && \
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
  unzip awscliv2.zip && ./aws/install && \
  curl https://amazon-eks.s3.us-west-2.amazonaws.com/${AWS_EKS_PATH}/bin/linux/amd64/kubectl -o kubectl && \
  mv kubectl /usr/local/bin/kubectl && \
  chmod +x /usr/local/bin/kubectl && \
  curl -sL https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz | tar -xvz && \
  mv linux-amd64/helm /usr/bin/helm && \
  chmod +x /usr/bin/helm && \
  apt-get purge  -y curl unzip &&  apt-get autoremove -y  && apt-get clean && \
  rm -rf ./awscliv2.zip ./aws ./linux-amd64 /var/lib/apt/lists/*

COPY ./dist/index.js  /usr/local/index.js
COPY ./charts /usr/local/charts
ENTRYPOINT ["node", "/usr/local/index.js"]