import { ResponsiveLine } from '@nivo/line';
import { FC, ReactNode } from 'react';

type Props = {
    data: any[];
    className?: string;
};

const LineChart: FC<Props> = ({ data, className }) => {
    return (
        <div className={className}>
            <ResponsiveLine
                data={data}
                margin={{ top: 10, right: 0, bottom: 40, left: 45 }}
                xScale={{ type: 'time' }}
                yScale={{
                    type: 'linear',
                    stacked: true,
                }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'days',
                    legendOffset: 36,
                    legendPosition: 'middle',
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'spent',
                    legendOffset: -35,
                    legendPosition: 'middle',
                }}
                pointSize={4}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={8}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1,
                                },
                            },
                        ],
                    },
                ]}
            />
        </div>
    );
};

export default LineChart;
