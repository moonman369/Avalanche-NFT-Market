const { ethers } = require("hardhat");
const NFTMarket = require("../../artifacts/contracts/NFTMarket.sol/OpenFireMarketplace.json");
const NFT = require("../../artifacts/contracts/NFT.sol/FireNFT.json");
const OTT = require("../../artifacts/contracts/TradeToken.sol/OpenTradeToken.json");
const prompt = require("prompt");
const { BigNumber } = require("ethers");

require("dotenv").config();
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const tradeTokenAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
const nftMarketAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b";

const rpcUrl = process.env.HARDHAT_LOCALHOST_NODE_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

async function approveAllowance(
  _caller,
  _tradeTokenAddress,
  _spenderAddress,
  _allowanceAmount
) {
  const signer = await ethers.getSigner(_caller);
  const tradeToken = new ethers.Contract(_tradeTokenAddress, OTT.abi, provider);
  const tx = await tradeToken
    .connect(signer)
    .approve(_spenderAddress, _allowanceAmount);
  const res = await tx.wait();
  console.log(res);
  console.log(
    `${_spenderAddress} has been approved an allowance of ${_allowanceAmount}`
  );
}

async function purchaseItem(
  _caller,
  _nftMarketAddress,
  _tokenId,
  _payableAmount
) {
  const signer = await ethers.getSigner(_caller);

  const nftMarket = new ethers.Contract(
    _nftMarketAddress,
    NFTMarket.abi,
    provider
  );

  const tx = await nftMarket
    .connect(signer)
    .purchaseItem(_tokenId, _payableAmount);
  const res = await tx.wait();
  console.log(res);
  console.log(`Item purchase successful!!`);
}

async function main() {
  const [deployer, ...addrs] = await ethers.getSigners();
  await approveAllowance(
    addrs[1].address,
    tradeTokenAddress,
    nftMarketAddress,
    1000
  );
  prompt.start();
  prompt.get(["TokenID"], async function (err, result) {
    const res = await purchaseItem(
      addrs[1].address,
      nftMarketAddress,
      BigNumber.from(result.TokenID),
      1000
    );
    process.exit(1);
  });
}

module.exports = {
  approveAllowance,
  purchaseItem,
};

main().catch((error) => {
  console.error(error.message);
});
