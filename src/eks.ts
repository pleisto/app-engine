import * as exec from '@actions/exec'
export async function updateKubeconfig(){
  const clusterName = process.env.AWS_EKS_CLUSTER
  if (clusterName){
    throw new Error('ENV AWS_EKS_CLUSTER is required')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await exec.exec('aws',['update-kubeconfig', '--name', clusterName!])
  }
}