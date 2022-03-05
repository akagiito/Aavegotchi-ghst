pragma solidity 0.6.6;

interface IUpgradeableProxy {
  function updateImplementation(address _newProxyTo) external;
  function implementation() external view returns (address codeAddr);
}