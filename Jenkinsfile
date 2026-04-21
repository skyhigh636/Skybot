pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        NPM_CONFIG_LOGLEVEL = 'warn'
    }
    
    stages {
        stage('Install Dependencies') { 
            steps {
                dir('src') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Build') {
            steps {
                dir('src') {
                    sh 'npm run build'
                }
            }
        }
        
        stage('Deploy to Render') {
            when {
                branch 'Discord.js-branch'
            }
            steps {
                sh '''
                    curl --request POST \\
                        --url https://api.render.com/deploy/srv-$RENDER_SERVICE_ID?key=$RENDER_DEPLOY_KEY \\
                        -w "\\nHTTP Status: %{http_code}\\n"
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            echo 'Build or deployment failed. Check logs above.'
        }
        success {
            echo 'Build and deployment completed successfully!'
        }
    }
}