pipeline {
    agent {
        kubernetes {
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
              containers:
              - name: docker
                image: public.ecr.aws/docker/library/docker:dind
                securityContext:
                  privileged: true
                command:
                - dockerd-entrypoint.sh
                tty: true

              - name: sonar
                image: sonarsource/sonar-scanner-cli:latest
                command:
                - cat
                tty: true
            """
        }
    }

    environment {
        SONARQUBE_ENV = 'sonarqube'
        NEXUS_REPO = 'nexus.imcc.com/repository/2401166_Elderly_Personal_Assistance'
        DOCKER_IMAGE_BACKEND = "${NEXUS_REPO}/backend:latest"
        DOCKER_IMAGE_FRONTEND = "${NEXUS_REPO}/frontend:latest"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github_2401166-token',
                    url: 'https://github.com/atharva3718/Elderly_Personal_Assistance.git'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar') {
                    withSonarQubeEnv("${SONARQUBE_ENV}") {
                        sh """
                            sonar-scanner \
                            -Dsonar.projectKey=elderly-personal-assistance \
                            -Dsonar.sources=. \
                            -Dsonar.java.binaries=target/ \
                            -Dsonar.host.url=http://sonarqube.sonarqube.svc.cluster.local:9000 \
                            -Dsonar.login=$SONARQUBE_ENV
                        """
                    }
                }
            }
        }

        stage('Build & Push Backend') {
            steps {
                container('docker') {
                    script {
                        sh "docker build -t ${DOCKER_IMAGE_BACKEND} ./backend"
                        withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                            sh "echo $NEXUS_PASS | docker login -u $NEXUS_USER --password-stdin nexus.imcc.com"
                            sh "docker push ${DOCKER_IMAGE_BACKEND}"
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                container('docker') {
                    script {
                        sh "docker build -t ${DOCKER_IMAGE_FRONTEND} ./frontend"
                        withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                            sh "docker push ${DOCKER_IMAGE_FRONTEND}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                container('docker') {
                    sh "docker rmi ${DOCKER_IMAGE_BACKEND} || true"
                    sh "docker rmi ${DOCKER_IMAGE_FRONTEND} || true"
                    sh "docker logout nexus.imcc.com || true"
                }
            }
        }
    }
}
