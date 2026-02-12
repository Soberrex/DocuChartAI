import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Box, Paper, Typography, useTheme } from '@mui/material';

interface ChartVisualizerProps {
    data: any;
    title?: string;
    type?: 'bar' | 'line' | 'pie';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartVisualizer: React.FC<ChartVisualizerProps> = ({ data, title, type = 'bar' }) => {
    const theme = useTheme();

    if (!data || !data.data || data.data.length === 0) {
        return null;
    }

    const chartData = data.data;
    const dataKeys = Object.keys(chartData[0]).filter((key) => key !== 'name');

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.primary,
                            }}
                        />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 8 }}
                            />
                        ))}
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={dataKeys[0]} // Pie charts typically visualize one metric
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.primary,
                            }}
                        />
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.primary,
                            }}
                        />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mt: 2,
                mb: 2,
                width: '100%',
                height: 400,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            {title && (
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
                    {title}
                </Typography>
            )}
            <ResponsiveContainer width="100%" height="90%">
                {renderChart()}
            </ResponsiveContainer>
        </Paper>
    );
};

export default ChartVisualizer;
