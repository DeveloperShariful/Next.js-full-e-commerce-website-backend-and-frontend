//app/actions/admin/analytics/forecasting.ts

"use server";

import { db } from "@/lib/prisma";
import { SalesForecast } from "./types";
import { startOfDay, subDays, addDays, format } from "date-fns";

export async function getSalesForecast(): Promise<SalesForecast[]> {
  try {
    const historyStart = startOfDay(subDays(new Date(), 90));
    
    const dailySales = await db.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: historyStart },
        status: { notIn: ["CANCELLED", "FAILED", "DRAFT"] }
      },
      _sum: { total: true },
    });

    const dataPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < 90; i++) {
      const date = subDays(new Date(), 89 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      let dayTotal = 0;
      dailySales.forEach(record => {
        if (format(record.createdAt, 'yyyy-MM-dd') === dateStr) {
          // ✅ FIX: Decimal -> Number
          dayTotal += Number(record._sum.total || 0);
        }
      });

      dataPoints.push({ x: i, y: dayTotal });
    }

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

    const forecast: SalesForecast[] = [];
    const volatilityFactor = 0.2;

    for (let i = 1; i <= 14; i++) {
      const futureDayIndex = 90 + i; 
      const date = addDays(new Date(), i);
      
      let predictedValue = (slope * futureDayIndex) + intercept;
      
      if (predictedValue < 0) predictedValue = 0;

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
    return [];
  }
}