# ShelfShare â€” Community Resource Sharing Platform

## Project Structure
- \rontend/\ : Vite + React user interface (Explore, Resources, Chat, Orders, Razorpay, Profile)
- \ackend/\  : Node.js Express REST API server with MongoDB integration & Gmail SMTP

## Quick Start Instructions

### 1. MongoDB Setup
Ensure MongoDB is running locally on port 27017:
\\\ash
# On WSL Kali Linux / Ubuntu:
wsl -u root -d kali-linux mongod --bind_ip_all --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb
\\\

### 2. Run Backend Server
\\\ash
cd backend
npm install
node server.js
\\\
Backend API will be running on: http://localhost:5001

### 3. Run Frontend Application
\\\ash
cd frontend
npm install
npm run dev
\\\
Frontend App will be running on: http://localhost:5173
