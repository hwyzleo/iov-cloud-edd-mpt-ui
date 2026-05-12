pipeline {
    agent any

    environment {
        PROJECT_NAME = "${env.JOB_NAME}"
        IMAGE_NAME   = "${env.REGISTRY_URL}/${PROJECT_NAME}:${env.BUILD_NUMBER}"

        // 核心：限制 Node 构建时的内存占用，防止服务器崩溃（根据你服务器配置，1024或2048）
        NODE_OPTIONS = "--max-old-space-size=4096"

        // 禁用 npm 审计和资金提示，减少日志和内存消耗
        NPM_CONFIG_AUDIT = "false"
        NPM_CONFIG_FUND  = "false"
    }

    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('安装依赖') {
            steps {
                sh '''
                    echo '============================== 安装依赖 =============================='
                    # 使用 legacy-peer-deps 解决 Vue2/3 常见的依赖冲突
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('构建项目') {
            steps {
                sh '''
                    echo '============================== 构建项目 =============================='
                    npm run build:prod
                '''
            }
        }

        stage('构建镜像') {
            steps {
                sh '''
                    echo '============================== 构建镜像 =============================='
                    # 移除 --no-cache 以节省资源；如果 DockerfileVue 在上层目录请保留 ../
                    docker build --network appnet -t ${IMAGE_NAME} -f ../DockerfileVue .
                '''
            }
        }

        stage('上传镜像') {
            steps {
                sh '''
                    echo '============================== 上传镜像 =============================='
                    docker push ${IMAGE_NAME}
                '''
            }
        }

        stage('运行镜像') {
            steps {
                sh '''
                    echo '============================== 运行镜像 =============================='
                    # 停止并删除旧容器，使用 || true 防止因为容器不存在而报错
                    docker stop ${PROJECT_NAME} || true
                    docker rm ${PROJECT_NAME} || true

                    docker pull ${IMAGE_NAME}

                    # 限制运行时的内存，保证系统稳定
                    docker run -d \
                        --name ${PROJECT_NAME} \
                        --network appnet \
                        --memory 128m \
                        --memory-reservation 64m \
                        ${IMAGE_NAME}

                    sleep 5
                    docker logs --tail 50 ${PROJECT_NAME}
                '''
            }
        }
    }

    post {
        success {
            echo '部署成功！'
        }
        failure {
            echo '部署失败，请检查上方日志。'
        }
        always {
            // 构建完成后清理 Workspace，防止多次构建后磁盘爆满
            cleanWs()
        }
    }
}
