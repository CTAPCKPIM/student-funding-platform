// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HelperSFP
 * @notice Helper library for validation functions
 * @author CTAPCKPIM
 */
library HelperSFP {
    /**
     * @notice All errors thrown:
     * - ZeroAddressError: Thrown when a zero address is provided where a non-zero address is required
     * - ZeroAmountError: Thrown when a zero amount is provided where a positive amount is required
     * - EmptyStringError: Thrown when an empty string is provided where a non-empty string is required
     */
    error ZeroAddressError();
    error ZeroAmountError();
    error EmptyStringError();

    /**
     * @notice Checks if an address is not the zero address
     * @param _address The address to check
     */
    function notZeroAddress(address _address) internal pure {
        if (_address == address(0)) revert ZeroAddressError();
    }

    /**
     * @notice Checks if a uint256 amount is greater than zero
     * @param _amount The amount to check
     */
    function notZeroAmount(uint256 _amount) internal pure {
        if (_amount == 0) revert ZeroAmountError();
    }

    /**
     * @notice Checks if a string is not empty
     * @param _string The string to check
     */
    function notZeroString(string memory _string) internal pure {
        if (bytes(_string).length == 0) revert EmptyStringError();
    }
}