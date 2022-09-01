const { ethers } = require("hardhat");
const NFTMarket = require("../../artifacts/contracts/NFTMarket.sol/OpenFireMarketplace.json");
const NFT = require("../../artifacts/contracts/NFT.sol/FireNFT.json");
const prompt = require("prompt");
const { BigNumber } = require("ethers");
const { approveForAll } = require("./sell");

require("dotenv").config();
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const nftMarketAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function purchaseItem () {
    
}