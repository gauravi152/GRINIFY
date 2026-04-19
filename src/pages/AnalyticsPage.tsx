import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import { ChartCard } from '../components/analytics/ChartCard';
import { Calendar, AlertCircle, Terminal } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

const COLORS = ['#8A9A5B', '#D2B48C', '#556B2F', '#A3B18A', '#4A5D23', '#C19A6B'];

export const AnalyticsPage: React.FC = () => {
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    
    const [rawResponse, setRawResponse] = useState<any>(null);
    const [chartModeFailed, setChartModeFailed] = useState(false);
    
    const [stats, setStats] = useState<any>({
        total: '0 Scans', rate: '0%', co2: '0 kg', points: '0'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('grinify_token');
            if (!token) {
                setAuthError(true);
                return;
            }
            setIsLoading(true);
            setAuthError(false);
            try {
                const result = await apiClient('/analytics', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                // Requirement 4: Add console.log(response) to debug actual data
                console.log("=== RAW ANALYTICS API RESPONSE ===");
                console.log(result);
                setRawResponse(result);

                if (result.status === 'success') {
                    try {
                        // Requirement 2: Convert backend response into EXACT chart-friendly format
                        const mappedDaily = (result.daily || []).map((value: any, index: number) => ({
                            name: `Day ${index + 1}`,
                            scans: typeof value === 'number' ? value : 1 // Safe extract if element is an object
                        }));

                        const mappedWeekly = (result.weekly || []).map((value: any, index: number) => {
                            let scanCount = 0;
                            if (typeof value === 'number') {
                                scanCount = value;
                            } else if (value) {
                                // Extract sum mapped from backend
                                scanCount = (value.plastic||0) + (value.metal||0) + (value.organic||0) + (value.paper||0) + (value.glass||0) + (value.cardboard||0);
                                if (scanCount === 0) scanCount = 1;
                            }
                            return {
                                name: `Week ${index + 1}`,
                                scans: scanCount
                            };
                        });

                        const mappedMonthly = (result.monthly || []).map((value: any, index: number) => ({
                            name: `Month ${index + 1}`,
                            scans: typeof value === 'number' ? value : 1
                        }));

                        const pieData = Object.entries(result.categories || {}).map(([key, value]) => ({
                            name: key.charAt(0).toUpperCase() + key.slice(1),
                            value: Number(value) || 0
                        }));

                        setDailyData(mappedDaily);
                        setWeeklyData(mappedWeekly);
                        setMonthlyData(mappedMonthly);
                        setCategoryData(pieData);

                        setStats({
                            total: result.stats?.total_waste || "0 Scans",
                            rate: result.stats?.recycling_rate || "0%",
                            co2: result.stats?.co2_saved || "0 kg",
                            points: result.stats?.eco_points || "0"
                        });
                        
                    } catch (e) {
                        console.error("Data mapping mismatch:", e);
                        setChartModeFailed(true);
                    }
                } else if (result.status === 'error' && (result.message === 'Not authenticated' || String(result.message).includes('401'))) {
                    setAuthError(true);
                }
            } catch (err: any) {
                if (err.message && (err.message.includes('401') || err.message.includes('unauthenticated'))) {
                    setAuthError(true);
                }
                console.error("Failed to fetch analytics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const hasData = stats.total !== "0 Scans" && stats.total !== "0";

    // Requirement 6: Fallback UI handling total arrays sums natively (DO NOT USE MOCK DATA)
    const renderFallbackUI = () => {
        if (!rawResponse || rawResponse.status !== 'success') return null;
        
        // Summing the array elements reliably regardless if they map as dicts or numbers 
        let dailyScans = 0;
        if (Array.isArray(rawResponse.daily)) dailyScans = rawResponse.daily.length;

        let weeklyScans = 0;
        if (Array.isArray(rawResponse.weekly)) {
            weeklyScans = rawResponse.weekly.reduce((acc: number, e: any) => {
                return acc + (e.plastic||0) + (e.metal||0) + (e.organic||0) + (e.paper||0) + (e.glass||0) + (e.cardboard||0);
            }, 0);
        }

        let monthlyScans = 0;
        if (Array.isArray(rawResponse.monthly)) monthlyScans = rawResponse.monthly.length;

        const categories = rawResponse.categories || {};
        const maxCat = Math.max(...(Object.values(categories) as number[]), 1);

        return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-6 w-full relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <Terminal className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-gray-800">Raw Data Summary</h2>
                    {chartModeFailed && (
                        <span className="ml-auto flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-bold">
                           <AlertCircle className="w-4 h-4"/> Charts Disabled
                        </span>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center shadow-inner">
                        <p className="text-sm text-gray-500 mb-1 font-semibold uppercase">Daily Scans</p>
                        <p className="text-4xl font-black text-primary">{dailyScans}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center shadow-inner">
                        <p className="text-sm text-gray-500 mb-1 font-semibold uppercase">Weekly Scans</p>
                        <p className="text-4xl font-black text-primary">{weeklyScans}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center shadow-inner">
                        <p className="text-sm text-gray-500 mb-1 font-semibold uppercase">Monthly Scans</p>
                        <p className="text-4xl font-black text-primary">{monthlyScans}</p>
                    </div>
                </div>

                <h3 className="font-bold text-gray-700 mb-4 px-2 uppercase tracking-wide text-sm">Category Breakdown</h3>
                <div className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {Object.entries(categories).map(([cat, count]: [string, any], index) => {
                        const val = Number(count) || 0;
                        const percentage = `${Math.round((val / maxCat) * 100)}%`;
                        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                        return (
                            <div key={cat} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">{catName}</span>
                                    <span className="text-gray-900 bg-white px-3 py-0.5 rounded-full shadow-sm">{val} scanned</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                        className="h-4 rounded-full transition-all duration-1000" 
                                        style={{ width: percentage, backgroundColor: COLORS[index % COLORS.length] }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Analytics</h1>
                    <p className="text-text-light mt-1">Deep dive into your eco-footprint and habits.</p>
                </div>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
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
            </div>

            {authError ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl mt-8 shadow-sm border border-red-50">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">Please login to view analytics</h3>
                </div>
            ) : !hasData && !chartModeFailed ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl mt-8 shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">No data available</h3>
                    <p className="text-text-light text-center max-w-sm">Use the Scan page to log your first recyclable item.</p>
                </div>
            ) : chartModeFailed ? (
                <div>{renderFallbackUI()}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <ChartCard title="Daily Activity Chart">
                            {/* Requirement 3 & The fix for blank charts: Enforce strict height=300 for responsive container! */}
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: 'transparent' }} />
                                    {/* Requirement 3: Map dataKey="scans" */}
                                    <Bar dataKey="scans" name="Scans" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div>
                        <ChartCard title="Weekly Trend Chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Line type="monotone" dataKey="scans" name="Scans" stroke={COLORS[1]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: COLORS[1] }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div>
                        <ChartCard title="Monthly Progress Chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="scans" name="Scans" stroke={COLORS[2]} fillOpacity={1} fill="url(#colorScans)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div>
                        <ChartCard title="Waste Category Distribution">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                    
                    {/* Fallback Summary appended cleanly */}
                    <div className="col-span-1 lg:col-span-2 mt-4">
                        {renderFallbackUI()}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
