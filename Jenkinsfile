pipeline {
    agent any

    environment {
        PROJECT_NAME = "${env.JOB_NAME}"
        IMAGE_NAME = "${env.REGISTRY_URL}/${PROJECT_NAME}:${env.BUILD_NUMBER}"
        // 限制 Node.js 内存，防止撑爆 Jenkins 宿主机
        NODE_OPTIONS = "--max-old-space-size=2048"
    }

    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('环境清理') {
            steps {
                // 清理之前的构建残留，释放磁盘空间
                sh 'npm cache clean --force'
            }
        }

        stage('安装依赖') {
            steps {
                sh '''
                    echo '============================== 安装依赖 =============================='
                    # 使用 --legacy-peer-deps 减少依赖冲突计算，节省 CPU
                    # 使用 --no-audit 减少网络开销
                    npm install --legacy-peer-deps --no-audit --no-fund
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
                    # 去掉 --no-cache！缓存是你的好朋友，能极大减轻服务器 IO 压力
                    docker build --network appnet -t ${IMAGE_NAME} -f ../DockerfileVue .
                '''
            }
        }

        stage('上传镜像') {
            steps {
                sh "docker push ${IMAGE_NAME}"
            }
        }

        stage('运行镜像') {
            steps {
                sh '''
                    echo '============================== 运行镜像 =============================='
                    docker stop ${PROJECT_NAME} || true
                    docker rm ${PROJECT_NAME} || true
                    docker pull ${IMAGE_NAME}
                    docker run -d --name ${PROJECT_NAME} --network appnet --memory 128m --memory-reservation 64m ${IMAGE_NAME}
                    sleep 5
                    docker logs ${PROJECT_NAME}
                '''
            }
        }
    }

    post {
        always {
            // 构建完成后清理工作空间，防止硬盘爆满
            cleanWs()
        }
    }
}
