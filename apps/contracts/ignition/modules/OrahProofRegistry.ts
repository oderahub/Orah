import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OrahProofRegistryModule = buildModule("OrahProofRegistryModule", (m) => {
  // Get the deployer's address to use as fee recipient
  const deployer = m.getAccount(0);

  // Get the fee recipient address from parameters or use deployer as default
  const feeRecipient = m.getParameter("feeRecipient", deployer);

  // Deploy the OrahProofRegistry contract
  const orahProofRegistry = m.contract("OrahProofRegistry", [feeRecipient]);

  return { orahProofRegistry };
});

export default OrahProofRegistryModule;
