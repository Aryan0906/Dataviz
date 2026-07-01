import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export const DashboardTour = () => {
    const [run, setRun] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
        if (!hasSeenTour) {
            setRun(true);
        }
    }, []);

    const steps = [
        {
            target: 'body',
            content: 'Welcome to the Dataviz Analytics Platform! Let me show you around.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.tour-quick-actions',
            content: 'Here you can quickly upload a CSV, start a new analysis, or view your history.',
            placement: 'bottom',
        },
        {
            target: '.tour-features',
            content: 'Explore our powerful AI analytics and modeling tools.',
            placement: 'top',
        },
        {
            target: '.tour-templates',
            content: 'Not sure where to start? Try one of our pre-built templates!',
            placement: 'top',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenDashboardTour', 'true');
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#0F172A',
                    zIndex: 1000,
                },
                tooltipContainer: {
                    fontFamily: "'Raleway', sans-serif"
                },
                buttonNext: {
                    backgroundColor: '#D4AF37',
                    color: '#0F172A',
                    fontWeight: 600,
                    borderRadius: 0
                },
                buttonBack: {
                    color: '#6B6B6B',
                }
            }}
        />
    );
};
