#!/bin/bash

# Check if swap file already exists
if [ -f /swapfile ]; then
    echo "Swap file already exists."
    swapon --show
    free -h
    exit 0
fi

echo "Creating 4GB Swap File..."

# Create a 4GB swap file
sudo fallocate -l 4G /swapfile

# Set permissions
sudo chmod 600 /swapfile

# Mark as swap space
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tune swap settings for better performance
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50

echo "Swap created successfully!"
free -h
