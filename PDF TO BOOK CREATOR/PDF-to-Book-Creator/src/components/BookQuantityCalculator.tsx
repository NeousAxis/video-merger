import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Package, DollarSign, TrendingDown, Info } from 'lucide-react';
import { CostCalculation } from '@/types';

interface BookQuantityCalculatorProps {
  pageCount: number;
  bookFormat: {
    width: number;
    height: number;
    paperType: string;
    bindingType: string;
  };
  onQuantityChange: (quantity: number, costs: CostCalculation) => void;
}

const BookQuantityCalculator: React.FC<BookQuantityCalculatorProps> = ({
  pageCount,
  bookFormat,
  onQuantityChange
}) => {
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [costs, setCosts] = useState<CostCalculation>({
    printingCost: 0,
    shippingCost: 0,
    totalCost: 0,
    costPerUnit: 0,
    estimatedRetailPrice: 0,
    profitMargin: 0
  });

  const presetQuantities = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

  // Base costs (these would normally come from Lulu API)
  const baseCosts = {
    paperback: {
      base: 2.50,
      perPage: 0.012
    },
    hardcover: {
      base: 4.50,
      perPage: 0.015
    },
    premium: {
      base: 3.50,
      perPage: 0.018
    }
  };

  const calculateCosts = (qty: number): CostCalculation => {
    const bindingType = bookFormat.bindingType.toLowerCase();
    const costConfig = baseCosts[bindingType as keyof typeof baseCosts] || baseCosts.paperback;
    
    // Base printing cost per unit
    const baseUnitCost = costConfig.base + (pageCount * costConfig.perPage);
    
    // Volume discounts
    let volumeDiscount = 0;
    if (qty >= 1000) volumeDiscount = 0.25;
    else if (qty >= 500) volumeDiscount = 0.20;
    else if (qty >= 250) volumeDiscount = 0.15;
    else if (qty >= 100) volumeDiscount = 0.10;
    else if (qty >= 50) volumeDiscount = 0.05;
    
    const discountedUnitCost = baseUnitCost * (1 - volumeDiscount);
    const printingCost = discountedUnitCost * qty;
    
    // Shipping calculation (simplified)
    let shippingCost = 0;
    if (qty <= 5) shippingCost = 5.99;
    else if (qty <= 25) shippingCost = 12.99;
    else if (qty <= 100) shippingCost = 24.99;
    else shippingCost = Math.max(24.99, qty * 0.25);
    
    const totalCost = printingCost + shippingCost;
    const costPerUnit = totalCost / qty;
    
    // Suggested retail price (typically 4-6x printing cost)
    const estimatedRetailPrice = Math.ceil(discountedUnitCost * 5.5);
    const profitMargin = ((estimatedRetailPrice - costPerUnit) / estimatedRetailPrice) * 100;
    
    return {
      printingCost: Math.round(printingCost * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      estimatedRetailPrice,
      profitMargin: Math.round(profitMargin * 100) / 100
    };
  };

  useEffect(() => {
    const newCosts = calculateCosts(quantity);
    setCosts(newCosts);
    onQuantityChange(quantity, newCosts);
  }, [quantity, pageCount, bookFormat]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    setCustomQuantity('');
  };

  const handleCustomQuantitySubmit = () => {
    const qty = parseInt(customQuantity);
    if (qty > 0 && qty <= 10000) {
      setQuantity(qty);
    }
  };

  const getVolumeDiscountInfo = (qty: number) => {
    if (qty >= 1000) return { discount: '25%', tier: 'Enterprise' };
    if (qty >= 500) return { discount: '20%', tier: 'Bulk' };
    if (qty >= 250) return { discount: '15%', tier: 'Volume' };
    if (qty >= 100) return { discount: '10%', tier: 'Wholesale' };
    if (qty >= 50) return { discount: '5%', tier: 'Small Batch' };
    return { discount: '0%', tier: 'Individual' };
  };

  const discountInfo = getVolumeDiscountInfo(quantity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Quantity & Cost Calculator</h2>
        <p className="text-muted-foreground">
          Calculate printing costs and determine your order quantity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Quantity Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Quantities */}
              <div>
                <Label>Popular Quantities</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {presetQuantities.map(qty => (
                    <Button
                      key={qty}
                      variant={quantity === qty ? 'default' : 'outline'}
                      onClick={() => handleQuantityChange(qty)}
                      className="h-12"
                    >
                      {qty}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Quantity */}
              <div>
                <Label htmlFor="customQty">Custom Quantity</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="customQty"
                    type="number"
                    min="1"
                    max="10000"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                  <Button onClick={handleCustomQuantitySubmit} variant="outline">
                    Set
                  </Button>
                </div>
              </div>

              {/* Quantity Slider */}
              <div>
                <Label>Adjust Quantity: {quantity}</Label>
                <div className="mt-2">
                  <Slider
                    value={[quantity]}
                    onValueChange={(value) => handleQuantityChange(value[0])}
                    max={1000}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Volume Discount Info */}
              <Alert>
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Volume Tier: <strong>{discountInfo.tier}</strong></span>
                    <Badge variant={discountInfo.discount !== '0%' ? 'default' : 'secondary'}>
                      {discountInfo.discount} discount
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Book Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Book Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span>{bookFormat.width}" × {bookFormat.height}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages:</span>
                <span>{pageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paper:</span>
                <span>{bookFormat.paperType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binding:</span>
                <span>{bookFormat.bindingType}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cost Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Printing Cost:</span>
                  <span className="font-medium">${costs.printingCost}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping Cost:</span>
                  <span className="font-medium">${costs.shippingCost}</span>
                </div>
                
                <hr className="my-2" />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Cost:</span>
                  <span>${costs.totalCost}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cost per Unit:</span>
                  <span className="font-medium">${costs.costPerUnit}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Suggested Retail Price:</span>
                  <span className="font-medium text-green-600">${costs.estimatedRetailPrice}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Profit Margin:</span>
                  <span className="font-medium text-green-600">{costs.profitMargin}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Profit per Book:</span>
                  <span className="font-medium text-green-600">
                    ${(costs.estimatedRetailPrice - costs.costPerUnit).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Potential Profit:</span>
                  <span className="font-medium text-green-600">
                    ${((costs.estimatedRetailPrice - costs.costPerUnit) * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Pricing suggestions are based on industry standards. Adjust based on your market research and positioning.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="space-y-2">
            <Button className="w-full" size="lg">
              Proceed to Order Review
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can adjust quantity later before final order
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookQuantityCalculator;
