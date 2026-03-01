// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC165 {
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/// @notice Minimal CRE receiver interface used by Keystone Forwarders.
interface IReceiver is IERC165 {
  function onReport(bytes calldata metadata, bytes calldata report) external;
}

/// @title OracleCourtReceiver
/// @notice Receives CRE-signed Oracle Court verdicts and stores the latest state.
/// @dev This demo receiver accepts reports from any sender for simulation flexibility.
///      For production hardening, gate `onReport` by trusted forwarder + workflow metadata.
contract OracleCourtReceiver is IReceiver {
  enum RiskMode {
    NORMAL,
    THROTTLE,
    REDEMPTION_ONLY
  }

  struct Verdict {
    uint8 mode;
    uint16 stressBps;
    uint32 timestamp;
    bytes32 caseId;
  }

  uint8 public latestMode;
  uint16 public latestStressBps;
  uint32 public latestTimestamp;
  bytes32 public latestCaseId;
  bytes public latestMetadata;
  bytes public latestRawReport;

  event VerdictCommitted(
    uint8 indexed mode,
    uint16 indexed stressBps,
    uint32 indexed timestamp,
    bytes32 caseId,
    bytes metadata,
    bytes report
  );

  function onReport(bytes calldata metadata, bytes calldata report) external override {
    Verdict memory verdict = abi.decode(report, (Verdict));

    latestMode = verdict.mode;
    latestStressBps = verdict.stressBps;
    latestTimestamp = verdict.timestamp;
    latestCaseId = verdict.caseId;
    latestMetadata = metadata;
    latestRawReport = report;

    emit VerdictCommitted(
      verdict.mode,
      verdict.stressBps,
      verdict.timestamp,
      verdict.caseId,
      metadata,
      report
    );
  }

  function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
    return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
  }
}
