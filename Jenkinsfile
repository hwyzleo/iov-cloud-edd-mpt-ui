pipeline {
   agent any

   environment {
       PROJECT_NAME = "${env.JOB_NAME}"
       IMAGE_NAME = "${env.REGISTRY_URL}/${PROJECT_NAME}:${env.BUILD_NUMBER}"
   }

   tools {
       nodejs 'NodeJS'
   }

   stages {
       stage('安装依赖') {
           steps {
               script {
                   sh '''
                       echo '============================== 安装依赖 =============================='
                       npm install
                   '''
               }
           }
       }
       stage('构建项目') {
           steps {
               script {
                   sh '''
                       echo '============================== 构建项目 =============================='
                       npm run build:prod
                   '''
               }
           }
       }
       stage('构建镜像') {
           steps {
               script {
                   sh '''
                       echo '============================== 构建镜像 =============================='
                       docker build --network appnet --no-cache -t ${IMAGE_NAME} -f ../DockerfileVue .
                   '''
               }
           }
       }
       stage('上传镜像') {
           steps {
               script {
                   sh '''
                       echo '============================== 上传镜像 =============================='
                       docker push ${IMAGE_NAME}
                   '''
               }
           }
       }

       stage('运行镜像') {
          steps {
              script {
                  sh '''
                      echo '============================== 运行镜像 =============================='
                      if [ -n \"\$(docker ps -q -f name=${PROJECT_NAME})" ]; then
                          docker stop ${PROJECT_NAME}
                      fi
                      if [ -n \"\$(docker ps -aq -f name=${PROJECT_NAME})" ]; then
                          docker rm ${PROJECT_NAME}
                      fi
                      docker pull ${IMAGE_NAME}
                      docker run -d --name ${PROJECT_NAME} --network appnet --memory 100m --memory-reservation 50m ${IMAGE_NAME}
                      sleep 10
                      docker logs ${PROJECT_NAME}
                  '''
              }
          }
      }
   }
}
