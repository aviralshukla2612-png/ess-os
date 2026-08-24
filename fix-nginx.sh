#!/bin/bash
for f in $(find /etc/nginx -type f -name "*.conf"); do
  if grep -q "/mdz-os" "$f"; then
    sed -i 's|/mdz-os|/mdz-crm|g' "$f"
    echo "Updated $f"
  fi
done
systemctl restart nginx
echo "Nginx restarted"
