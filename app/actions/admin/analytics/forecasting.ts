//app/actions/admin/analytics/forecasting.ts

"use server";

import { db } from "@/lib/prisma";
import { SalesForecast } from "./types";
import { startOfDay, subDays, addDays, format } from "date-fns";

/**
 * ADVANCED FORECASTING ENGINE
 * ------------------------------------------------
 * Uses Linear Regression (Least Squares Method) to predict future sales trends.
 * It analyzes the last 90 days of data to project the next 14 days.
 * 
 * Math: y = mx + c
 * m = slope (growth rate)
 * c = intercept (baseline)
 */
export async function getSalesForecast(): Promise<SalesForecast[]> {
  try {
    // 1. Fetch Historical Data (Last 90 Days for better accuracy)
    const historyStart = startOfDay(subDays(new Date(), 90));
    
    // Group orders by date
    const dailySales = await db.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: historyStart },
        status: { notIn: ["CANCELLED", "FAILED", "DRAFT"] }
      },
      _sum: { total: true },
    });

    // 2. Prepare Data Points for Regression
    // X = Day Index (0, 1, 2...), Y = Revenue
    const dataPoints: { x: number; y: number }[] = [];
    const dateMap = new Map<string, number>();

    // Normalize aggregation to fill gaps (days with 0 sales)
    // We treat the data as a continuous time series
    for (let i = 0; i < 90; i++) {
      const date = subDays(new Date(), 89 - i); // From 90 days ago to today
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Aggregate sales for that specific day (since groupBy returns timestamps)
      // Note: In real production with huge data, we would use raw SQL date_trunc, 
      // but here we sum efficiently in JS for flexibility.
      let dayTotal = 0;
      dailySales.forEach(record => {
        if (format(record.createdAt, 'yyyy-MM-dd') === dateStr) {
          dayTotal += record._sum.total || 0;
        }
      });

      dataPoints.push({ x: i, y: dayTotal });
    }

    // 3. Linear Regression Calculation
    // Formula: m = (NΣXY - ΣXΣY) / (NΣX² - (ΣX)²)
    //          b = (ΣY - mΣX) / N
    
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += (p.x * p.y);
      sumXX += (p.x * p.x);
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    // 4. Generate Predictions for Next 14 Days
    const forecast: SalesForecast[] = [];
    const volatilityFactor = 0.2; // 20% volatility buffer for confidence interval

    for (let i = 1; i <= 14; i++) {
      const futureDayIndex = 90 + i; // Predicting day 91, 92...
      const date = addDays(new Date(), i);
      
      // Calculate Predicted Revenue (y = mx + c)
      let predictedValue = (slope * futureDayIndex) + intercept;
      
      // Sanity check: Revenue shouldn't be negative
      if (predictedValue < 0) predictedValue = 0;

      // Calculate Confidence Intervals (Lower & Upper Bound)
      // We assume sales might fluctuate by ±20% (Standard Deviation proxy)
      const margin = predictedValue * volatilityFactor;

      forecast.push({
        date: format(date, 'MMM dd'),
        predictedRevenue: Math.round(predictedValue),
        lowerBound: Math.round(Math.max(0, predictedValue - margin)),
        upperBound: Math.round(predictedValue + margin)
      });
    }

    return forecast;

  } catch (error) {
    console.error("FORECASTING ERROR:", error);
    return []; // Return empty if math fails, don't crash dashboard
  }
}