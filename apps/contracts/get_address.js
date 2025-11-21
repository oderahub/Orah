const { Wallet } = require('ethers');
require('dotenv').config();

if (process.env.PRIVATE_KEY) {
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  console.log("\n===========================================");
  console.log("Your Deployer Address:", wallet.address);
  console.log("===========================================\n");
  console.log("Use this command to verify your contract:\n");
  console.log(`npx hardhat verify --network sepolia \\`);
  console.log(`  0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7 \\`);
  console.log(`  "${wallet.address}"`);
  console.log("\n===========================================\n");
} else {
  console.log("PRIVATE_KEY not found in .env file");
}
