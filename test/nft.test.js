const { ethers } = require("hardhat");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { BigNumber } = require("ethers");

const expect = chai.expect;
chai.use(chaiAsPromised);

let deployer, addr1, addr2, addrs;
let nft;
let nftMarket;
let tradeToken;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const mintArgs = ["tokendata/uri/", "metadata/uri/", 5];

before(async function () {
  [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

  const addresses = [addr1, addr2, ...addrs].map((signer) => signer.address);

  const TradeToken = await ethers.getContractFactory("OpenTradeToken");
  tradeToken = await TradeToken.connect(deployer).deploy();
  await tradeToken.deployed();

  for (let address of addresses) {
    await tradeToken.connect(deployer).transfer(address, 10000);
  }

  const NFT = await ethers.getContractFactory("FireNFT");
  nft = await NFT.connect(deployer).deploy();
  await nft.deployed();

  const NFTMarket = await ethers.getContractFactory("OpenFireMarketplace");
  nftMarket = await NFTMarket.connect(deployer).deploy(
    nft.address,
    tradeToken.address
  );
  await nftMarket.deployed();

  //   await nft.connect()
});

describe("I. Minting an NFT", function () {
  it("1. Users should be able to mint NFTs", async function () {
    const tokenId = await nft.callStatic.mintItem(addr1.address, ...mintArgs);
    await expect(nft.connect(addr1).mintItem(addr1.address, ...mintArgs)).to
      .eventually.be.fulfilled;
    expect(tokenId).to.eql(BigNumber.from(1));
  });

  it("2. User minted NFT should have the desired properties", async function () {
    const [minter, metaDataUri, royaltyPercentage] = await nft.getNftDetails(1);
    expect(minter).to.equal(addr1.address);
    expect(metaDataUri).to.equal(mintArgs[1]);
    expect(royaltyPercentage).to.equal(mintArgs[2]);

    expect(await nft.tokenURI(1)).to.equal(mintArgs[0]);
  });

  it("3. Users should not be able to mint NFT with a royaltyPercentage greater than 10", async function () {
    await expect(
      nft.connect(addr1).mintItem(addr1.address, mintArgs[0], mintArgs[1], 10)
    ).to.eventually.be.fulfilled;
    await expect(
      nft.connect(addr1).mintItem(addr1.address, mintArgs[0], mintArgs[1], 11)
    ).to.eventually.be.rejectedWith(
      "FireNFT: Royalty Percentage out of of limits. Must be integer between 0 and 10"
    );
  });

  it("4. Users should not be able to mint NFT to null address", async function () {
    await expect(
      nft.mintItem(NULL_ADDRESS, ...mintArgs)
    ).to.eventually.be.rejectedWith(
      "FireNFT: Cannot mint item to null address."
    );
  });
});

describe("II. Listing NFT on Sale", function () {
  async function approveMarket(nftMarketAddress, caller) {
    const signer = await ethers.getSigner(caller);
    await nft.connect(signer).setApprovalForAll(nftMarketAddress, true);
  }

  async function mintItemToSelf(
    caller,
    tokenUri,
    metaDataUri,
    royaltyPercentage
  ) {
    const tokenId = await nft.callStatic.mintItem(
      caller,
      tokenUri,
      metaDataUri,
      royaltyPercentage
    );
    const signer = await ethers.getSigner(caller);
    await nft
      .connect(signer)
      .mintItem(caller, tokenUri, metaDataUri, royaltyPercentage);
    return tokenId;
  }

  it("1. Users should be able to list their NFTs on sale", async function () {
    const tokenId = await mintItemToSelf(addr1.address, ...mintArgs);
    await approveMarket(nftMarket.address, addr1.address);
    await expect(nftMarket.connect(addr1).setNftOnSale(tokenId, 1000)).to
      .eventually.be.fulfilled;
  });

  it("2. Users should not be able to list NFT on sale if they have not approved the NFT Marketplace contract", async function () {
    const tokenId = await mintItemToSelf(addr2.address, ...mintArgs);
    await expect(
      nftMarket.connect(addr2).setNftOnSale(tokenId, 1000)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Minter needs to approve MarketPlace as token operator first."
    );
  });

  it("3. Users should not be able to list a particular token more than once", async function () {
    const tokenId = await mintItemToSelf(addr1.address, ...mintArgs);
    await expect(nftMarket.connect(addr1).setNftOnSale(tokenId, 1000)).to
      .eventually.be.fulfilled;
    await expect(
      nftMarket.connect(addr1).setNftOnSale(tokenId, 1000)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Token already listed for sale."
    );
  });

  it("4. No address other than the owner of a token should be able to list it for sale", async function () {
    const tokenId = await mintItemToSelf(addr1.address, ...mintArgs);
    await approveMarket(nftMarket.address, addr2.address);
    await expect(
      nftMarket.connect(addr2).setNftOnSale(tokenId, 1000)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Caller is not the owner of this token"
    );
    await expect(nftMarket.connect(addr1).setNftOnSale(tokenId, 1000)).to
      .eventually.be.fulfilled;
  });

  it("5. Users should not be able to list their NFTs for a selling price of less than 100 wei", async function () {
    const tokenId = await mintItemToSelf(addr1.address, ...mintArgs);
    await expect(
      nftMarket.connect(addr1).setNftOnSale(tokenId, 100)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Amount should be greater than 100 wei"
    );
    await expect(nftMarket.connect(addr1).setNftOnSale(tokenId, 101)).to
      .eventually.be.fulfilled;
  });

  it("6. User's should be able to fetch a particular Sale by tokenId", async function () {
    const _tokenId = await mintItemToSelf(addr1.address, ...mintArgs);
    await nftMarket.connect(addr1).setNftOnSale(_tokenId, 1000);
    const SaleParams = await expect(nftMarket.TokenSales(_tokenId)).to
      .eventually.be.fulfilled;
    const { tokenId, tokenUri, seller, sellingPrice, onSale } = SaleParams;
    expect(tokenId).to.equal(_tokenId);
    expect(tokenUri).to.equal(mintArgs[0]);
    expect(seller).to.equal(addr1.address);
    expect(sellingPrice).to.equal(1000);
    expect(onSale).to.equal(true);
  });
});

describe("III. Cancelling Listed Sale", function () {
  let tokenId;
  beforeEach(async function () {
    tokenId = await nft.callStatic.mintItem(addr1.address, ...mintArgs);
    await nft.connect(addr1).mintItem(addr1.address, ...mintArgs);
    await nftMarket.connect(addr1).setNftOnSale(tokenId, 1000);
  });

  it("1. Users should be able to cancel sales listed by them", async function () {
    await expect(nftMarket.connect(addr1).cancelSale(tokenId)).to.eventually.be
      .fulfilled;
    const { onSale, sellingPrice } = await nftMarket.TokenSales(tokenId);
    expect(onSale).to.equal(false);
    expect(sellingPrice).to.equal(0);
  });

  it("2. Users should not be able to cancel a token sale that is not already on sale", async function () {
    await expect(nftMarket.connect(addr1).cancelSale(tokenId)).to.eventually.be
      .fulfilled;
    await expect(
      nftMarket.connect(addr1).cancelSale(tokenId)
    ).to.eventually.be.rejectedWith("OpenFireMarket: Item is not on sale.");
    const randTokenId = await nft.callStatic.mintItem(
      addr1.address,
      ...mintArgs
    );
    await nft.connect(addr1).mintItem(addr1.address, ...mintArgs);
    await expect(
      nftMarket.connect(addr1).cancelSale(randTokenId)
    ).to.eventually.be.rejectedWith("OpenFireMarket: Item is not on sale.");
  });

  it("Users should not be able to cancel the sale of a token they do not own", async function () {
    await expect(
      nftMarket.connect(addr2).cancelSale(tokenId)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Caller is not the owner of this token"
    );
  });
});

describe("IV. Purchasing NFT", function () {
  let tokenId;
  const tokenPrice = 5000;
  beforeEach(async function () {
    tokenId = await nft.callStatic.mintItem(addr1.address, ...mintArgs);
    await nft.connect(addr1).mintItem(addr1.address, ...mintArgs);
    await nftMarket.connect(addr1).setNftOnSale(tokenId, tokenPrice);
    await tradeToken.connect(addr2).approve(nftMarket.address, tokenPrice + 10);
  });

  it("1. Users should be able to purchase an NFT at listed price or higher", async function () {
    const initialTokenbalance1 = await tradeToken.balanceOf(addr1.address);
    const initialTokenbalance2 = await tradeToken.balanceOf(addr2.address);
    expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    await expect(nftMarket.connect(addr2).purchaseItem(tokenId, tokenPrice + 9))
      .to.eventually.be.fulfilled;
    expect(await nft.ownerOf(tokenId)).to.equal(addr2.address);
    expect(
      (await tradeToken.balanceOf(addr1.address)) > initialTokenbalance1
    ).to.equal(true);
    expect(
      (await tradeToken.balanceOf(addr2.address)) > initialTokenbalance2
    ).to.equal(true);
  });

  it("2. Users should not be able to purchase an NFT that is not listed on sale", async function () {
    await nftMarket.connect(addr1).cancelSale(tokenId);
    await expect(
      nftMarket.connect(addr2).purchaseItem(tokenId, tokenPrice)
    ).to.be.eventually.rejectedWith("OpenFireMarket: Token is not on sale");
  });

  it("3. Users should not be able to purchase an NFT for an amount less than the listed price", async function () {
    await expect(
      nftMarket.connect(addr2).purchaseItem(tokenId, tokenPrice - 1)
    ).to.eventually.be.rejectedWith(
      "OpenFireMarket: Not enough value to buy token"
    );
  });

  it("4. Minter and and Marketplace owner should receive Royalty and Marketplace commissions respectively for a token sale", async function () {
    const marketPlacePercentage = 2.5;
    const initBalanceDep = await tradeToken.balanceOf(deployer.address);
    const initBalance1 = await tradeToken.balanceOf(addr1.address);
    const initBalance2 = await tradeToken.balanceOf(addr2.address);

    const royaltyPercentage = await nft.getRoyaltyPercentage(tokenId);

    await expect(nftMarket.connect(addr2).purchaseItem(tokenId, tokenPrice)).to
      .eventually.be.fulfilled;

    expect(await tradeToken.balanceOf(addr2.address)).to.equal(
      initBalance2 - tokenPrice
    );
    const marketPlaceCommission =
      (marketPlacePercentage * 100 * tokenPrice) / 10000;
    expect(await tradeToken.balanceOf(deployer.address)).to.equal(
      BigNumber.from(initBalanceDep).add(marketPlaceCommission)
    );
    expect(await tradeToken.balanceOf(addr1.address)).to.equal(
      BigNumber.from(initBalance1).add(tokenPrice - marketPlaceCommission)
    );
  });
});
