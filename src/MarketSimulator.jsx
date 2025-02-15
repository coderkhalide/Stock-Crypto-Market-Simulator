import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

const MarketSimulator = () => {
    const [price, setPrice] = useState(10.00);
    const [marketCap, setMarketCap] = useState(10000);
    const [supply] = useState(1000);
    const [volume, setVolume] = useState(0);
    const [orderType, setOrderType] = useState('market');
    const [limitPrice, setLimitPrice] = useState('');
    const [logs, setLogs] = useState([]);

    const [priceHistory, setPriceHistory] = useState([
        { time: 0, price: 1.00 }
    ]);

    // Volume history for the volume chart (each trade's volume)
    const [volumeHistory, setVolumeHistory] = useState([]);

    const [orderBook, setOrderBook] = useState({
        bids: [
            { id: 'b1', price: 9, quantity: 50, type: 'limit' },
            { id: 'b2', price: 8, quantity: 30, type: 'limit' },
            { id: 'b3', price: 7, quantity: 20, type: 'limit' }
        ],
        asks: [
            { id: 'a1', price: 11, quantity: 25, type: 'limit' },
            { id: 'a2', price: 12, quantity: 35, type: 'limit' },
            { id: 'a3', price: 13, quantity: 40, type: 'limit' }
        ]
    });

    const [buyAmount, setBuyAmount] = useState('');
    const [sellAmount, setSellAmount] = useState('');

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 49)]);
    };

    const updatePrice = (newPrice, reason) => {
        setPrice(newPrice);
        setMarketCap(newPrice * supply);
        setPriceHistory(prev => [...prev, {
            time: prev.length,
            price: newPrice
        }]);
        addLog(`Price updated to $${newPrice.toFixed(3)} - ${reason}`);
    };

    const matchOrders = (orderType, isBuy, amount, limitPriceValue = null) => {
        let remainingAmount = parseFloat(amount);
        let totalCost = 0;
        let executedQuantity = 0;

        if (isBuy) {
            const sortedAsks = [...orderBook.asks].sort((a, b) => a.price - b.price);
            const matchingOrders = [];

            for (const ask of sortedAsks) {
                if (orderType === 'limit' && ask.price > limitPriceValue) break;

                const matchQuantity = Math.min(remainingAmount, ask.quantity);
                if (matchQuantity > 0) {
                    matchingOrders.push({
                        id: ask.id,
                        quantity: matchQuantity,
                        price: ask.price
                    });
                    totalCost += matchQuantity * ask.price;
                    executedQuantity += matchQuantity;
                    remainingAmount -= matchQuantity;
                }
                if (remainingAmount <= 0) break;
            }

            if (executedQuantity > 0) {
                const avgPrice = totalCost / executedQuantity;
                updatePrice(avgPrice, `Buy order executed: ${executedQuantity} units at avg price $${avgPrice.toFixed(3)}`);
                // Record trade volume for volume chart
                setVolumeHistory(prev => [...prev, { time: priceHistory.length, volume: totalCost }]);

                // Update order book: remove or update matched asks
                setOrderBook(prev => {
                    const newAsks = prev.asks.map(ask => {
                        const matchingOrder = matchingOrders.find(o => o.id === ask.id);
                        if (matchingOrder) {
                            return {
                                ...ask,
                                quantity: ask.quantity - matchingOrder.quantity
                            };
                        }
                        return ask;
                    }).filter(ask => ask.quantity > 0);

                    return { ...prev, asks: newAsks };
                });
            }

            // For limit orders, add the remainder as a new limit order if any remains
            if (remainingAmount > 0 && orderType === 'limit') {
                addLimitOrder(true, remainingAmount, limitPriceValue);
            }
        } else {
            // Sell orders
            const sortedBids = [...orderBook.bids].sort((a, b) => b.price - a.price);
            const matchingOrders = [];

            for (const bid of sortedBids) {
                if (orderType === 'limit' && bid.price < limitPriceValue) break;

                const matchQuantity = Math.min(remainingAmount, bid.quantity);
                if (matchQuantity > 0) {
                    matchingOrders.push({
                        id: bid.id,
                        quantity: matchQuantity,
                        price: bid.price
                    });
                    totalCost += matchQuantity * bid.price;
                    executedQuantity += matchQuantity;
                    remainingAmount -= matchQuantity;
                }
                if (remainingAmount <= 0) break;
            }

            if (executedQuantity > 0) {
                const avgPrice = totalCost / executedQuantity;
                updatePrice(avgPrice, `Sell order executed: ${executedQuantity} units at avg price $${avgPrice.toFixed(3)}`);
                // Record trade volume for volume chart
                setVolumeHistory(prev => [...prev, { time: priceHistory.length, volume: totalCost }]);

                // Update order book: remove or update matched bids
                setOrderBook(prev => {
                    const newBids = prev.bids.map(bid => {
                        const matchingOrder = matchingOrders.find(o => o.id === bid.id);
                        if (matchingOrder) {
                            return {
                                ...bid,
                                quantity: bid.quantity - matchingOrder.quantity
                            };
                        }
                        return bid;
                    }).filter(bid => bid.quantity > 0);

                    return { ...prev, bids: newBids };
                });
            }

            // For limit orders, add the remainder as a new limit order if any remains
            if (remainingAmount > 0 && orderType === 'limit') {
                addLimitOrder(false, remainingAmount, limitPriceValue);
            }
        }

        setVolume(prev => prev + totalCost);
        return executedQuantity > 0;
    };

    const addLimitOrder = (isBuy, quantity, price) => {
        const orderId = `${isBuy ? 'b' : 'a'}${Date.now()}`;
        const newOrder = {
            id: orderId,
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            type: 'limit'
        };

        setOrderBook(prev => {
            if (isBuy) {
                const newBids = [...prev.bids, newOrder].sort((a, b) => b.price - a.price);
                addLog(`Added limit buy order: ${quantity} units at $${price}`);
                return { ...prev, bids: newBids };
            } else {
                const newAsks = [...prev.asks, newOrder].sort((a, b) => a.price - b.price);
                addLog(`Added limit sell order: ${quantity} units at $${price}`);
                return { ...prev, asks: newAsks };
            }
        });
    };

    // Function to remove a limit order from the order book
    const removeLimitOrder = (id, isBuy) => {
        setOrderBook(prev => {
            if (isBuy) {
                const newBids = prev.bids.filter(order => order.id !== id);
                addLog(`Removed limit buy order: ${id}`);
                return { ...prev, bids: newBids };
            } else {
                const newAsks = prev.asks.filter(order => order.id !== id);
                addLog(`Removed limit sell order: ${id}`);
                return { ...prev, asks: newAsks };
            }
        });
    };

    const executeBuy = () => {
        const amount = parseFloat(buyAmount);
        if (isNaN(amount) || amount <= 0) return;

        if (orderType === 'market') {
            matchOrders('market', true, amount);
            addLog(`Market buy order placed: ${amount} units`);
        } else {
            const limit = parseFloat(limitPrice);
            if (isNaN(limit) || limit <= 0) return;
            // For limit buy, the limit price must be less than the current price.
            if (limit >= price) {
                addLog(`Error: Limit buy price $${limit} must be less than current price $${price.toFixed(3)}`);
                return;
            }
            matchOrders('limit', true, amount, limit);
            addLog(`Limit buy order placed: ${amount} units at $${limit}`);
        }

        setBuyAmount('');
        setLimitPrice('');
    };

    const executeSell = () => {
        const amount = parseFloat(sellAmount);
        if (isNaN(amount) || amount <= 0) return;

        if (orderType === 'market') {
            matchOrders('market', false, amount);
            addLog(`Market sell order placed: ${amount} units`);
        } else {
            const limit = parseFloat(limitPrice);
            if (isNaN(limit) || limit <= 0) return;
            // For limit sell, the limit price must be greater than the current price.
            if (limit <= price) {
                addLog(`Error: Limit sell price $${limit} must be greater than current price $${price.toFixed(3)}`);
                return;
            }
            matchOrders('limit', false, amount, limit);
            addLog(`Limit sell order placed: ${amount} units at $${limit}`);
        }

        setSellAmount('');
        setLimitPrice('');
    };

    // Aggregate orders by price for charting purposes.
    // Aggregated bids: group by price (toFixed(3)) and sum quantities.
    const aggregatedBids = Object.values(
        orderBook.bids.reduce((acc, order) => {
            const key = order.price.toFixed(3);
            if (acc[key]) {
                acc[key].quantity += order.quantity;
            } else {
                acc[key] = { price: order.price, quantity: order.quantity };
            }
            return acc;
        }, {})
    ).sort((a, b) => b.price - a.price);

    // Aggregated asks: group by price (toFixed(3)) and sum quantities.
    const aggregatedAsks = Object.values(
        orderBook.asks.reduce((acc, order) => {
            const key = order.price.toFixed(3);
            if (acc[key]) {
                acc[key].quantity += order.quantity;
            } else {
                acc[key] = { price: order.price, quantity: order.quantity };
            }
            return acc;
        }, {})
    ).sort((a, b) => a.price - b.price);


    const getLogColor = (log) => {
        if (log.includes('Market buy order')) {
            return 'green';
        } else if (log.includes('Market sell order')) {
            return 'purple';
        } else if (log.includes('Error')) {
            return '#DC2627';
        }
        return 'black';
    }

    return (
        <div className="w-full max-w-6xl space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl text-center">Market Simulator</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Current Price</div>
                            <div className="text-xl font-bold">${price.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Market Cap</div>
                            <div className="text-xl font-bold">${marketCap.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Volume</div>
                            <div className="text-xl font-bold">${volume.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Supply</div>
                            <div className="text-xl font-bold">{supply}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-lg font-semibold mb-2">Price Chart</div>
                            <LineChart width={400} height={200} data={priceHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis domain={['auto', 'auto']} />
                                <Tooltip />
                                <Line type="monotone" dataKey="price" stroke="#2563eb" />
                            </LineChart>

                        </div>
                        <div className="">
                            <div className="text-lg font-semibold mb-2">Volume Chart</div>
                            <BarChart width={400} height={200} data={volumeHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="volume" fill="#a855f7" />
                            </BarChart>
                        </div>


                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <div className="text-lg font-semibold mb-2">Order Book - Bids (Limit Orders)</div>
                            <AreaChart width={280} height={150} data={aggregatedBids}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="price" />
                                <YAxis dataKey="quantity" />
                                <Tooltip />
                                <Area type="monotone" dataKey="quantity" fill="#22c55e" stroke="#16a34a" />
                            </AreaChart>
                            <div className="mt-2">
                                {orderBook.bids.map(order => (
                                    <div key={order.id} className="flex justify-between items-center text-sm border-b py-1">
                                        <span>{order.quantity} @ ${order.price.toFixed(3)}</span>
                                        <Button variant="destructive" size="sm" onClick={() => removeLimitOrder(order.id, true)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold mb-2">Order Book - Asks (Limit Orders)</div>
                            <AreaChart width={280} height={150} data={aggregatedAsks}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="price" />
                                <YAxis dataKey="quantity" />
                                <Tooltip />
                                <Area type="monotone" dataKey="quantity" fill="#ef4444" stroke="#dc2626" />
                            </AreaChart>
                            <div className="mt-2">
                                {orderBook.asks.map(order => (
                                    <div key={order.id} className="flex justify-between items-center text-sm border-b py-1">
                                        <span>{order.quantity} @ ${order.price.toFixed(3)}</span>
                                        <Button variant="destructive" size="sm" onClick={() => removeLimitOrder(order.id, false)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center justify-between mt-4'>
                        <div className='mr-4'>
                            <Select value={orderType} onValueChange={setOrderType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Order Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="market" >Market Order</SelectItem>
                                    <SelectItem value="limit">Limit Order</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                {orderType === 'limit' && (
                                    <Input
                                        type="number"
                                        value={limitPrice}
                                        onChange={(e) => setLimitPrice(e.target.value)}
                                        placeholder="Limit Price"
                                        step="1"
                                    />
                                )}

                                <div className="flex space-x-2">
                                    <Input
                                        type="number"
                                        value={buyAmount}
                                        onChange={(e) => setBuyAmount(e.target.value)}
                                        placeholder="Amount to buy"
                                        className="flex-1"
                                    />
                                    <Button onClick={executeBuy} className="bg-green-600 hover:bg-green-700">
                                        Buy
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {orderType === 'limit' && <div className="h-10" />}

                                <div className="flex space-x-2">
                                    <Input
                                        type="number"
                                        value={sellAmount}
                                        onChange={(e) => setSellAmount(e.target.value)}
                                        placeholder="Amount to sell"
                                        className="flex-1"
                                    />
                                    <Button onClick={executeSell} className="bg-red-600 hover:bg-red-700">
                                        Sell
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='mt-5'>
                        <div className="text-lg font-semibold mb-2">Market Activity Log</div>
                        <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded">
                            {logs.map((log, index) => (
                                <div key={index} className="text-sm mb-1"
                                    style={{ 
                                        color: getLogColor(log),
                                     }}
                                >{log}</div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MarketSimulator;
