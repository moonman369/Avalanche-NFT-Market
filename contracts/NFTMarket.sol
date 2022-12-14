//SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import "./NFT.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract OpenFireMarketplace is Ownable, ReentrancyGuard {

    using SafeMath for uint256;

    event SaleCreated (uint256 _tokenId, uint256 _sellingPrice);
    event SaleCancelled (uint256 _tokenId);


    FireNFT nft;
    IERC20 tradeToken;
    address payable marketPlaceOwner;

    struct Sale {
        uint256 tokenId;
        string tokenUri;
        address seller;
        uint256 sellingPrice;
        bool onSale;
    }

    mapping (uint256 => Sale) public TokenSales;
    // mapping(uint256 => Auction)

    Sale[] public ItemsOnSale;

    constructor (address _nftContract, address _token) {
        nft = FireNFT(_nftContract);
        tradeToken = IERC20(payable(_token));
        marketPlaceOwner = payable(msg.sender);
    }

    modifier isTokenOwner (uint256 _tokenId) {
        require (
            nft.ownerOf(_tokenId) == msg.sender,
            "OpenFireMarket: Caller is not the owner of this token"
        );
        _;
    }

    modifier checkPrice (uint256 _amount) {
        require(_amount > 100, "OpenFireMarket: Amount should be greater than 100 wei");
        _;
    }

    function setNftOnSale (
        uint256 _tokenId,
        uint256 _sellingPrice
    ) public payable 
    isTokenOwner(_tokenId)
    checkPrice(_sellingPrice) 
    {
        require (
            nft.isApprovedForAll(msg.sender, address(this)),
            "OpenFireMarket: Minter needs to approve MarketPlace as token operator first."
        );

        require (
            TokenSales[_tokenId].onSale == false,
            "OpenFireMarket: Token already listed for sale."
        );

        string memory _tokenUri = nft.tokenURI(_tokenId);

        Sale memory saleItem = Sale({
            tokenId: _tokenId,
            tokenUri: _tokenUri,
            seller: msg.sender,
            sellingPrice: _sellingPrice,
            onSale: true
        });

        ItemsOnSale.push(saleItem);

        TokenSales[_tokenId] = saleItem;
    }

    function cancelSale (uint256 _tokenId) public 
    isTokenOwner(_tokenId) 
    {
        Sale storage sale = TokenSales[_tokenId];
        require (
            sale.onSale,
            "OpenFireMarket: Item is not on sale."
        ); 

        sale.onSale = false;
        sale.sellingPrice = 0;

        removeItemFromList(_tokenId);

        emit SaleCancelled(_tokenId);
    }

    function purchaseItem (uint256 _tokenId, uint256 _payableAmount)
    public payable
    {
        Sale storage sale = TokenSales[_tokenId];
        require(sale.onSale, "OpenFireMarket: Token is not on sale");

        require(
            sale.sellingPrice <= _payableAmount,
            "OpenFireMarket: Not enough value to buy token"
        );

        address tokenOwner = nft.ownerOf(_tokenId);
        address minter = nft.getOgMinter(_tokenId);
        uint256 royaltyPercentage = nft.getRoyaltyPercentage(_tokenId);

        (
            uint256 minterCommission,
            uint256 marketPlaceCommission,
            uint256 ownerCut
        ) = calculateCommissions(sale.sellingPrice, royaltyPercentage);

        sale.onSale = false;
        sale.sellingPrice = 0;

        removeItemFromList(_tokenId);
        
        nft.transferFrom (tokenOwner, msg.sender, _tokenId);

        tradeToken.transferFrom(msg.sender, marketPlaceOwner, marketPlaceCommission);
        tradeToken.transferFrom(msg.sender, minter, minterCommission);
        tradeToken.transferFrom(msg.sender, tokenOwner, ownerCut);
    } 

    function removeItemFromList (uint256 _tokenId) internal virtual {
        for (uint256 i = 0; i < ItemsOnSale.length; i++) {
            if (ItemsOnSale[i].tokenId == _tokenId){
                ItemsOnSale[i] = ItemsOnSale[ItemsOnSale.length - 1];
                ItemsOnSale.pop();
                return;
            }
        }
    }

    function calculateCommissions (uint256 _amount, uint256 _royaltyPercentage) 
    internal
    pure
    returns( uint256, uint256, uint256 ) 
    {

        uint256 minterCommission = _amount.mul(_royaltyPercentage).div(100);
        uint256 marketPlaceCommission = _amount.mul(250).div(10000);
        uint ownerCut = _amount.sub(minterCommission).sub(marketPlaceCommission);

        return (
            minterCommission,
            marketPlaceCommission,
            ownerCut
        );
    }

    function fetchItemsOnSale () public view returns (Sale[] memory) {
        return ItemsOnSale;
    }

    function fetchMyItemsOnSale () public view returns (Sale[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < ItemsOnSale.length; i++) {
            Sale memory sale = ItemsOnSale[i];
            if (sale.seller == msg.sender) {
                count++;
            }
        }

        Sale[] memory mySales = new Sale[] (count);

        for (uint256 i = 0; i < ItemsOnSale.length; i++) {
            Sale memory sale = ItemsOnSale[i];
            if (sale.seller == msg.sender) {
                count--;
                mySales[count] = sale;
            }
        }
        return mySales;
    }

}