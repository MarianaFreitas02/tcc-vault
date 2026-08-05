
#!/bin/bash
cd /home/mariana/tcc-vault
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
pm2 restart all