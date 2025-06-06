import asyncio
import aiohttp
import json
from datetime import datetime
import logging
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
import requests
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RealSocialMediaBot:
    """
    Bot para entregar servicios REALES de redes sociales
    Todos los seguidores, likes y visualizaciones son entregados a los enlaces exactos del usuario
    """
    
    def __init__(self):
        self.setup_driver()
        self.active_accounts = self.load_bot_accounts()
        self.delivery_queue = []
        
    def setup_driver(self):
        """Configurar navegador con opciones realistas"""
        chrome_options = Options()
        # NO usar headless para comportamiento más humano
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
    def load_bot_accounts(self):
        """Cargar cuentas bot reales para entregar servicios"""
        try:
            with open('bot_accounts.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Archivo de cuentas bot no encontrado. Usando cuentas de ejemplo.")
            return {
                'instagram': [
                    {'username': 'bot_account_1', 'password': 'password1', 'active': True},
                    {'username': 'bot_account_2', 'password': 'password2', 'active': True},
                    # Agregar más cuentas reales aquí
                ],
                'tiktok': [
                    {'username': 'tiktok_bot_1', 'password': 'password1', 'active': True},
                    # Agregar cuentas TikTok reales
                ],
                'youtube': [
                    {'username': 'youtube_bot_1', 'password': 'password1', 'active': True},
                    # Agregar cuentas YouTube reales
                ]
            }
    
    async def deliver_instagram_followers(self, target_url, quantity, order_id):
        """
        Entregar seguidores REALES de Instagram al enlace exacto del usuario
        """
        logger.info(f"🎯 Entregando {quantity} seguidores REALES a: {target_url}")
        
        # Extraer username del enlace
        username = self.extract_instagram_username(target_url)
        if not username:
            logger.error(f"No se pudo extraer username de: {target_url}")
            return False
        
        # Verificar que el perfil existe
        if not await self.verify_instagram_profile_exists(target_url):
            logger.error(f"El perfil de Instagram no existe: {target_url}")
            return False
        
        delivered = 0
        bot_accounts = self.active_accounts.get('instagram', [])
        
        if not bot_accounts:
            logger.error("No hay cuentas bot de Instagram disponibles")
            return False
        
        for bot_account in bot_accounts:
            if delivered >= quantity:
                break
                
            try:
                # Login con cuenta bot
                if await self.login_instagram(bot_account):
                    # Navegar al perfil del usuario
                    self.driver.get(target_url)
                    await asyncio.sleep(random.uniform(3, 7))
                    
                    # Buscar y hacer clic en el botón "Seguir"
                    follow_button = await self.find_instagram_follow_button()
                    if follow_button:
                        follow_button.click()
                        delivered += 1
                        
                        logger.info(f"✅ Seguidor #{delivered} entregado por {bot_account['username']}")
                        
                        # Actualizar progreso en tiempo real
                        await self.update_order_progress(order_id, delivered, quantity)
                        
                        # Delay humano entre follows
                        await asyncio.sleep(random.uniform(30, 120))
                    
                    # Logout de la cuenta bot
                    await self.logout_instagram()
                    
            except Exception as e:
                logger.error(f"Error con cuenta bot {bot_account['username']}: {e}")
                continue
        
        logger.info(f"🎉 Entrega completada: {delivered}/{quantity} seguidores reales entregados")
        return delivered == quantity
    
    async def deliver_youtube_watch_hours(self, video_url, hours_requested, order_id):
        """
        Entregar horas de reproducción REALES de YouTube al video exacto del usuario
        """
        logger.info(f"🎯 Entregando {hours_requested} horas REALES de reproducción a: {video_url}")
        
        # Verificar que el video existe y es público
        if not await self.verify_youtube_video_exists(video_url):
            logger.error(f"El video de YouTube no existe o no es público: {video_url}")
            return False
        
        # Extraer video ID
        video_id = self.extract_youtube_video_id(video_url)
        if not video_id:
            logger.error(f"No se pudo extraer video ID de: {video_url}")
            return False
        
        delivered_hours = 0
        bot_accounts = self.active_accounts.get('youtube', [])
        
        # Calcular sesiones de reproducción necesarias
        # Cada sesión reproduce el video por 1-4 horas
        sessions_needed = max(1, hours_requested // 2)
        
        for session in range(sessions_needed):
            if delivered_hours >= hours_requested:
                break
            
            try:
                # Usar cuenta bot diferente para cada sesión
                bot_account = bot_accounts[session % len(bot_accounts)]
                
                # Login con cuenta bot
                if await self.login_youtube(bot_account):
                    # Navegar al video
                    self.driver.get(video_url)
                    await asyncio.sleep(random.uniform(5, 10))
                    
                    # Iniciar reproducción
                    play_button = await self.find_youtube_play_button()
                    if play_button:
                        play_button.click()
                        
                        # Reproducir por tiempo determinado
                        session_duration = min(
                            random.uniform(1, 4),  # 1-4 horas por sesión
                            hours_requested - delivered_hours
                        )
                        
                        logger.info(f"▶️ Sesión #{session + 1}: Reproduciendo por {session_duration:.1f} horas")
                        
                        # Simular reproducción real con interacciones
                        await self.simulate_real_youtube_watching(session_duration, order_id, delivered_hours, hours_requested)
                        
                        delivered_hours += session_duration
                        
                        logger.info(f"✅ Horas entregadas: {delivered_hours:.1f}/{hours_requested}")
                    
                    # Logout
                    await self.logout_youtube()
                    
                    # Delay entre sesiones
                    await asyncio.sleep(random.uniform(300, 900))  # 5-15 minutos
                    
            except Exception as e:
                logger.error(f"Error en sesión {session}: {e}")
                continue
        
        logger.info(f"🎉 Entrega completada: {delivered_hours:.1f}/{hours_requested} horas reales entregadas")
        return delivered_hours >= hours_requested * 0.95  # 95% de cumplimiento mínimo
    
    async def deliver_tiktok_followers(self, profile_url, quantity, order_id):
        """
        Entregar seguidores REALES de TikTok al perfil exacto del usuario
        """
        logger.info(f"🎯 Entregando {quantity} seguidores REALES de TikTok a: {profile_url}")
        
        # Extraer username
        username = self.extract_tiktok_username(profile_url)
        if not username:
            logger.error(f"No se pudo extraer username de TikTok: {profile_url}")
            return False
        
        # Verificar que el perfil existe
        if not await self.verify_tiktok_profile_exists(profile_url):
            logger.error(f"El perfil de TikTok no existe: {profile_url}")
            return False
        
        delivered = 0
        bot_accounts = self.active_accounts.get('tiktok', [])
        
        for bot_account in bot_accounts:
            if delivered >= quantity:
                break
                
            try:
                # Login con cuenta bot
                if await self.login_tiktok(bot_account):
                    # Navegar al perfil
                    self.driver.get(profile_url)
                    await asyncio.sleep(random.uniform(5, 10))
                    
                    # Buscar botón "Follow"
                    follow_button = await self.find_tiktok_follow_button()
                    if follow_button:
                        follow_button.click()
                        delivered += 1
                        
                        logger.info(f"✅ Seguidor TikTok #{delivered} entregado")
                        
                        # Actualizar progreso
                        await self.update_order_progress(order_id, delivered, quantity)
                        
                        # Delay humano
                        await asyncio.sleep(random.uniform(45, 180))
                    
                    await self.logout_tiktok()
                    
            except Exception as e:
                logger.error(f"Error con cuenta TikTok {bot_account['username']}: {e}")
                continue
        
        logger.info(f"🎉 TikTok: {delivered}/{quantity} seguidores reales entregados")
        return delivered == quantity
    
    def extract_instagram_username(self, url):
        """Extraer username de URL de Instagram"""
        try:
            parsed = urlparse(url)
            path_parts = parsed.path.strip('/').split('/')
            return path_parts[0] if path_parts else None
        except:
            return None
    
    def extract_youtube_video_id(self, url):
        """Extraer video ID de URL de YouTube"""
        try:
            parsed = urlparse(url)
            if 'youtube.com' in parsed.netloc:
                query_params = parse_qs(parsed.query)
                return query_params.get('v', [None])[0]
            elif 'youtu.be' in parsed.netloc:
                return parsed.path.strip('/')
            return None
        except:
            return None
    
    def extract_tiktok_username(self, url):
        """Extraer username de URL de TikTok"""
        try:
            parsed = urlparse(url)
            path_parts = parsed.path.strip('/').split('/')
            for part in path_parts:
                if part.startswith('@'):
                    return part[1:]  # Remover @
            return None
        except:
            return None
    
    async def verify_instagram_profile_exists(self, url):
        """Verificar que el perfil de Instagram existe y es público"""
        try:
            self.driver.get(url)
            await asyncio.sleep(5)
            
            # Buscar indicadores de perfil válido
            profile_indicators = [
                "//h2[contains(@class, 'username')]",
                "//h1[contains(@class, 'username')]",
                "//span[contains(text(), 'posts')]",
                "//a[contains(@href, '/followers/')]"
            ]
            
            for indicator in profile_indicators:
                try:
                    element = self.driver.find_element(By.XPATH, indicator)
                    if element:
                        logger.info(f"✅ Perfil de Instagram verificado: {url}")
                        return True
                except:
                    continue
            
            logger.error(f"❌ Perfil de Instagram no válido: {url}")
            return False
            
        except Exception as e:
            logger.error(f"Error verificando perfil de Instagram: {e}")
            return False
    
    async def verify_youtube_video_exists(self, url):
        """Verificar que el video de YouTube existe y es público"""
        try:
            self.driver.get(url)
            await asyncio.sleep(5)
            
            # Buscar player de video
            video_player = self.driver.find_elements(By.ID, "movie_player")
            if video_player:
                logger.info(f"✅ Video de YouTube verificado: {url}")
                return True
            
            # Verificar si hay mensaje de error
            error_messages = self.driver.find_elements(By.XPATH, "//div[contains(text(), 'not available')]")
            if error_messages:
                logger.error(f"❌ Video no disponible: {url}")
                return False
            
            return False
            
        except Exception as e:
            logger.error(f"Error verificando video de YouTube: {e}")
            return False
    
    async def verify_tiktok_profile_exists(self, url):
        """Verificar que el perfil de TikTok existe"""
        try:
            self.driver.get(url)
            await asyncio.sleep(5)
            
            # Buscar elementos del perfil
            profile_elements = self.driver.find_elements(By.XPATH, "//h1[@data-e2e='user-title']")
            if profile_elements:
                logger.info(f"✅ Perfil de TikTok verificado: {url}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verificando perfil de TikTok: {e}")
            return False
    
    async def login_instagram(self, bot_account):
        """Login real en Instagram con cuenta bot"""
        try:
            self.driver.get("https://www.instagram.com/accounts/login/")
            await asyncio.sleep(random.uniform(3, 7))
            
            # Ingresar username
            username_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            username_input.send_keys(bot_account['username'])
            
            # Ingresar password
            password_input = self.driver.find_element(By.NAME, "password")
            password_input.send_keys(bot_account['password'])
            
            # Click login
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            
            await asyncio.sleep(random.uniform(5, 10))
            
            # Verificar login exitoso
            if "instagram.com" in self.driver.current_url and "login" not in self.driver.current_url:
                logger.info(f"✅ Login exitoso en Instagram: {bot_account['username']}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error en login de Instagram: {e}")
            return False
    
    async def find_instagram_follow_button(self):
        """Encontrar botón de seguir en Instagram"""
        try:
            # Diferentes selectores para el botón de seguir
            follow_selectors = [
                "//button[contains(text(), 'Follow')]",
                "//button[contains(text(), 'Seguir')]",
                "//button[@type='button' and contains(@class, 'follow')]",
                "//div[contains(text(), 'Follow')]//parent::button"
            ]
            
            for selector in follow_selectors:
                try:
                    button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                    return button
                except:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error encontrando botón de seguir: {e}")
            return None
    
    async def simulate_real_youtube_watching(self, duration_hours, order_id, current_hours, total_hours):
        """Simular visualización real de YouTube con interacciones humanas"""
        duration_seconds = duration_hours * 3600
        start_time = time.time()
        
        while time.time() - start_time < duration_seconds:
            try:
                # Interacciones humanas aleatorias
                actions = ActionChains(self.driver)
                
                # Mover mouse ocasionalmente
                if random.random() < 0.1:  # 10% probabilidad
                    actions.move_by_offset(random.randint(-50, 50), random.randint(-50, 50))
                    actions.perform()
                
                # Pausar y reanudar ocasionalmente
                if random.random() < 0.05:  # 5% probabilidad
                    video_player = self.driver.find_element(By.ID, "movie_player")
                    video_player.click()  # Pausar
                    await asyncio.sleep(random.uniform(5, 30))
                    video_player.click()  # Reanudar
                
                # Actualizar progreso cada 10 minutos
                elapsed_hours = (time.time() - start_time) / 3600
                if int(elapsed_hours * 6) > int((elapsed_hours - 0.1) * 6):  # Cada 10 minutos
                    await self.update_order_progress(
                        order_id, 
                        current_hours + elapsed_hours, 
                        total_hours
                    )
                
                await asyncio.sleep(60)  # Verificar cada minuto
                
            except Exception as e:
                logger.error(f"Error en simulación de visualización: {e}")
                break
    
    async def update_order_progress(self, order_id, delivered, total):
        """Actualizar progreso del pedido en tiempo real"""
        progress = (delivered / total) * 100
        
        # Guardar progreso en archivo
        progress_data = {
            'order_id': order_id,
            'delivered': delivered,
            'total': total,
            'progress': progress,
            'updated_at': datetime.now().isoformat(),
            'status': 'processing' if progress < 100 else 'completed'
        }
        
        try:
            # Cargar progreso existente
            try:
                with open('order_progress.json', 'r') as f:
                    all_progress = json.load(f)
            except FileNotFoundError:
                all_progress = {}
            
            # Actualizar progreso de esta orden
            all_progress[str(order_id)] = progress_data
            
            # Guardar
            with open('order_progress.json', 'w') as f:
                json.dump(all_progress, f, indent=2)
            
            logger.info(f"📊 Progreso actualizado - Orden #{order_id}: {progress:.1f}% ({delivered}/{total})")
            
        except Exception as e:
            logger.error(f"Error actualizando progreso: {e}")
    
    async def process_real_order(self, order_data):
        """Procesar una orden real con entrega a enlaces exactos"""
        order_id = order_data.get('id')
        service_type = order_data.get('service', '').lower()
        target_url = order_data.get('url')
        quantity = order_data.get('quantity')
        
        logger.info(f"🚀 Procesando orden REAL #{order_id}")
        logger.info(f"📋 Servicio: {service_type}")
        logger.info(f"🎯 URL objetivo: {target_url}")
        logger.info(f"📊 Cantidad: {quantity}")
        
        try:
            success = False
            
            if 'instagram' in service_type and 'seguidores' in service_type:
                success = await self.deliver_instagram_followers(target_url, quantity, order_id)
                
            elif 'youtube' in service_type and ('horas' in service_type or 'hours' in service_type):
                success = await self.deliver_youtube_watch_hours(target_url, quantity, order_id)
                
            elif 'tiktok' in service_type and 'seguidores' in service_type:
                success = await self.deliver_tiktok_followers(target_url, quantity, order_id)
                
            # Agregar más servicios aquí...
            
            if success:
                logger.info(f"🎉 Orden #{order_id} completada exitosamente")
                await self.mark_order_completed(order_id)
            else:
                logger.error(f"❌ Orden #{order_id} falló")
                await self.mark_order_failed(order_id, "Error en entrega")
            
            return success
            
        except Exception as e:
            logger.error(f"Error procesando orden #{order_id}: {e}")
            await self.mark_order_failed(order_id, str(e))
            return False
    
    async def mark_order_completed(self, order_id):
        """Marcar orden como completada"""
        completion_data = {
            'order_id': order_id,
            'status': 'completed',
            'completed_at': datetime.now().isoformat(),
            'delivery_confirmed': True
        }
        
        try:
            with open('completed_orders.json', 'r') as f:
                completed = json.load(f)
        except FileNotFoundError:
            completed = []
        
        completed.append(completion_data)
        
        with open('completed_orders.json', 'w') as f:
            json.dump(completed, f, indent=2)
        
        logger.info(f"✅ Orden #{order_id} marcada como completada")
    
    async def mark_order_failed(self, order_id, error_message):
        """Marcar orden como fallida"""
        failure_data = {
            'order_id': order_id,
            'status': 'failed',
            'error': error_message,
            'failed_at': datetime.now().isoformat()
        }
        
        try:
            with open('failed_orders.json', 'r') as f:
                failed = json.load(f)
        except FileNotFoundError:
            failed = []
        
        failed.append(failure_data)
        
        with open('failed_orders.json', 'w') as f:
            json.dump(failed, f, indent=2)
        
        logger.error(f"❌ Orden #{order_id} marcada como fallida: {error_message}")
    
    def cleanup(self):
        """Limpiar recursos"""
        if hasattr(self, 'driver'):
            self.driver.quit()

# Función principal para ejecutar el bot
async def main():
    """Ejecutar bot de servicios reales"""
    bot = RealSocialMediaBot()
    
    try:
        # Ejemplo de orden real
        test_order = {
            'id': 12345,
            'service': 'Instagram Seguidores',
            'url': 'https://instagram.com/usuario_real',  # URL real del cliente
            'quantity': 100
        }
        
        await bot.process_real_order(test_order)
        
    except KeyboardInterrupt:
        logger.info("Bot detenido por el usuario")
    finally:
        bot.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
