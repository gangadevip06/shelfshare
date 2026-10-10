@echo off
echo Starting MongoDB service in WSL Kali Linux...
wsl -u root -d kali-linux mongod --bind_ip_all --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb
echo.
echo MongoDB is now running on 127.0.0.1:27017!
pause
