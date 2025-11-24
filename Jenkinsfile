pipeline {
    agent any

    environment {
        SONARQUBE_ENV = 'SonarQube'            // SonarQube Server name configured in Jenkins
        NEXUS_REPO = 'nexus.imcc.com/repository/2401166_Elderly_Personal_Assistance'
        DOCKER_IMAGE_BACKEND = "${NEXUS_REPO}/backend:latest"
        DOCKER_IMAGE_FRONTEND = "${NEXUS_REPO}/frontend:latest"
    }

    stages {
        
        stage('Checkout Code') {
            steps {
                git credentialsId: 'github-token', url: 'https://github.com/YourRepo/EPA.git'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=elderly-personal-assistance \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=$SONAR_HOST_URL
                    """
                }
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND} ./backend"

                    withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh "echo $NEXUS_PASS | docker login -u $NEXUS_USER --password-stdin nexus.imcc.com"
                        sh "docker push ${DOCKER_IMAGE_BACKEND}"
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE_FRONTEND} ./frontend"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}"
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${DOCKER_IMAGE_BACKEND} || true"
            sh "docker rmi ${DOCKER_IMAGE_FRONTEND} || true"
            sh "docker logout nexus.imcc.com || true"
        }
    }
}
