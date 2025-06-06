
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingPlan {
  title: string;
  price: string;
  period?: string;
  sessions?: string;
  savings?: string;
  popular?: boolean;
  features: string[];
}

interface ProgramPricingCardProps {
  plan: PricingPlan;
}

export const ProgramPricingCard: React.FC<ProgramPricingCardProps> = ({ plan }) => {
  return (
    <div className={`bg-gray-800 p-6 rounded-none border ${plan.popular ? 'border-[#00ffba]' : 'border-gray-700'} relative`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-[#00ffba] text-black px-4 py-1 text-sm font-bold rounded-none">
            POPULAR
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-white mb-2">{plan.title}</h4>
        <div className="text-3xl font-bold text-[#00ffba] mb-1">{plan.price}</div>
        {plan.period && (
          <div className="text-gray-400 text-sm">{plan.period}</div>
        )}
        {plan.sessions && (
          <div className="text-gray-300 text-sm mt-2">{plan.sessions}</div>
        )}
        {plan.savings && (
          <div className="text-[#00ffba] text-sm font-medium mt-2">{plan.savings}</div>
        )}
      </div>
      
      <div className="space-y-3 mb-6">
        {plan.features.map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-center gap-3">
            <Check className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
            <span className="text-gray-300 text-sm">{feature}</span>
          </div>
        ))}
      </div>
      
      <Button 
        className={`w-full rounded-none font-bold ${
          plan.popular 
            ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' 
            : 'bg-transparent border border-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        Choose Plan
      </Button>
    </div>
  );
};
