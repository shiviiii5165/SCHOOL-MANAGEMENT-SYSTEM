const { spawn } = require('child_process');
const child = spawn('npx', ['prisma', 'migrate', 'dev', '--name', 'add_notice_board_v2'], { shell: true, stdio: ['pipe', 'inherit', 'inherit'] });
child.stdin.write('y\n');
child.stdin.end();
