import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ShoppingCart, 
  Star, 
  Download, 
  Eye,
  Search,
  Filter,
  DollarSign,
  Users,
  Clock,
  Award
} from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  totalSales: number;
  featuredImage?: string;
  tags?: string[];
  productType: string;
}

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

export default function Storefront() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Fetch products with filters
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/storefront/products', { 
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      status: 'active',
      sessionId,
      limit: 50 
    }],
    refetchInterval: 60000
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (item: CartItem) => 
      fetch('/api/storefront/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          currency: 'USD'
        })
      }).then(res => res.json()),
    onSuccess: (data, variables) => {
      setCartItems(prev => {
        const existing = prev.find(item => item.productId === variables.productId);
        if (existing) {
          return prev.map(item => 
            item.productId === variables.productId 
              ? { ...item, quantity: item.quantity + variables.quantity }
              : item
          );
        }
        return [...prev, variables];
      });
      queryClient.invalidateQueries({ queryKey: ['/api/storefront/cart'] });
    }
  });

  const handleAddToCart = (product: Product) => {
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      price: product.price
    });
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'popular':
        return b.totalSales - a.totalSales;
      case 'newest':
        return b.id - a.id;
      default: // featured
        return b.featured ? 1 : -1;
    }
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'ebook', label: 'E-books' },
    { value: 'course', label: 'Online Courses' },
    { value: 'software', label: 'Software' },
    { value: 'template', label: 'Templates' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' }
  ];

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Empire Digital Store</h1>
              <p className="text-muted-foreground">Premium digital products for your success</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="relative"
                onClick={() => {/* Open cart modal */}}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cartItemCount})
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {formatCurrency(cartTotal)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts?.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.featuredImage ? (
                    <img 
                      src={product.featuredImage} 
                      alt={product.title}
                      className="aspect-video object-cover w-full rounded-t-lg"
                    />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                      <Download className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500">
                      <Award className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  
                  <Badge 
                    variant="outline" 
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  >
                    {product.productType}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    {/* Rating and Sales */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {product.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{product.averageRating.toFixed(1)}</span>
                          <span>({product.reviewCount})</span>
                        </div>
                      )}
                      
                      {product.totalSales > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{product.totalSales} sales</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(product.price, product.currency)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToCart(product)}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!productsLoading && (!filteredProducts || filteredProducts.length === 0) && (
          <div className="text-center py-12">
            <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{products?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Products Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Instant Access</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Digital Delivery</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Enterprise</div>
              <div className="text-sm text-muted-foreground">Grade Security</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}