pipeline {
    agent any

    environment {
        SONARQUBE_ENV = 'SonarQube'            
        SONAR_HOST_URL = 'http://sonarqube.imcc.com/'
        NEXUS_REPO = 'http://nexus.imcc.com/repository/2401166_Elderly_Personal_Assistance'
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
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=elderly-personal-assistance \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_AUTH_TOKEN}
                    """
                }
            }
        }

        stage('Build & Push Backend') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh """
                        docker build -t ${DOCKER_IMAGE_BACKEND} ./backend
                        echo $NEXUS_PASS | docker login -u $NEXUS_USER --password-stdin nexus.imcc.com
                        docker push ${DOCKER_IMAGE_BACKEND}
                    """
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh """
                        docker build -t ${DOCKER_IMAGE_FRONTEND} ./frontend
                        docker push ${DOCKER_IMAGE_FRONTEND}
                    """
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
