const { ethers } = require("hardhat");

async function deployFireNFT() {
  const [deployer] = await ethers.getSigners();
  const FireNFT = await ethers.getContractFactory("FireNFT");
  const fireNft = await FireNFT.connect(deployer).deploy();
  await fireNft.deployed();
  return fireNft;
}

async function main() {
  const nft = await deployFireNFT();
  console.log(`FireNFT has been deployed to address: ${nft.address}`);
}

main().catch((error) => {
  console.error(error);
});
