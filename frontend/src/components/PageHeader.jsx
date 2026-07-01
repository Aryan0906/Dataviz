import React from 'react';

/**
 * Reusable page header component with title, description, and optional badge/actions.
 * Used across all pages for consistent header formatting.
 */
const PageHeader = ({ title, description, badge, badgeVariant = 'default', icon: Icon, actions, className = '' }) => {
    const badgeColors = {
        default: 'bg-muted text-muted-foreground',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    };

    return (
        <div className={`mb-8 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/5 dark:bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {badge && (
                                <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeColors[badgeVariant]}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground max-w-2xl mt-2">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
            <div className="mt-4 border-b border-border" />
        </div>
    );
};

export default PageHeader;
