// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC165 {
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/// @notice Minimal CRE receiver interface used by Keystone Forwarders.
interface IReceiver is IERC165 {
  function onReport(bytes calldata metadata, bytes calldata report) external;
}

interface IMockRWAVault {
  function setRiskMode(uint8 newMode) external;
}

/// @title OracleCourtReceiver
/// @notice Receives CRE-signed Oracle Court verdicts and enforces RWA vault policy.
/// @dev Demo receiver accepts reports from any sender for simulation flexibility.
///      For production hardening, gate `onReport` by trusted forwarder + workflow metadata.
contract OracleCourtReceiver is IReceiver {
  struct TribunalVerdict {
    uint8 mode;
    uint16 riskScoreBps;
    uint16 prosecutorScore;
    uint16 defenderScore;
    uint16 auditorScore;
    uint16 contradictionCount;
    uint16 contradictionSeverityBps;
    uint16 evidenceFreshnessScoreBps;
    uint16 admissibilityScoreBps;
    uint32 timestamp;
    bytes32 caseId;
    bytes32 prosecutorEvidenceHash;
    bytes32 defenderEvidenceHash;
    bytes32 auditorEvidenceHash;
    bytes32 verdictDigest;
  }

  IMockRWAVault public immutable vault;

  uint8 public latestMode;
  uint16 public latestRiskScoreBps;
  uint16 public latestProsecutorScore;
  uint16 public latestDefenderScore;
  uint16 public latestAuditorScore;
  uint16 public latestContradictionCount;
  uint16 public latestContradictionSeverityBps;
  uint16 public latestEvidenceFreshnessScoreBps;
  uint16 public latestAdmissibilityScoreBps;
  uint32 public latestTimestamp;
  bytes32 public latestCaseId;

  bytes32 public latestProsecutorEvidenceHash;
  bytes32 public latestDefenderEvidenceHash;
  bytes32 public latestAuditorEvidenceHash;
  bytes32 public latestVerdictDigest;

  bytes public latestMetadata;
  bytes public latestRawReport;

  event TribunalVerdictCommitted(
    uint8 indexed mode,
    uint16 indexed riskScoreBps,
    uint32 indexed timestamp,
    bytes32 caseId,
    uint16 prosecutorScore,
    uint16 defenderScore,
    uint16 auditorScore,
    uint16 contradictionCount,
    uint16 contradictionSeverityBps,
    uint16 evidenceFreshnessScoreBps,
    uint16 admissibilityScoreBps,
    bytes32 prosecutorEvidenceHash,
    bytes32 defenderEvidenceHash,
    bytes32 auditorEvidenceHash,
    bytes32 verdictDigest,
    address vaultAddress,
    bytes metadata,
    bytes report
  );

  error InvalidVaultAddress();
  error InvalidRiskMode(uint8 provided);

  constructor(address vaultAddress) {
    if (vaultAddress == address(0)) revert InvalidVaultAddress();
    vault = IMockRWAVault(vaultAddress);
  }

  function onReport(bytes calldata metadata, bytes calldata report) external override {
    TribunalVerdict memory verdict = abi.decode(report, (TribunalVerdict));

    if (verdict.mode > 2) revert InvalidRiskMode(verdict.mode);

    latestMode = verdict.mode;
    latestRiskScoreBps = verdict.riskScoreBps;
    latestProsecutorScore = verdict.prosecutorScore;
    latestDefenderScore = verdict.defenderScore;
    latestAuditorScore = verdict.auditorScore;
    latestContradictionCount = verdict.contradictionCount;
    latestContradictionSeverityBps = verdict.contradictionSeverityBps;
    latestEvidenceFreshnessScoreBps = verdict.evidenceFreshnessScoreBps;
    latestAdmissibilityScoreBps = verdict.admissibilityScoreBps;
    latestTimestamp = verdict.timestamp;
    latestCaseId = verdict.caseId;

    latestProsecutorEvidenceHash = verdict.prosecutorEvidenceHash;
    latestDefenderEvidenceHash = verdict.defenderEvidenceHash;
    latestAuditorEvidenceHash = verdict.auditorEvidenceHash;
    latestVerdictDigest = verdict.verdictDigest;

    latestMetadata = metadata;
    latestRawReport = report;

    // Enforce protocol impact: tribunal verdict updates the vault risk mode.
    vault.setRiskMode(verdict.mode);

    emit TribunalVerdictCommitted(
      verdict.mode,
      verdict.riskScoreBps,
      verdict.timestamp,
      verdict.caseId,
      verdict.prosecutorScore,
      verdict.defenderScore,
      verdict.auditorScore,
      verdict.contradictionCount,
      verdict.contradictionSeverityBps,
      verdict.evidenceFreshnessScoreBps,
      verdict.admissibilityScoreBps,
      verdict.prosecutorEvidenceHash,
      verdict.defenderEvidenceHash,
      verdict.auditorEvidenceHash,
      verdict.verdictDigest,
      address(vault),
      metadata,
      report
    );
  }

  function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
    return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
  }
}
