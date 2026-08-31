const fs = require('fs');
let data = fs.readFileSync('prisma/schema.prisma').toString('utf8');
data = data.split('@@index([status])\n}')[0];
data = data.split('@@index([status])\r\n}')[0];
data += '@@index([status])\n}\n\nmodel SystemSetting {\n  id    String @id @default("singleton")\n  key   String @unique\n  value String\n}\n';
fs.writeFileSync('prisma/schema.prisma', data);
