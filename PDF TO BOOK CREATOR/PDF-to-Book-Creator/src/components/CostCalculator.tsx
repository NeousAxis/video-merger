import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CostCalculation, BookTemplate } from '@/types';
import { luluAPI } from '@/lib/lulu-api';
import { Calculator, Truck, Clock, Zap, DollarSign, Sparkles, TrendingUp, Package, Star, BookOpen, Ruler, FileText, Palette } from 'lucide-react';

interface CostCalculatorProps {
  template: BookTemplate;
  pageCount: number;
  onCostCalculated: (cost: CostCalculation) => void;
}

type ShippingLevel = 'MAIL' | 'GROUND' | 'EXPRESS';

const SHIPPING_OPTIONS = [
  {
    value: 'MAIL' as ShippingLevel,
    label: 'Standard Mail',
    icon: Clock,
    description: '5-7 business days',
    color: 'text-blue-500',
  },
  {
    value: 'GROUND' as ShippingLevel,
    label: 'Ground Shipping',
    icon: Truck,
    description: '3-5 business days',
    color: 'text-green-500',
  },
  {
    value: 'EXPRESS' as ShippingLevel,
    label: 'Express Shipping',
    icon: Zap,
    description: '1-2 business days',
    color: 'text-orange-500',
  },
];

export default function CostCalculator({ template, pageCount, onCostCalculated }: CostCalculatorProps) {
  const [quantity, setQuantity] = useState(1);
  const [shippingLevel, setShippingLevel] = useState<ShippingLevel>('GROUND');
  const [costCalculation, setCostCalculation] = useState<CostCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const cost = await luluAPI.calculateCost(template.podPackageId, pageCount, quantity);
      setCostCalculation(cost);
      onCostCalculated(cost);
    } catch (err) {
      setError('Failed to calculate cost. Please try again.');
      console.error('Cost calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculateCost();
  }, [template, pageCount, quantity, shippingLevel]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Calculator className="h-8 w-8 text-green-500" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Cost Calculation
          </h2>
          <TrendingUp className="h-8 w-8 text-emerald-500" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get an instant, transparent quote for professional book printing and shipping worldwide
        </p>
      </div>

      {/* Order Options */}
      <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Order Configuration
            </span>
            <Sparkles className="h-5 w-5 text-purple-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 10, 25, 50, 100].map((qty) => (
                    <SelectItem key={qty} value={qty.toString()}>
                      {qty} {qty === 1 ? 'copy' : 'copies'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Shipping Method</label>
              <Select value={shippingLevel} onValueChange={(value) => setShippingLevel(value as ShippingLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <Icon className={`h-4 w-4 mr-2 ${option.color}`} />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
        <Card className="border-2 border-gradient-to-r from-green-200 to-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Cost Breakdown
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          {isCalculating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gradient-to-r from-green-400 to-emerald-400 border-t-transparent"></div>
                  <Calculator className="absolute inset-0 m-auto h-6 w-6 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <span className="text-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Calculating costs...
                  </span>
                  <p className="text-sm text-muted-foreground">Getting the best rates for your book</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12 space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600 font-medium mb-2">Calculation Error</p>
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                  <Button onClick={calculateCost} variant="outline" className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100">
                    <Calculator className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
          ) : costCalculation ? (
            <div className="space-y-4">
              {/* Cost Items */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Unit Price ({quantity} {quantity === 1 ? 'copy' : 'copies'})</span>
                  <span>{formatCurrency(costCalculation.unitPrice * quantity)}</span>
                </div>
                
                {costCalculation.discounts > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(costCalculation.discounts)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Fulfillment Fee</span>
                  <span>{formatCurrency(costCalculation.fulfillmentFee)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Shipping ({SHIPPING_OPTIONS.find(opt => opt.value === shippingLevel)?.label})</span>
                  <span>{formatCurrency(costCalculation.shippingCost)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Taxes</span>
                  <span>{formatCurrency(costCalculation.taxes)}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Subtotal and Total */}
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(costCalculation.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Total</span>
                  <span>{formatCurrency(costCalculation.total)}</span>
                </div>
              </div>
              
              {/* Bulk Discount Info */}
              {quantity === 1 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-blue-500" />
                    <p className="text-sm text-blue-800 font-bold">💡 Pro Tip</p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Order multiple copies to save on per-unit costs and shipping! Bulk orders get better rates.
                  </p>
                </div>
              )}
              
              {/* Per Unit Cost */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Cost per copy</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(costCalculation.total / quantity)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cost calculation available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Specifications */}
      <Card className="border-2 border-gradient-to-r from-indigo-200 to-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Book Specifications
            </span>
            <Sparkles className="h-5 w-5 text-purple-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <p className="font-bold text-blue-800">Format</p>
              </div>
              <p className="text-blue-600 font-medium">{template.name}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Ruler className="h-4 w-4 text-green-600" />
                <p className="font-bold text-green-800">Size</p>
              </div>
              <p className="text-green-600 font-medium">{template.dimensions.width}" × {template.dimensions.height}"</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <p className="font-bold text-purple-800">Pages</p>
              </div>
              <p className="text-purple-600 font-medium">{pageCount}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Palette className="h-4 w-4 text-orange-600" />
                <p className="font-bold text-orange-800">Paper</p>
              </div>
              <p className="text-orange-600 font-medium">60# White</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}