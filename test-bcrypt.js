const bcrypt = require('bcrypt');

async function main() {
  const hash = '$2b$10$Ll.XRXr1n7L/P2tpC/ezHedtk9ZUXSdDvmtquY3KXSXKasbOBFGrS';
  const match = await bcrypt.compare('Teacher@123', hash);
  console.log("Match:", match);
}

main();
