"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useRef } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: {
    value: number;
    direction: "up" | "down";
    label: string;
  };
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconBg,
  trend,
  onClick,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumeric = typeof value === "number" || !isNaN(Number(value.toString().replace(/[^0-9.-]+/g,"")));
  const numericValue = isNumeric ? Number(value.toString().replace(/[^0-9.-]+/g,"")) : 0;
  const prefix = isNumeric ? value.toString().replace(/[0-9.,]+.*/, '') : '';
  const suffix = isNumeric ? value.toString().replace(/.*?[0-9.,]+/, '') : value;
  
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && isNumeric) {
      let start = 0;
      const end = numericValue;
      const duration = 800; // 0.8s
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, isNumeric, numericValue]);

  const formattedValue = isNumeric 
    ? `${prefix}${displayValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`
    : value;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={`bg-surface p-4 sm:p-5 rounded-lg shadow-card border border-border flex flex-col justify-between h-full gap-4 ${
        onClick ? "cursor-pointer hover:shadow-dropdown transition-shadow" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <h3 className="font-medium text-text-secondary md:text-md">{title}</h3>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-xl sm:text-2xl font-display font-bold text-text-primary">
          {isNumeric && !isInView ? "0" : formattedValue}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <div className={`flex items-center font-medium ${trend.direction === "up" ? "text-status-success-text" : "text-status-danger-text"}`}>
              {trend.direction === "up" ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trend.direction === "up" ? "+" : "-"}{trend.value}%
            </div>
            <span className="text-text-muted text-xs">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
