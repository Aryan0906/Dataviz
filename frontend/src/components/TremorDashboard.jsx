import { Card, Metric, Text, Flex, ProgressBar, BadgeDelta, DonutChart, BarList } from '@tremor/react';
import { Activity, Clock } from 'lucide-react';

/**
 * Tremor Dashboard Components
 * Professional KPI cards and data widgets
 */

export const KPICard = ({ title, metric, delta, deltaType = 'increase', icon: Icon = Activity }) => {
    return (
        <Card decoration="top" decorationColor={deltaType === 'increase' ? 'emerald' : 'rose'}>
            <Flex alignItems="start">
                <div>
                    <Text>{title}</Text>
                    <Metric>{metric}</Metric>
                </div>
                <Icon className="h-6 w-6 text-muted-foreground" />
            </Flex>
            <Flex className="mt-4">
                <Text className="truncate">vs. last period</Text>
                <BadgeDelta deltaType={deltaType}>{delta}</BadgeDelta>
            </Flex>
        </Card>
    );
};

export const DataQualityCard = ({ dataPoints, missingValues, validationScore }) => {
    return (
        <Card>
            <Text>Data Quality Score</Text>
            <Metric>{validationScore}%</Metric>
            <ProgressBar value={validationScore} color="emerald" className="mt-2" />
            <Flex className="mt-4 gap-4">
                <div>
                    <Text>Total Points</Text>
                    <Text className="font-semibold text-lg">{dataPoints}</Text>
                </div>
                <div>
                    <Text>Missing Values</Text>
                    <Text className="font-semibold text-lg text-rose-500">{missingValues}</Text>
                </div>
            </Flex>
        </Card>
    );
};

export const ChartTypeDistribution = ({ data }) => {
    // data = [{ name: 'Bar Chart', value: 45 }, { name: 'Line Chart', value: 30 }, ...]

    return (
        <Card>
            <Text>Chart Type Usage</Text>
            <DonutChart
                className="mt-6"
                data={data}
                category="value"
                index="name"
                valueFormatter={(number) => `${number} charts`}
                colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
            />
        </Card>
    );
};

export const TopAnalysesCard = ({ analyses }) => {
    // analyses = [{ name: 'Sales Analysis', value: 1200 }, ...]

    return (
        <Card>
            <Text>Most Viewed Analyses</Text>
            <BarList data={analyses} className="mt-4" />
        </Card>
    );
};

export const RecentActivityCard = ({ activities }) => {
    return (
        <Card>
            <Flex alignItems="start">
                <div>
                    <Text>Recent Activity</Text>
                    <Metric>{activities.length}</Metric>
                </div>
                <Clock className="h-6 w-6 text-muted-foreground" />
            </Flex>
            <div className="mt-4 space-y-3">
                {activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-muted transition">
                        <div className="h-2 w-2 rounded-full bg-slate-500 mt-2" />
                        <div className="flex-1">
                            <Text className="font-medium">{activity.title}</Text>
                            <Text className="text-sm text-muted-foreground">{activity.time}</Text>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// Usage Example:
/*
import { KPICard, DataQualityCard, ChartTypeDistribution } from '@/components/TremorDashboard';

function DashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard 
                title="Total Analyses"
                metric="1,234"
                delta="+12.5%"
                deltaType="increase"
                icon={Database}
            />
            
            <KPICard 
                title="Active Users"
                metric="89"
                delta="+5.2%"
                deltaType="increase"
                icon={Activity}
            />
            
            <DataQualityCard 
                dataPoints={15000}
                missingValues={23}
                validationScore={98.5}
            />
            
            <div className="col-span-2">
                <ChartTypeDistribution data={[
                    { name: 'Regression', value: 45 },
                    { name: 'Categorical', value: 30 },
                    { name: 'Curve', value: 25 },
                ]} />
            </div>
        </div>
    );
}
*/
