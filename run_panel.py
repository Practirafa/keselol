#!/usr/bin/env python3
import os
import sys
import subprocess
import platform

def clear_screen():
    """Limpiar la pantalla según el sistema operativo"""
    if platform.system() == "Windows":
        os.system('cls')
    else:
        os.system('clear')

def check_dependencies():
    """Verificar dependencias necesarias"""
    try:
        import colorama
        print("✅ Colorama instalado")
    except ImportError:
        print("⚠️ Colorama no está instalado. Instalando...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "colorama"])
        print("✅ Colorama instalado correctamente")

def main():
    """Función principal para ejecutar el panel de administración"""
    clear_screen()
    print("=" * 50)
    print("      PANEL DE ADMINISTRACIÓN JORLING SEGUIDORES")
    print("=" * 50)
    print("\nVerificando dependencias...")
    check_dependencies()
    
    print("\nIniciando panel de administración...\n")
    
    # Ejecutar el script de administración de saldos
    script_path = os.path.join(os.path.dirname(__file__), "admin_balance_manager.py")
    
    if not os.path.exists(script_path):
        print(f"❌ Error: No se encontró el script en {script_path}")
        sys.exit(1)
    
    try:
        subprocess.call([sys.executable, script_path])
    except Exception as e:
        print(f"❌ Error al ejecutar el panel de administración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
