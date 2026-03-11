import React from 'react';
import { Leaf, Recycle, Trash2 } from 'lucide-react';

// Mock type for now
type ActivityType = 'recycle' | 'scan' | 'earn';

interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    points: number;
    timestamp: string;
    category?: string;
}

export const ActivityFeed: React.FC = () => {
    const activities: Activity[] = [
        { id: '1', type: 'scan', title: 'Scanned Plastic Bottle', points: 10, timestamp: '2 mins ago', category: 'Plastic' },
        { id: '2', type: 'recycle', title: 'Recycled Paper', points: 50, timestamp: '2 hours ago', category: 'Paper' },
        { id: '3', type: 'earn', title: 'Daily Login Bonus', points: 5, timestamp: '5 hours ago' },
        { id: '4', type: 'scan', title: 'Scanned Aluminum Can', points: 15, timestamp: 'Yesterday', category: 'Metal' },
    ];

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case 'recycle': return <Recycle className="w-5 h-5 text-green-500" />;
            case 'scan': return <Trash2 className="w-5 h-5 text-blue-500" />;
            case 'earn': return <Leaf className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
                {activities.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                {getIcon(item.type)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.timestamp}</p>
                            </div>
                        </div>
                        <span className="font-bold text-primary">+{item.points} pts</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
