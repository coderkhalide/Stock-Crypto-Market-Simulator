# Stock/Crypto Market Simulator

Stock/Crypto Market Simulator is a React-based application that simulates a market with dynamic order execution, price updates, and volume tracking. It allows users to place both market and limit orders while displaying real-time price, market cap, volume, and supply information. The simulator includes interactive charts for price and volume, and an aggregated order book for both bids and asks.

## Features

- **Real-Time Market Data:**  
  Displays the current price, market cap, volume, and supply.

- **Dynamic Price & Volume Charts:**  
  Uses Recharts to render a line chart for price history and a bar chart for volume history.

- **Order Book Visualization:**  
  Shows both bids (limit buy orders) and asks (limit sell orders) in separate area charts. Orders with the same price are aggregated in the charts, while the detailed list allows for individual removal.

- **Market and Limit Orders:**  
  Place market orders to execute immediately or limit orders that are added to the order book if conditions are met.
  
- **Validation for Limit Orders:**  
  - **Limit Buy Orders:** Must be placed below the current price.
  - **Limit Sell Orders:** Must be placed above the current price.

- **Order Activity Log:**  
  A log displays market activities and validations in real-time.

## Installation

 **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

## Usage

1. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser:**

   Navigate to `http://localhost:5173` to view the application.

3. **Place Orders:**

   - **Market Orders:**  
     Select the "Market Order" option and specify the amount to buy or sell. These orders execute immediately at the current market price.
  
   - **Limit Orders:**  
     Select the "Limit Order" option, input the desired limit price and amount.  
     - **Validation:**  
       - Limit buy orders must be below the current price.
       - Limit sell orders must be above the current price.
  
   - **Order Book:**  
     View individual orders in the order book lists for bids and asks. Each order can be removed individually.

4. **Charts & Logs:**  
   - The **Price Chart** shows the price history as a line chart.
   - The **Volume Chart** shows trade volume as a bar chart.
   - The **Activity Log** provides real-time feedback on market actions and validations.

## Code Structure

- **`MarketSimulator.jsx`:**  
  The main component that contains the logic for order matching, price updates, chart data aggregation, and rendering of UI components.
  
- **Components & Libraries:**  
  - **Recharts:** For rendering the charts.
  - **Custom UI Components:** For cards, buttons, inputs, and select dropdowns.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you have suggestions or improvements.