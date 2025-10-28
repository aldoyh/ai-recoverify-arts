"""
Simple runner script for the backend server
"""

from app.main import app

if __name__ == '__main__':
    print("Starting AI Recoverify Arts Backend Server...")
    print("API available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("\nPress CTRL+C to stop the server\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
