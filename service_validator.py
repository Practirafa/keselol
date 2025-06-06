#!/usr/bin/env python3
"""
Validador de servicios para asegurar entregas reales
"""

import asyncio
import requests
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ServiceValidator:
    """Validar que los enlaces de los usuarios sean válidos antes de procesar"""
    
    @staticmethod
    async def validate_instagram_url(url):
        """Validar URL de Instagram"""
        try:
            parsed = urlparse(url)
            
            # Verificar dominio
            if 'instagram.com' not in parsed.netloc:
                return False, "URL no es de Instagram"
            
            # Verificar formato de perfil
            path_parts = parsed.path.strip('/').split('/')
            if not path_parts or not path_parts[0]:
                return False, "URL de perfil inválida"
            
            username = path_parts[0]
            
            # Verificar que no sea una URL de post o historia
            if len(path_parts) > 1 and path_parts[1] in ['p', 'reel', 'stories']:
                return False, "URL debe ser de perfil, no de post"
            
            # Verificar que el perfil existe (request simple)
            try:
                response = requests.head(url, timeout=10)
                if response.status_code == 200:
                    return True, f"Perfil válido: @{username}"
                else:
                    return False, "Perfil no encontrado o privado"
            except:
                return False, "Error verificando perfil"
                
        except Exception as e:
            return False, f"Error validando URL: {str(e)}"
    
    @staticmethod
    async def validate_youtube_url(url):
        """Validar URL de YouTube"""
        try:
            parsed = urlparse(url)
            
            # Verificar dominio
            if not any(domain in parsed.netloc for domain in ['youtube.com', 'youtu.be']):
                return False, "URL no es de YouTube"
            
            # Extraer video ID
            if 'youtube.com' in parsed.netloc:
                if 'watch?v=' not in url:
                    return False, "URL debe ser de un video específico"
                video_id = url.split('watch?v=')[1].split('&')[0]
            elif 'youtu.be' in parsed.netloc:
                video_id = parsed.path.strip('/')
            else:
                return False, "Formato de URL inválido"
            
            if not video_id or len(video_id) != 11:
                return False, "ID de video inválido"
            
            # Verificar que el video existe
            try:
                response = requests.head(url, timeout=10)
                if response.status_code == 200:
                    return True, f"Video válido: {video_id}"
                else:
                    return False, "Video no encontrado o privado"
            except:
                return False, "Error verificando video"
                
        except Exception as e:
            return False, f"Error validando URL: {str(e)}"
    
    @staticmethod
    async def validate_tiktok_url(url):
        """Validar URL de TikTok"""
        try:
            parsed = urlparse(url)
            
            # Verificar dominio
            if 'tiktok.com' not in parsed.netloc:
                return False, "URL no es de TikTok"
            
            # Verificar formato de perfil
            path_parts = parsed.path.strip('/').split('/')
            if not path_parts or not path_parts[0].startswith('@'):
                return False, "URL debe ser de perfil (@usuario)"
            
            username = path_parts[0][1:]  # Remover @
            
            # Verificar que no sea URL de video
            if len(path_parts) > 1 and path_parts[1] == 'video':
                return False, "URL debe ser de perfil, no de video"
            
            return True, f"Perfil TikTok válido: @{username}"
                
        except Exception as e:
            return False, f"Error validando URL: {str(e)}"
    
    @staticmethod
    async def validate_service_request(service_type, url, quantity):
        """Validar solicitud completa de servicio"""
        logger.info(f"🔍 Validando: {service_type} - {url} - {quantity}")
        
        # Validar cantidad
        if quantity <= 0:
            return False, "La cantidad debe ser mayor a 0"
        
        # Validar según tipo de servicio
        if 'instagram' in service_type.lower():
            if quantity > 10000:
                return False, "Máximo 10,000 seguidores por orden"
            return await ServiceValidator.validate_instagram_url(url)
            
        elif 'youtube' in service_type.lower():
            if 'horas' in service_type.lower() or 'hours' in service_type.lower():
                if quantity > 4000:
                    return False, "Máximo 4,000 horas por orden"
            else:  # suscriptores
                if quantity > 5000:
                    return False, "Máximo 5,000 suscriptores por orden"
            return await ServiceValidator.validate_youtube_url(url)
            
        elif 'tiktok' in service_type.lower():
            if quantity > 8000:
                return False, "Máximo 8,000 seguidores por orden"
            return await ServiceValidator.validate_tiktok_url(url)
        
        else:
            return False, "Tipo de servicio no soportado"

# Ejemplo de uso
async def test_validator():
    """Probar el validador"""
    test_cases = [
        ("Instagram Seguidores", "https://instagram.com/cristiano", 500),
        ("YouTube Horas", "https://youtube.com/watch?v=dQw4w9WgXcQ", 1000),
        ("TikTok Seguidores", "https://tiktok.com/@charlidamelio", 300),
    ]
    
    for service, url, quantity in test_cases:
        valid, message = await ServiceValidator.validate_service_request(service, url, quantity)
        status = "✅" if valid else "❌"
        logger.info(f"{status} {service}: {message}")

if __name__ == "__main__":
    asyncio.run(test_validator())
