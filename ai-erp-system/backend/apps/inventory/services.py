from django.db.models import Q, Sum, F
from django.db import transaction
from .models import Product, Category
from typing import Optional, List, Dict

class InventoryService:
    @staticmethod
    @transaction.atomic
    def create_product(data: Dict) -> Product:
        """Create a new product with validation"""
        return Product.objects.create(**data)

    @staticmethod
    def get_product_by_sku(sku: str) -> Optional[Product]:
        """Get product by SKU"""
        return Product.objects.filter(sku=sku, is_active=True).first()

    @staticmethod
    def update_stock(product_id: int, quantity: int, operation: str = 'add') -> Product:
        """Update product stock"""
        product = Product.objects.get(id=product_id)
        if operation == 'add':
            product.stock += quantity
        elif operation == 'subtract':
            product.stock = max(0, product.stock - quantity)
        elif operation == 'set':
            product.stock = quantity
        product.save()
        return product

    @staticmethod
    def get_low_stock_products() -> List[Product]:
        """Get products with low stock"""
        return Product.objects.filter(
            stock__lte=F('min_stock_level'),
            is_active=True
        )

    @staticmethod
    def search_products(query: str) -> List[Product]:
        """Search products by name, SKU, or barcode"""
        return Product.objects.filter(
            Q(name__icontains=query) |
            Q(sku__icontains=query) |
            Q(barcode__icontains=query),
            is_active=True
        )

    @staticmethod
    def get_inventory_value() -> Dict:
        """Calculate total inventory value"""
        result = Product.objects.aggregate(
            total_value=Sum(F('stock') * F('cost_price')),
            total_items=Sum('stock')
        )
        return result