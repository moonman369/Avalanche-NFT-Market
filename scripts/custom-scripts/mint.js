const { ethers } = require("hardhat");
// const prompt = require("prompt");
const { abi } = require("../../artifacts/contracts/NFT.sol/FireNFT.json");
const rpcUrl = "http://127.0.0.1:8545";
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function mintItem(
  _caller,
  _contractAddress,
  _owner,
  _tokenDataUri,
  _metaDataUri,
  _royaltyPercentage
) {
  const signer = await ethers.getSigner(_caller);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const nft = new ethers.Contract(_contractAddress, abi, provider);

  const { _hex } = await nft.callStatic.mintItem(
    _owner,
    _tokenDataUri,
    _metaDataUri,
    _royaltyPercentage
  );

  await nft
    .connect(signer)
    .mintItem(_owner, _tokenDataUri, _metaDataUri, _royaltyPercentage)
    .catch((error) => {
      console.error(error.message);
    });

  //   console.log(_hex);
  console.log(`Token mint success!! Token ID: ${_hex}`);

  return _hex;
}

async function main() {
  const [deployer, addr1] = await ethers.getSigners();
  const tokenId = await mintItem(
    addr1.address,
    nftAddress,
    addr1.address,
    "/tokenURI/1",
    'metadata : {"1": "2"}',
    5
  );

  console.log(`Token ID -> ${tokenId}`);
}

main().catch((error) => {
  console.error(error.message);
});
