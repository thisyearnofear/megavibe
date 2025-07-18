import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClass = size !== "md" ? `loading-spinner-${size}` : "";
  return <div className={`loading-spinner ${sizeClass} ${className}`} />;
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className = "" }) => (
  <div className={`loading-dots ${className}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = "100%",
  height = "1rem",
  className = "",
  rounded = false,
}) => (
  <div
    className={`loading-skeleton ${
      rounded ? "rounded-full" : "rounded"
    } ${className}`}
    style={{ width, height }}
  />
);

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyState,
  isEmpty = false,
}) => {
  if (loading) {
    return (
      <div className="flex-center p-xl">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center flex-col p-xl text-center">
        {errorComponent || (
          <>
            <div className="text-error text-2xl mb-md">⚠️</div>
            <p className="text-error mb-md">{error}</p>
            <p className="text-secondary text-sm">Please try again later</p>
          </>
        )}
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return <div className="flex-center p-xl">{emptyState}</div>;
  }

  return <>{children}</>;
};

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  className = "",
}) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`card-base card-padding ${className}`}>
        <div className="flex gap-md mb-md">
          <LoadingSkeleton width={48} height={48} rounded />
          <div className="flex-1">
            <LoadingSkeleton width="60%" height="1.25rem" className="mb-xs" />
            <LoadingSkeleton width="40%" height="1rem" />
          </div>
        </div>
        <LoadingSkeleton height="4rem" className="mb-md" />
        <div className="flex gap-sm">
          <LoadingSkeleton width="30%" height="2rem" />
          <LoadingSkeleton width="25%" height="2rem" />
        </div>
      </div>
    ))}
  </>
);

interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  className = "",
}) => (
  <div className={`flex flex-col gap-md ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex gap-md p-md">
        <LoadingSkeleton width={40} height={40} rounded />
        <div className="flex-1">
          <LoadingSkeleton width="70%" height="1rem" className="mb-xs" />
          <LoadingSkeleton width="50%" height="0.875rem" />
        </div>
        <LoadingSkeleton width="20%" height="1rem" />
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`flex-center flex-col p-xl text-center ${className}`}>
    {icon && <div className="text-4xl mb-md opacity-50">{icon}</div>}
    <h3 className="text-lg font-semibold text-primary mb-xs">{title}</h3>
    {description && (
      <p className="text-secondary mb-lg max-w-md">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);
