pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./dependencies/interfaces/IChildToken.sol";
import "./dependencies/utils/AccessControlMixin.sol";
import "./dependencies/utils/NativeMetaTransaction.sol";
import "./dependencies/utils/ContextMixin.sol";
import "./dependencies/utils/ChainConstants.sol";
import "./dependencies/token/ERC20.sol";
import "./dependencies/token/ERC20Permit.sol";
import "./dependencies/token/ERC20Votes.sol";

contract UChildERC20 is
    ERC20,
    IChildToken,
    AccessControlMixin,
    NativeMetaTransaction,
    ChainConstants,
    ContextMixin,
    ERC20Permit,
    ERC20Votes
{
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    constructor() public ERC20("", "") {}

    /**
     * @notice Initialize the contract after it has been proxified
     * @dev meant to be called once immediately after deployment
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint8 decimals_,
        address childChainManager
    )
        external
        initializer
    {
      setName(name_);
      setSymbol(symbol_);
      setDecimals(decimals_);
      _setupContractId(string(abi.encodePacked("Child", symbol_)));
      _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      _setupRole(DEPOSITOR_ROLE, childChainManager);
      _initializeEIP712(name_, ERC712_VERSION);
    }

    // This is to support Native meta transactions
    // never use msg.sender directly, use _msgSender() instead
    function _msgSender()
        internal
        override
        view
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required amount for user
     * Make sure minting is done only by this function
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded amount
     */
    function deposit(address user, bytes calldata depositData)
        external
        override
        only(DEPOSITOR_ROLE)
    {
        uint256 amount = abi.decode(depositData, (uint256));
        _mint(user, amount);
    }

    /**
     * @notice called when user wants to withdraw tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param amount amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Votes)
    {
        ERC20Votes._afterTokenTransfer(from, to, amount);
    }

    function _burn(address user, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Votes)
    {
        ERC20Votes._burn(user, amount);
    }

    function _mint(address user, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Votes)
    {
        ERC20Votes._mint(user, amount);
    }
}