const { ethers } = require("hardhat");
const prompt = require("prompt");

async function deployMarketPlace(nft, tradeToken) {
  const [deployer] = await ethers.getSigners();
  const OpenFireMarket = await ethers.getContractFactory("OpenFireMarketplace");
  const openFireMarket = await OpenFireMarket.connect(deployer).deploy(
    nft,
    tradeToken
  );
  await openFireMarket.deployed();
  return openFireMarket;
}

async function main() {
  prompt.start();
  prompt.get(
    ["NFTContractAddress", "TradeTokenAddress"],
    async function (err, result) {
      if (err) return console.error(err.message);
      const nftMarket = await deployMarketPlace(
        result.NFTContractAddress,
        result.TradeTokenAddress
      );
      console.log(
        `NFT Marketplace contract has been deployed to address: ${nftMarket.address}`
      );
    }
  );
}

main().catch((error) => {
  console.error(error.message);
});
