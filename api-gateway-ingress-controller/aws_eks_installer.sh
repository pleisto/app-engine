#!/usr/bin/env bash

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update


helm upgrade --install nginx-ingress ingress-nginx/ingress-nginx -f ./value.yaml --namespace kube-system
kubectl delete validatingwebhookconfigurations nginx-ingress-ingress-nginx-admission