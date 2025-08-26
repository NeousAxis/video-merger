import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Package, CreditCard, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { luluAPI, LuluAddress, LuluOrder } from '@/utils/lulu-api';
import { CostCalculation } from '@/types';

interface OrderSummaryProps {
  bookData: {
    title: string;
    author: string;
    pageCount: number;
    format: {
      width: number;
      height: number;
      paperType: string;
      bindingType: string;
    };
    coverUrl?: string;
    interiorUrl?: string;
  };
  quantity: number;
  costs: CostCalculation;
  onOrderComplete: (orderId: string) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  bookData,
  quantity,
  costs,
  onOrderComplete
}) => {
  const [shippingAddress, setShippingAddress] = useState<LuluAddress>({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state_code: '',
    country_code: 'US',
    postcode: '',
    phone_number: ''
  });
  
  const [contactEmail, setContactEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const handleAddressChange = (field: keyof LuluAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!contactEmail || !contactEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!luluAPI.validateShippingAddress(shippingAddress)) {
      setError('Please fill in all required shipping address fields');
      return false;
    }

    return true;
  };

  const simulateProgress = (steps: string[], duration: number = 3000) => {
    const stepDuration = duration / steps.length;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProcessingStep(steps[currentStep]);
        setProgress(((currentStep + 1) / steps.length) * 100);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, stepDuration);

    return interval;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate order processing steps
      const steps = [
        'Validating book specifications...',
        'Creating project with Lulu...',
        'Calculating final costs...',
        'Processing payment...',
        'Submitting print order...',
        'Order confirmed!'
      ];

      const progressInterval = simulateProgress(steps, 5000);

      // For demo purposes, we'll simulate the Lulu API calls
      // In production, these would be actual API calls
      
      // Step 1: Create project
      setProcessingStep('Creating project with Lulu...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate project creation
      const projectData = {
        name: `${bookData.title} - ${new Date().toISOString()}`,
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl || '/placeholder-cover.jpg',
        interiorUrl: bookData.interiorUrl || '/placeholder-interior.pdf',
        format: bookData.format,
        pageCount: bookData.pageCount
      };

      // Step 2: Calculate costs
      setProcessingStep('Calculating final costs...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Create order
      setProcessingStep('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStep('Submitting print order...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful order creation
      const mockOrderId = `LULU_${Date.now()}`;
      setOrderId(mockOrderId);
      setOrderStatus('confirmed');
      setProcessingStep('Order confirmed!');
      setProgress(100);

      // Clear the progress interval
      clearInterval(progressInterval);

      // Notify parent component
      onOrderComplete(mockOrderId);

    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Order placement failed:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
        <p className="text-muted-foreground">
          Review your order details and complete your purchase
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {orderId && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Order placed successfully! Order ID: <strong>{orderId}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Book Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{bookData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author:</span>
                <span className="font-medium">{bookData.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages:</span>
                <span className="font-medium">{bookData.pageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">
                  {bookData.format.width}" × {bookData.format.height}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paper:</span>
                <span className="font-medium">{bookData.format.paperType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binding:</span>
                <span className="font-medium">{bookData.format.bindingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{quantity}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={shippingAddress.name}
                    onChange={(e) => handleAddressChange('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone_number}
                    onChange={(e) => handleAddressChange('phone_number', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="street1">Street Address *</Label>
                <Input
                  id="street1"
                  value={shippingAddress.street1}
                  onChange={(e) => handleAddressChange('street1', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <Label htmlFor="street2">Apartment, suite, etc.</Label>
                <Input
                  id="street2"
                  value={shippingAddress.street2}
                  onChange={(e) => handleAddressChange('street2', e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state_code}
                    onChange={(e) => handleAddressChange('state_code', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postcode">ZIP Code *</Label>
                  <Input
                    id="postcode"
                    value={shippingAddress.postcode}
                    onChange={(e) => handleAddressChange('postcode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={shippingAddress.country_code}
                    onChange={(e) => handleAddressChange('country_code', e.target.value)}
                    placeholder="US"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cost Summary & Payment */}
        <div className="space-y-6">
          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Printing Cost:</span>
                  <span>${costs.printingCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Cost:</span>
                  <span>${costs.shippingCost}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${costs.totalCost}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Cost per unit:</span>
                  <span>${costs.costPerUnit}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{processingStep}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </CardContent>
            </Card>
          )}

          {/* Order Status */}
          {orderStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Confirmed</Badge>
                    <span className="text-sm text-muted-foreground">
                      Your order has been submitted to Lulu for printing
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You will receive email updates about your order status.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={isProcessing || !!orderId}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : orderId ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Order Placed
              </>
            ) : (
              `Place Order - $${costs.totalCost}`
            )}
          </Button>
          
          {!orderId && (
            <p className="text-xs text-center text-muted-foreground">
              By placing this order, you agree to Lulu's terms of service and printing policies.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
