import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter,
} from 'recharts';
import { motion } from 'framer-motion';
import { ChartCard } from '../components/analytics/ChartCard';
import { Button } from '../components/ui/Button';
import { Calendar } from 'lucide-react';

// --- Mock Data ---
const wasteData = [
    { name: 'Mon', plastic: 4, metal: 2, organic: 10, paper: 3 },
    { name: 'Tue', plastic: 3, metal: 1, organic: 8, paper: 4 },
    { name: 'Wed', plastic: 5, metal: 3, organic: 12, paper: 2 },
    { name: 'Thu', plastic: 2, metal: 1, organic: 9, paper: 5 },
    { name: 'Fri', plastic: 6, metal: 4, organic: 11, paper: 3 },
    { name: 'Sat', plastic: 8, metal: 5, organic: 15, paper: 6 },
    { name: 'Sun', plastic: 7, metal: 3, organic: 13, paper: 4 },
];

const pieData = [
    { name: 'Recycled', value: 75 },
    { name: 'Landfill', value: 25 },
];

const trendData = [
    { name: 'Week 1', points: 120 },
    { name: 'Week 2', points: 200 },
    { name: 'Week 3', points: 150 },
    { name: 'Week 4', points: 300 },
];

const scatterData = [
    { x: 10, y: 30, z: 200 },
    { x: 30, y: 200, z: 260 },
    { x: 45, y: 100, z: 400 },
    { x: 50, y: 400, z: 280 },
    { x: 70, y: 150, z: 100 },
    { x: 100, y: 250, z: 50 },
];

const COLORS = ['#8A9A5B', '#D2B48C', '#556B2F', '#A3B18A']; // New Palette
const PIE_COLORS = ['#8A9A5B', '#E5E7EB'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const AnalyticsPage: React.FC = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const [data, setData] = useState<any[]>(wasteData);
    const [stats, setStats] = useState<any>({
        total: '32 kg',
        rate: '85%',
        co2: '3.2 kg',
        points: '240'
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('grinify_token');
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/analytics?range=${timeRange}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Analytics fetch failed with status: ${response.status}`);
                }

                const result = await response.json();
                if (result.status === 'success') {
                    setData(result.data);
                    setStats({
                        total: result.stats.total_waste,
                        rate: result.stats.recycling_rate,
                        co2: result.stats.co2_saved,
                        points: result.stats.eco_points
                    });
                } else {
                    console.error("Backend error fetching analytics:", result.message);
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    const handleDateSelect = async () => {
        const token = localStorage.getItem('grinify_token');
        // mock date selection
        const mockDate = "2026-02-12";
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/analytics?range=daily&date=${mockDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Daily analytics fetch failed with status: ${response.status}`);
            }

            const result = await response.json();
            if (result.status === 'success') {
                setData(result.data);
                setTimeRange('daily');
            }
        } catch (err) {
            console.error("Date select failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Analytics</h1>
                    <p className="text-text-light mt-1">Deep dive into your eco-footprint and habits.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-light mr-2">Time Range:</span>
                    <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
                        {['Daily', 'Weekly', 'Monthly'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range.toLowerCase()
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-light hover:text-text hover:bg-gray-50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleDateSelect}
                        className="h-10 w-10 p-0 flex items-center justify-center bg-white border-gray-200"
                    >
                        <Calendar className="w-5 h-5 text-text-light" />
                    </Button>
                </div>
            </motion.div>

            {/* Summary Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {['Total Waste Scanned', 'Recycling Rate', 'CO2 Saved', 'Eco Points'].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-card border border-gray-100 card-hover">
                        <p className="text-xs text-text-light uppercase tracking-wider mb-2 font-bold">{stat}</p>
                        <p className="text-2xl font-bold text-text">
                            {[stats.total, stats.rate, stats.co2, stats.points][i]}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Waste Categories Bar Chart */}
                <motion.div variants={itemVariants}>
                    <ChartCard title={`Waste Composition (${timeRange})`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="plastic" stackId="a" fill={COLORS[0]} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="metal" stackId="a" fill={COLORS[1]} />
                                <Bar dataKey="organic" stackId="a" fill={COLORS[2]} />
                                <Bar dataKey="paper" stackId="a" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* Recycling Ratio Pie Chart */}
                <motion.div variants={itemVariants}>
                    <ChartCard title="Recycling Efficiency">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* Weekly Trend Line Chart */}
                <motion.div variants={itemVariants}>
                    <ChartCard title="Points Earned Trend">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="points" stroke="#8A9A5B" fillOpacity={1} fill="url(#colorPoints)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* Scatter Plot - Activity Time vs Intensity */}
                <motion.div variants={itemVariants}>
                    <ChartCard title="Activity Distribution">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="x" name="Time of Day" unit="h" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <YAxis type="number" dataKey="y" name="Waste Vol" unit="g" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Scatter name="Activity" data={scatterData} fill="#D2B48C">
                                    {scatterData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

            </div>
        </motion.div>
    );
};
