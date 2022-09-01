const { ethers } = require("hardhat");
const NFTMarket = require("../../artifacts/contracts/NFTMarket.sol/OpenFireMarketplace.json");
const NFT = require("../../artifacts/contracts/NFT.sol/FireNFT.json");
const prompt = require("prompt");
const { BigNumber } = require("ethers");
require("dotenv").config();
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const nftMarketAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const rpcUrl = process.env.HARDHAT_LOCALHOST_NODE_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

async function approveForAll(_caller, _nftAddress, _nftMarketAddress) {
  const signer = await ethers.getSigner(_caller);
  const nft = new ethers.Contract(_nftAddress, NFT.abi, provider);
  await nft.connect(signer).setApprovalForAll(_nftMarketAddress, true);
}

async function sellItem(_caller, _nftMarketAddress, _tokenId, _sellingPrice) {
  const signer = await ethers.getSigner(_caller);
  const nftMarket = new ethers.Contract(
    _nftMarketAddress,
    NFTMarket.abi,
    provider
  );
  const tx = await nftMarket
    .connect(signer)
    .setNftOnSale(_tokenId, _sellingPrice);
  const res = await tx.wait();
  return res;
}

async function main() {
  const [deployer, addr1] = await ethers.getSigners();
  await approveForAll(addr1.address, nftAddress, nftMarketAddress);
  prompt.start();
  prompt.get(["TokenID"], async function (err, result) {
    if (err) return console.error(err.message);
    const res = await sellItem(
      addr1.address,
      nftMarketAddress,
      BigNumber.from(result.TokenID),
      100000
    );
    console.log(res);
    console.log(`Listing successful!!`);
  });
}

module.exports = {
    approveForAll,
    sellItem
}

main().catch((error) => {
  console.error(error.message);
});
