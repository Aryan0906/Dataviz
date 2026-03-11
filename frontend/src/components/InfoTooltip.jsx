import React from 'react';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const InfoTooltip = ({ content, side = 'top' }) => {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-[300px] text-sm bg-popover text-popover-foreground shadow-md border-border">
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default InfoTooltip;
