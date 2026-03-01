// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MockRWAVault
/// @notice Demo issuer/vault policy surface controlled by Oracle Court verdicts.
/// @dev Includes mock RWA telemetry so tribunal decisions can include reserve quality + attestation freshness.
contract MockRWAVault {
  enum RiskMode {
    NORMAL,
    THROTTLE,
    REDEMPTION_ONLY
  }

  uint16 public constant BPS_DENOMINATOR = 10_000;

  address public owner;
  address public court;

  uint8 public riskMode;
  uint256 public throttleMintLimit;

  uint256 public totalMinted;
  uint256 public totalRedeemed;

  // --- Mock RWA risk telemetry ---
  // reserveCoverageBps: 10_000 = 100% reserve coverage
  // attestationAgeSeconds: lower is better (fresher attestations)
  // redemptionQueueBps: redemption queue pressure in basis points
  uint16 public reserveCoverageBps;
  uint32 public attestationAgeSeconds;
  uint16 public redemptionQueueBps;

  mapping(address => uint256) public balances;

  event CourtUpdated(address indexed previousCourt, address indexed newCourt);
  event ThrottleMintLimitUpdated(uint256 previousLimit, uint256 newLimit);
  event RiskModeUpdated(uint8 indexed previousMode, uint8 indexed newMode, address indexed caller);
  event Minted(address indexed account, uint256 amount, uint8 indexed mode);
  event Redeemed(address indexed account, uint256 amount, uint8 indexed mode);
  event RiskTelemetryUpdated(
    uint16 reserveCoverageBps,
    uint32 attestationAgeSeconds,
    uint16 redemptionQueueBps,
    address indexed updater
  );

  error OnlyOwner();
  error OnlyCourt();
  error InvalidAddress();
  error InvalidRiskMode();
  error InvalidAmount();
  error InvalidBps();
  error MintBlockedByRiskMode(uint8 currentMode, uint256 amount, uint256 throttleLimit);
  error InsufficientBalance(uint256 balance, uint256 required);

  modifier onlyOwner() {
    if (msg.sender != owner) revert OnlyOwner();
    _;
  }

  modifier onlyCourt() {
    if (msg.sender != court) revert OnlyCourt();
    _;
  }

  constructor(
    address initialCourt,
    uint256 initialThrottleMintLimit,
    uint16 initialReserveCoverageBps,
    uint32 initialAttestationAgeSeconds,
    uint16 initialRedemptionQueueBps
  ) {
    if (initialCourt == address(0)) revert InvalidAddress();
    if (initialReserveCoverageBps > BPS_DENOMINATOR * 2) revert InvalidBps();
    if (initialRedemptionQueueBps > BPS_DENOMINATOR) revert InvalidBps();

    owner = msg.sender;
    court = initialCourt;
    throttleMintLimit = initialThrottleMintLimit;
    riskMode = uint8(RiskMode.NORMAL);

    reserveCoverageBps = initialReserveCoverageBps;
    attestationAgeSeconds = initialAttestationAgeSeconds;
    redemptionQueueBps = initialRedemptionQueueBps;
  }

  function setCourt(address newCourt) external onlyOwner {
    if (newCourt == address(0)) revert InvalidAddress();

    address previousCourt = court;
    court = newCourt;

    emit CourtUpdated(previousCourt, newCourt);
  }

  function setThrottleMintLimit(uint256 newLimit) external onlyOwner {
    uint256 previousLimit = throttleMintLimit;
    throttleMintLimit = newLimit;

    emit ThrottleMintLimitUpdated(previousLimit, newLimit);
  }

  /// @notice Owner-controlled mock telemetry updater to simulate RWA reserve/attestation stress.
  function setRiskTelemetry(
    uint16 newReserveCoverageBps,
    uint32 newAttestationAgeSeconds,
    uint16 newRedemptionQueueBps
  ) external onlyOwner {
    if (newReserveCoverageBps > BPS_DENOMINATOR * 2) revert InvalidBps();
    if (newRedemptionQueueBps > BPS_DENOMINATOR) revert InvalidBps();

    reserveCoverageBps = newReserveCoverageBps;
    attestationAgeSeconds = newAttestationAgeSeconds;
    redemptionQueueBps = newRedemptionQueueBps;

    emit RiskTelemetryUpdated(
      newReserveCoverageBps,
      newAttestationAgeSeconds,
      newRedemptionQueueBps,
      msg.sender
    );
  }

  /// @notice Called by OracleCourtReceiver when a new tribunal verdict arrives.
  function setRiskMode(uint8 newMode) external onlyCourt {
    if (newMode > uint8(RiskMode.REDEMPTION_ONLY)) revert InvalidRiskMode();

    uint8 previousMode = riskMode;
    riskMode = newMode;

    emit RiskModeUpdated(previousMode, newMode, msg.sender);
  }

  function canMint(uint256 amount) public view returns (bool) {
    if (riskMode == uint8(RiskMode.REDEMPTION_ONLY)) {
      return false;
    }

    if (riskMode == uint8(RiskMode.THROTTLE) && amount > throttleMintLimit) {
      return false;
    }

    return true;
  }

  function canRedeem(uint256 amount) public pure returns (bool) {
    return amount > 0;
  }

  function mint(uint256 amount) external {
    if (amount == 0) revert InvalidAmount();

    if (!canMint(amount)) {
      revert MintBlockedByRiskMode(riskMode, amount, throttleMintLimit);
    }

    balances[msg.sender] += amount;
    totalMinted += amount;

    emit Minted(msg.sender, amount, riskMode);
  }

  function redeem(uint256 amount) external {
    if (amount == 0) revert InvalidAmount();
    if (!canRedeem(amount)) revert InvalidAmount();

    uint256 currentBalance = balances[msg.sender];
    if (currentBalance < amount) {
      revert InsufficientBalance(currentBalance, amount);
    }

    balances[msg.sender] = currentBalance - amount;
    totalRedeemed += amount;

    emit Redeemed(msg.sender, amount, riskMode);
  }
}
