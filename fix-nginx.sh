#!/bin/bash
for f in $(find /etc/nginx -type f -name "*.conf"); do
  if grep -q "/ess-os" "$f"; then
    sed -i 's|/ess-os|/ess-crm|g' "$f"
    echo "Updated $f"
  fi
done
systemctl restart nginx
echo "Nginx restarted"
