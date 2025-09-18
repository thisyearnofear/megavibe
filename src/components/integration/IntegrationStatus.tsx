// Integration Status Component
// ENHANCEMENT FIRST: Enhances existing status displays with unified experience
// PREVENT BLOAT: Consolidates multiple status components into single, focused component
// ORGANIZED: Predictable structure with domain-driven design

"use client";

import React from "react";
import { useIntegrationState } from "@/hooks/useIntegrationState";
import { Button } from "@/components/design-system/Button";
import { Card, CardHeader, CardContent } from "@/components/design-system/Card";
import { LoadingSpinner } from "@/components/shared/LoadingStates";

interface IntegrationStatusProps {
  variant?: "compact" | "detailed" | "dashboard";
  showActions?: boolean;
  className?: string;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  variant = "compact",
  showActions = true,
  className = "",
}) => {
  const {
    wallet,
    filcdn,
    overall,
    connectWallet,
    reinitializeFilCDN,
    initializeAll,
    runHealthCheck,
  } = useIntegrationState();

  if (variant === "compact") {
    return (
      <CompactStatus
        overall={overall}
        onInitialize={initializeAll}
        showActions={showActions}
        className={className}
      />
    );
  }

  if (variant === "dashboard") {
    return (
      <DashboardStatus
        wallet={wallet}
        filcdn={filcdn}
        overall={overall}
        onConnectWallet={connectWallet}
        onReinitializeFilCDN={reinitializeFilCDN}
        onHealthCheck={runHealthCheck}
        className={className}
      />
    );
  }

  return (
    <DetailedStatus
      wallet={wallet}
      filcdn={filcdn}
      overall={overall}
      onConnectWallet={connectWallet}
      onReinitializeFilCDN={reinitializeFilCDN}
      onInitializeAll={initializeAll}
      showActions={showActions}
      className={className}
    />
  );
};

// Compact status for mobile and space-constrained areas
const CompactStatus: React.FC<{
  overall: any;
  onInitialize: () => void;
  showActions: boolean;
  className: string;
}> = ({ overall, onInitialize, showActions, className }) => {
  const healthIcon = {
    excellent: "🟢",
    good: "🟡",
    poor: "🟠",
    critical: "🔴",
  }[overall.health];

  return (
    <div className={`flex items-center gap-sm ${className}`}>
      <span className="text-lg">{healthIcon}</span>
      <span className="text-sm text-secondary">
        {overall.isReady
          ? "All systems ready"
          : `${overall.blockers.length} issues`}
      </span>
      {showActions && !overall.isReady && (
        <Button size="sm" variant="primary" onClick={onInitialize}>
          Fix Issues
        </Button>
      )}
    </div>
  );
};

// Detailed status for settings and integration pages
const DetailedStatus: React.FC<{
  wallet: any;
  filcdn: any;
  overall: any;
  onConnectWallet: () => void;
  onReinitializeFilCDN: () => void;
  onInitializeAll: () => void;
  showActions: boolean;
  className: string;
}> = ({
  wallet,
  filcdn,
  overall,
  onConnectWallet,
  onReinitializeFilCDN,
  onInitializeAll,
  showActions,
  className,
}) => {
  return (
    <Card className={`card-integration ${className}`}>
      <CardHeader title="Integration Status" />
      <CardContent>
        <div className="space-y-md">
          {/* Wallet Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span
                className={`status-dot ${
                  wallet.isConnected ? "status-success" : "status-error"
                }`}
              />
              <span className="font-medium">Wallet</span>
            </div>
            <div className="flex items-center gap-sm">
              {wallet.isConnecting && <LoadingSpinner size="sm" />}
              <span className="text-sm text-secondary">
                {wallet.isConnected ? "Connected" : "Disconnected"}
              </span>
              {showActions && !wallet.isConnected && !wallet.isConnecting && (
                <Button size="sm" variant="outline" onClick={onConnectWallet}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* FilCDN Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span
                className={`status-dot ${
                  filcdn.isInitialized ? "status-success" : "status-error"
                }`}
              />
              <span className="font-medium">Storage</span>
            </div>
            <div className="flex items-center gap-sm">
              {filcdn.isInitializing && <LoadingSpinner size="sm" />}
              <span className="text-sm text-secondary">
                {filcdn.isInitialized ? "Ready" : "Not Ready"}
              </span>
              {showActions &&
                !filcdn.isInitialized &&
                !filcdn.isInitializing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReinitializeFilCDN}
                  >
                    Initialize
                  </Button>
                )}
            </div>
          </div>

          {/* Overall Status */}
          <div className="pt-md border-t border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className={`badge badge-${overall.health}`}>
                  {overall.health.toUpperCase()}
                </span>
                <span className="font-medium">Overall Health</span>
              </div>
              {showActions && (
                <Button
                  size="sm"
                  variant={overall.isReady ? "secondary" : "primary"}
                  onClick={overall.isReady ? onInitializeAll : onInitializeAll}
                >
                  {overall.isReady ? "Check Health" : "Fix All Issues"}
                </Button>
              )}
            </div>

            {overall.blockers.length > 0 && (
              <div className="mt-sm">
                <p className="text-xs text-secondary mb-xs">Issues:</p>
                <ul className="text-xs text-error space-y-xs">
                  {overall.blockers.map((blocker, index) => (
                    <li key={index}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard status for admin and analytics views
const DashboardStatus: React.FC<{
  wallet: any;
  filcdn: any;
  overall: any;
  onConnectWallet: () => void;
  onReinitializeFilCDN: () => void;
  onHealthCheck: () => void;
  className: string;
}> = ({
  wallet,
  filcdn,
  overall,
  onConnectWallet,
  onReinitializeFilCDN,
  onHealthCheck,
  className,
}) => {
  return (
    <div className={`grid grid-responsive-sm gap-md ${className}`}>
      {/* Wallet Card */}
      <Card variant="elevated" className="card-integration-service">
        <CardHeader
          title="Wallet Connection"
          action={
            <span
              className={`status-indicator ${
                wallet.isConnected ? "status-success" : "status-error"
              }`}
            >
              {wallet.isConnected ? "Connected" : "Disconnected"}
            </span>
          }
        />
        <CardContent>
          <div className="space-y-sm">
            {wallet.address && (
              <div>
                <span className="text-xs text-secondary">Address:</span>
                <p className="text-sm font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </p>
              </div>
            )}
            {wallet.chainId && (
              <div>
                <span className="text-xs text-secondary">Chain ID:</span>
                <p className="text-sm">{wallet.chainId}</p>
              </div>
            )}
            {!wallet.isConnected && (
              <Button size="sm" fullWidth onClick={onConnectWallet}>
                Connect Wallet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FilCDN Card */}
      <Card variant="elevated" className="card-integration-service">
        <CardHeader
          title="Storage System"
          action={
            <span
              className={`status-indicator ${
                filcdn.isInitialized ? "status-success" : "status-error"
              }`}
            >
              {filcdn.isInitialized ? "Ready" : "Not Ready"}
            </span>
          }
        />
        <CardContent>
          <div className="space-y-sm">
            {filcdn.stats && (
              <div>
                <span className="text-xs text-secondary">Network:</span>
                <p className="text-sm">
                  {(filcdn.stats as any).network || "Unknown"}
                </p>
              </div>
            )}
            {filcdn.error && (
              <div>
                <span className="text-xs text-error">Error:</span>
                <p className="text-xs text-error">{filcdn.error}</p>
              </div>
            )}
            {!filcdn.isInitialized && (
              <Button size="sm" fullWidth onClick={onReinitializeFilCDN}>
                Initialize Storage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Overview Card */}
      <Card variant="elevated" className="card-integration-overview">
        <CardHeader
          title="System Health"
          action={
            <Button size="sm" variant="ghost" onClick={onHealthCheck}>
              Check Health
            </Button>
          }
        />
        <CardContent>
          <div className="text-center space-y-sm">
            <div className={`text-4xl health-icon health-${overall.health}`}>
              {
                {
                  excellent: "💚",
                  good: "💛",
                  poor: "🧡",
                  critical: "❤️",
                }[overall.health]
              }
            </div>
            <p className="font-medium">
              {overall.isReady ? "All Systems Operational" : "Issues Detected"}
            </p>
            <p className="text-xs text-secondary">
              {overall.blockers.length === 0
                ? "Everything is working perfectly"
                : `${overall.blockers.length} issue${
                    overall.blockers.length === 1 ? "" : "s"
                  } need attention`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationStatus; // Integration Status Component
// ENHANCEMENT FIRST: Enhances existing status displays with unified experience
// PREVENT BLOAT: Consolidates multiple status components into single, focused component
// ORGANIZED: Predictable structure with domain-driven design

("use client");

import React from "react";
import { useIntegrationState } from "@/hooks/useIntegrationState";
import { Button } from "@/components/design-system/Button";
import { Card, CardHeader, CardContent } from "@/components/design-system/Card";
import { LoadingSpinner } from "@/components/shared/LoadingStates";

interface IntegrationStatusProps {
  variant?: "compact" | "detailed" | "dashboard";
  showActions?: boolean;
  className?: string;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  variant = "compact",
  showActions = true,
  className = "",
}) => {
  const {
    wallet,
    filcdn,
    overall,
    connectWallet,
    reinitializeFilCDN,
    initializeAll,
    runHealthCheck,
  } = useIntegrationState();

  if (variant === "compact") {
    return (
      <CompactStatus
        overall={overall}
        onInitialize={initializeAll}
        showActions={showActions}
        className={className}
      />
    );
  }

  if (variant === "dashboard") {
    return (
      <DashboardStatus
        wallet={wallet}
        filcdn={filcdn}
        overall={overall}
        onConnectWallet={connectWallet}
        onReinitializeFilCDN={reinitializeFilCDN}
        onHealthCheck={runHealthCheck}
        className={className}
      />
    );
  }

  return (
    <DetailedStatus
      wallet={wallet}
      filcdn={filcdn}
      overall={overall}
      onConnectWallet={connectWallet}
      onReinitializeFilCDN={reinitializeFilCDN}
      onInitializeAll={initializeAll}
      showActions={showActions}
      className={className}
    />
  );
};

// Compact status for mobile and space-constrained areas
const CompactStatus: React.FC<{
  overall: any;
  onInitialize: () => void;
  showActions: boolean;
  className: string;
}> = ({ overall, onInitialize, showActions, className }) => {
  const healthIcon = {
    excellent: "🟢",
    good: "🟡",
    poor: "🟠",
    critical: "🔴",
  }[overall.health];

  return (
    <div className={`flex items-center gap-sm ${className}`}>
      <span className="text-lg">{healthIcon}</span>
      <span className="text-sm text-secondary">
        {overall.isReady
          ? "All systems ready"
          : `${overall.blockers.length} issues`}
      </span>
      {showActions && !overall.isReady && (
        <Button size="sm" variant="primary" onClick={onInitialize}>
          Fix Issues
        </Button>
      )}
    </div>
  );
};

// Detailed status for settings and integration pages
const DetailedStatus: React.FC<{
  wallet: any;
  filcdn: any;
  overall: any;
  onConnectWallet: () => void;
  onReinitializeFilCDN: () => void;
  onInitializeAll: () => void;
  showActions: boolean;
  className: string;
}> = ({
  wallet,
  filcdn,
  overall,
  onConnectWallet,
  onReinitializeFilCDN,
  onInitializeAll,
  showActions,
  className,
}) => {
  return (
    <Card className={`card-integration ${className}`}>
      <CardHeader title="Integration Status" />
      <CardContent>
        <div className="space-y-md">
          {/* Wallet Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span
                className={`status-dot ${
                  wallet.isConnected ? "status-success" : "status-error"
                }`}
              />
              <span className="font-medium">Wallet</span>
            </div>
            <div className="flex items-center gap-sm">
              {wallet.isConnecting && <LoadingSpinner size="sm" />}
              <span className="text-sm text-secondary">
                {wallet.isConnected ? "Connected" : "Disconnected"}
              </span>
              {showActions && !wallet.isConnected && !wallet.isConnecting && (
                <Button size="sm" variant="outline" onClick={onConnectWallet}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* FilCDN Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span
                className={`status-dot ${
                  filcdn.isInitialized ? "status-success" : "status-error"
                }`}
              />
              <span className="font-medium">Storage</span>
            </div>
            <div className="flex items-center gap-sm">
              {filcdn.isInitializing && <LoadingSpinner size="sm" />}
              <span className="text-sm text-secondary">
                {filcdn.isInitialized ? "Ready" : "Not Ready"}
              </span>
              {showActions &&
                !filcdn.isInitialized &&
                !filcdn.isInitializing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReinitializeFilCDN}
                  >
                    Initialize
                  </Button>
                )}
            </div>
          </div>

          {/* Overall Status */}
          <div className="pt-md border-t border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className={`badge badge-${overall.health}`}>
                  {overall.health.toUpperCase()}
                </span>
                <span className="font-medium">Overall Health</span>
              </div>
              {showActions && (
                <Button
                  size="sm"
                  variant={overall.isReady ? "secondary" : "primary"}
                  onClick={overall.isReady ? onInitializeAll : onInitializeAll}
                >
                  {overall.isReady ? "Check Health" : "Fix All Issues"}
                </Button>
              )}
            </div>

            {overall.blockers.length > 0 && (
              <div className="mt-sm">
                <p className="text-xs text-secondary mb-xs">Issues:</p>
                <ul className="text-xs text-error space-y-xs">
                  {overall.blockers.map((blocker, index) => (
                    <li key={index}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard status for admin and analytics views
const DashboardStatus: React.FC<{
  wallet: any;
  filcdn: any;
  overall: any;
  onConnectWallet: () => void;
  onReinitializeFilCDN: () => void;
  onHealthCheck: () => void;
  className: string;
}> = ({
  wallet,
  filcdn,
  overall,
  onConnectWallet,
  onReinitializeFilCDN,
  onHealthCheck,
  className,
}) => {
  return (
    <div className={`grid grid-responsive-sm gap-md ${className}`}>
      {/* Wallet Card */}
      <Card variant="elevated" className="card-integration-service">
        <CardHeader
          title="Wallet Connection"
          action={
            <span
              className={`status-indicator ${
                wallet.isConnected ? "status-success" : "status-error"
              }`}
            >
              {wallet.isConnected ? "Connected" : "Disconnected"}
            </span>
          }
        />
        <CardContent>
          <div className="space-y-sm">
            {wallet.address && (
              <div>
                <span className="text-xs text-secondary">Address:</span>
                <p className="text-sm font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </p>
              </div>
            )}
            {wallet.chainId && (
              <div>
                <span className="text-xs text-secondary">Chain ID:</span>
                <p className="text-sm">{wallet.chainId}</p>
              </div>
            )}
            {!wallet.isConnected && (
              <Button size="sm" fullWidth onClick={onConnectWallet}>
                Connect Wallet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FilCDN Card */}
      <Card variant="elevated" className="card-integration-service">
        <CardHeader
          title="Storage System"
          action={
            <span
              className={`status-indicator ${
                filcdn.isInitialized ? "status-success" : "status-error"
              }`}
            >
              {filcdn.isInitialized ? "Ready" : "Not Ready"}
            </span>
          }
        />
        <CardContent>
          <div className="space-y-sm">
            {filcdn.stats && (
              <div>
                <span className="text-xs text-secondary">Network:</span>
                <p className="text-sm">
                  {(filcdn.stats as any).network || "Unknown"}
                </p>
              </div>
            )}
            {filcdn.error && (
              <div>
                <span className="text-xs text-error">Error:</span>
                <p className="text-xs text-error">{filcdn.error}</p>
              </div>
            )}
            {!filcdn.isInitialized && (
              <Button size="sm" fullWidth onClick={onReinitializeFilCDN}>
                Initialize Storage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Overview Card */}
      <Card variant="elevated" className="card-integration-overview">
        <CardHeader
          title="System Health"
          action={
            <Button size="sm" variant="ghost" onClick={onHealthCheck}>
              Check Health
            </Button>
          }
        />
        <CardContent>
          <div className="text-center space-y-sm">
            <div className={`text-4xl health-icon health-${overall.health}`}>
              {
                {
                  excellent: "💚",
                  good: "💛",
                  poor: "🧡",
                  critical: "❤️",
                }[overall.health]
              }
            </div>
            <p className="font-medium">
              {overall.isReady ? "All Systems Operational" : "Issues Detected"}
            </p>
            <p className="text-xs text-secondary">
              {overall.blockers.length === 0
                ? "Everything is working perfectly"
                : `${overall.blockers.length} issue${
                    overall.blockers.length === 1 ? "" : "s"
                  } need attention`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationStatus;
