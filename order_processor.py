#!/usr/bin/env python3
"""
Procesador de órdenes reales para Jorling Seguidores
Este script procesa las órdenes de los usuarios y entrega servicios REALES
"""

import asyncio
import json
import logging
from datetime import datetime
from real_social_media_bots import RealSocialMediaBot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderProcessor:
    def __init__(self):
        self.bot = RealSocialMediaBot()
        self.pending_orders_file = 'pending_orders.json'
        
    def load_pending_orders(self):
        """Cargar órdenes pendientes desde la base de datos/archivo"""
        try:
            with open(self.pending_orders_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.info("No hay órdenes pendientes")
            return []
    
    def save_pending_orders(self, orders):
        """Guardar órdenes pendientes"""
        with open(self.pending_orders_file, 'w') as f:
            json.dump(orders, f, indent=2)
    
    async def process_all_pending_orders(self):
        """Procesar todas las órdenes pendientes"""
        orders = self.load_pending_orders()
        
        if not orders:
            logger.info("No hay órdenes pendientes para procesar")
            return
        
        logger.info(f"📋 Procesando {len(orders)} órdenes pendientes...")
        
        processed_orders = []
        
        for order in orders:
            if order.get('status') != 'pending':
                processed_orders.append(order)
                continue
            
            logger.info(f"🚀 Procesando orden #{order['id']}")
            
            # Marcar como procesando
            order['status'] = 'processing'
            order['started_at'] = datetime.now().isoformat()
            
            # Procesar la orden
            success = await self.bot.process_real_order(order)
            
            if success:
                order['status'] = 'completed'
                order['completed_at'] = datetime.now().isoformat()
                logger.info(f"✅ Orden #{order['id']} completada")
            else:
                order['status'] = 'failed'
                order['failed_at'] = datetime.now().isoformat()
                logger.error(f"❌ Orden #{order['id']} falló")
            
            processed_orders.append(order)
            
            # Guardar progreso
            self.save_pending_orders(processed_orders)
            
            # Delay entre órdenes
            await asyncio.sleep(30)
        
        logger.info("🎉 Todas las órdenes han sido procesadas")
    
    async def add_test_order(self, service, url, quantity):
        """Añadir una orden de prueba"""
        orders = self.load_pending_orders()
        
        new_order = {
            'id': len(orders) + 1,
            'service': service,
            'url': url,
            'quantity': quantity,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'user_id': 'test_user'
        }
        
        orders.append(new_order)
        self.save_pending_orders(orders)
        
        logger.info(f"📝 Orden de prueba añadida: {service} - {quantity} - {url}")
    
    def cleanup(self):
        """Limpiar recursos"""
        self.bot.cleanup()

async def main():
    """Función principal"""
    processor = OrderProcessor()
    
    try:
        # Ejemplo: Añadir orden de prueba
        # await processor.add_test_order(
        #     "Instagram Seguidores",
        #     "https://instagram.com/usuario_real",
        #     100
        # )
        
        # Procesar todas las órdenes pendientes
        await processor.process_all_pending_orders()
        
    except KeyboardInterrupt:
        logger.info("Procesador detenido por el usuario")
    finally:
        processor.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
