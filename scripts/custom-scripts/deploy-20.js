const { ethers } = require("hardhat");

async function deployTradeToken() {
  const [deployer] = await ethers.getSigners();
  const OFTT = await ethers.getContractFactory("OpenTradeToken");
  const oftt = await OFTT.connect(deployer).deploy();
  await oftt.deployed();
  return oftt;
}

async function main() {
  const [deployer, ...addrs] = await ethers.getSigners();
  const token = await deployTradeToken();
  console.log(
    `OpenTradeToken (OTT) has been deployed to address: ${token.address}`
  );
  for (let addr of addrs) {
    await token.connect(deployer).transfer(addr.address, 100000);
    console.log(`${100000} transferred to ${addr.address}`);
  }
}

main().catch((error) => {
  console.error(error);
});
