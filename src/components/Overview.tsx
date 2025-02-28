import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { collection, query, onSnapshot } from "firebase/firestore";
import { firestore as db } from "../../firebaseApp";
import { getAuth } from "firebase/auth";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Order {
  totalCost: number;
  // Use createdAt if available, otherwise use creationDate
  createdAt: any;
  status: string;
}

const Overview = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const [overallTotal, setOverallTotal] = useState<number>(0);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Orders',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  });

  const auth = getAuth();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    // Query orders from whatsappInsuranceOrders collection
    const ordersQuery = query(collection(db, "whatsappInsuranceOrders"));
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          totalCost: data.totalCost || 0,
          // Use createdAt if available, otherwise fallback to creationDate
          createdAt: data.createdAt || data.creationDate,
          status: data.status || ""
        };
      });
      // Calculate overall total amount
      const total = orders.reduce((acc, order) => acc + order.totalCost, 0);
      setOverallTotal(total);
      processChartData(orders);
    });

    return () => unsubscribe();
  }, [timeFrame]);

  const processChartData = (orders: Order[]) => {
    const dataByTimeFrame = groupOrdersByTimeFrame(orders, timeFrame);
    setChartData({
      labels: dataByTimeFrame.labels,
      datasets: [
        {
          label: 'Policies',
          data: dataByTimeFrame.data,
          backgroundColor: 'rgba(0, 128, 0, 0.6)',
        },
      ],
    });
  };

  const groupOrdersByTimeFrame = (orders: Order[], timeFrame: TimeFrame) => {
    const salesByPeriod: { [key: string]: number } = {};
    
    orders.forEach((order) => {
      if (!order.createdAt) return;

      // Convert the date field into a Date object. It may be a Firebase Timestamp or a string.
      const orderDate = typeof order.createdAt.toDate === 'function' 
        ? order.createdAt.toDate() 
        : new Date(order.createdAt);

      let periodKey: string;

      switch (timeFrame) {
        case 'daily':
          periodKey = orderDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          break;
        case 'weekly':
          const weekNumber = getWeekNumber(orderDate);
          periodKey = `Week ${weekNumber}`;
          break;
        case 'monthly':
          periodKey = orderDate.toLocaleDateString('en-US', {
            month: 'long'
          });
          break;
        case 'yearly':
          periodKey = orderDate.getFullYear().toString();
          break;
        default:
          periodKey = orderDate.toLocaleDateString();
      }

      salesByPeriod[periodKey] = (salesByPeriod[periodKey] || 0) + order.totalCost;
    });

    // Sort the periods chronologically.
    const sortedPeriods = Object.entries(salesByPeriod).sort((a, b) => {
      if (timeFrame === 'monthly') {
        // Convert month names to Date objects for proper sorting (assume current year)
        return new Date(a[0] + ' 1, 2024').getTime() - new Date(b[0] + ' 1, 2024').getTime();
      }
      return a[0].localeCompare(b[0]);
    });

    return {
      labels: sortedPeriods.map(([label]) => label),
      data: sortedPeriods.map(([_, value]) => value)
    };
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Insurance Policies Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (RWF)'
        },
        ticks: {
          callback: (value: number) => `RWF ${value.toLocaleString()}`
        }
      }
    },
    animation: {
      duration: 1000,
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Insurance Orders Overview</h3>
        <div className="flex items-center">
          <label htmlFor="timeFrame" className="mr-2">Time frame:</label>
          <select
            id="timeFrame"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
            className="border rounded-md p-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      
      {/* Overall Total Summary */}
      <div className="mb-4 text-xl font-bold">
        Overall Total: RWF {overallTotal.toLocaleString()}
      </div>
      
      <div className="h-[400px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default Overview;
