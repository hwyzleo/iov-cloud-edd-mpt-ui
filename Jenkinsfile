pipeline {
  agent any

  environment {
    PROJECT_NAME = "${env.JOB_NAME}"
    IMAGE_NAME   = "${env.REGISTRY_URL}/${PROJECT_NAME}:${env.BUILD_NUMBER}"

    // 可选：国内更稳（按你实际情况保留/删除）
    // NPM_CONFIG_REGISTRY = "https://registry.npmmirror.com"

    // 关闭 audit/fund，减少时间与输出（省资源）
    NPM_CONFIG_AUDIT = "false"
    NPM_CONFIG_FUND  = "false"
  }

  stages {

    stage('安装依赖 + 构建项目(临时容器)') {
      steps {
        sh '''
          set -e

          echo '============================== 安装依赖 + 构建项目(临时容器) =============================='
          echo "WORKSPACE=$WORKSPACE"

          # 用临时 Node 容器执行：npm ci + build
          # -v "$WORKSPACE:/work"：源码/产物都落回 Jenkins workspace
          # -v "$HOME/.npm:/root/.npm"：复用 npm cache，极大节省时间/IO（HOME 在 Jenkins 容器内通常是 /var/jenkins_home）
          docker run --rm \
            --network appnet \
            --memory 3g \
            --memory-swap 4g \
            -e NODE_OPTIONS="--max-old-space-size=2048" \
            -e NPM_CONFIG_AUDIT="$NPM_CONFIG_AUDIT" \
            -e NPM_CONFIG_FUND="$NPM_CONFIG_FUND" \
            ${NPM_CONFIG_REGISTRY:+-e NPM_CONFIG_REGISTRY="$NPM_CONFIG_REGISTRY"} \
            -v "$WORKSPACE:/work" \
            -v "$HOME/.npm:/root/.npm" \
            -w /work \
            node:16-bullseye bash -lc '
              set -e
              node -v
              npm -v

              echo "[info] npm cache dir: $(npm config get cache)"

              # 心跳：避免 Jenkins durable-task 误判脚本“没触碰日志文件”
              ( while sleep 30; do echo "[heartbeat] $(date)"; done ) &
              HB_PID=$!

              # 建议用 ci：更快更可复现；老 Vue 依赖链加 legacy-peer-deps 更稳
              if [ -f package-lock.json ]; then
                npm ci --legacy-peer-deps
              else
                npm install --legacy-peer-deps
              fi

              npm run build:prod

              kill $HB_PID || true
            '
        '''
      }
    }

    stage('构建镜像') {
      steps {
        sh '''
          set -e
          echo '============================== 构建镜像 =============================='

          # 强烈建议去掉 --no-cache（非常费 CPU/IO/磁盘）
          docker build --network appnet -t ${IMAGE_NAME} -f ../DockerfileVue .
        '''
      }
    }

    stage('上传镜像') {
      steps {
        sh '''
          set -e
          echo '============================== 上传镜像 =============================='
          docker push ${IMAGE_NAME}
        '''
      }
    }

    stage('运行镜像') {
      steps {
        sh '''
          set -e
          echo '============================== 运行镜像 =============================='

          if [ -n "$(docker ps -q -f name=${PROJECT_NAME})" ]; then
            docker stop ${PROJECT_NAME}
          fi
          if [ -n "$(docker ps -aq -f name=${PROJECT_NAME})" ]; then
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
