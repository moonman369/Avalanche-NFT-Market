//SPDX-License-Identifier: MIT
// contracts/ERC721.sol

pragma solidity >=0.6.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FireNFT is ERC721, Ownable {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  struct TokenExtraInfo {
    address minter;
    string metaDataUri;
    uint256 initialPrice;
    uint256 royaltyPercentage;
  }

  mapping(uint256 => TokenExtraInfo) public TokenExtraInfos;
  mapping(uint256 =>string) private _tokenURIs;

  constructor() ERC721("FireNFT", "FNFT") {

  }

  // commented out unused variable
  // function awardItem(address player, string memory tokenURI)
  function mintItem(
    address _owner,
    string memory _tokenDataUri,
    string memory _metaDataUri,
    uint256 _royaltyPercentage
  )
    public
    returns (uint256)
  {
    require (
      _royaltyPercentage >= 0 && _royaltyPercentage <= 10,
      "Royalty Percentage out of of limits. Must be integer between 0 and 10"
    );

    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();

    TokenExtraInfos[newItemId] = TokenExtraInfo({
      minter: _owner,
      metaDataUri: _metaDataUri,
      initialPrice: 0,
      royaltyPercentage: _royaltyPercentage
    });

    _tokenURIs[newItemId] = _tokenDataUri;

    _mint(_owner, newItemId);
    // _setTokenURI(newItemId, tokenURI);

    return newItemId;
  }

  function getOgMinter(uint256 _tokenId) public view returns (address) {
    return TokenExtraInfos[_tokenId].minter;
  }

  function getRoyaltyPercentage(uint256 _tokenId) public view returns (uint256) {
    return TokenExtraInfos[_tokenId].royaltyPercentage;
  }

  function getmetaDataUri (uint256 _tokenId) public view returns (string memory){
    return TokenExtraInfos[_tokenId].metaDataUri;
  }

  function getNftDetails (uint256 _tokenId) public view returns (
    address,
    string memory,
    uint256,
    uint256
  ) {
      return (
        TokenExtraInfos[_tokenId].minter,
        TokenExtraInfos[_tokenId].metaDataUri,
        TokenExtraInfos[_tokenId].royaltyPercentage,
        TokenExtraInfos[_tokenId].initialPrice
      );
    }

  function tokenURI (uint256 _tokenId) public view override returns (string memory) {
    return _tokenURIs[_tokenId];
  }
}
