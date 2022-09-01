const { ethers } = require("hardhat");

async function deployTradeToken() {
  const [deployer] = await ethers.getSigners();
  const OFTT = await ethers.getContractFactory("OpenTradeToken");
  const oftt = await OFTT.connect(deployer).deploy();
  await oftt.deployed();
  return oftt;
}

async function main() {
  const token = await deployTradeToken();
  console.log(
    `OpenTradeToken (OTT) has been deployed to address: ${token.address}`
  );
}

main().catch((error) => {
  console.error(error);
});
