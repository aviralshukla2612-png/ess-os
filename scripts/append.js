const fs = require('fs');
let data = fs.readFileSync('prisma/schema.prisma').toString('utf8');
data += '\n\nmodel SystemSetting {\n  id    String @id @default("singleton")\n  key   String @unique\n  value String\n}\n';
fs.writeFileSync('prisma/schema.prisma', data);
